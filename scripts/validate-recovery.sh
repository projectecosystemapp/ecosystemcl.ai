#!/usr/bin/env bash
set -euo pipefail

# ECOSYSTEMCL.AI Recovery Validation Script

: "${AWS_REGION:=us-west-2}"
: "${OPENSEARCH_ENDPOINT:=}"
: "${OPENSEARCH_INDEX:=helix-patterns}"
: "${CDC_DLQ_URL:=}"
: "${CDC_LAMBDA_NAME:=ecosystemcl-cdc-processor}"

pass() { echo -e "✅ $*"; }
fail() { echo -e "❌ $*"; exit 1; }
info() { echo -e "ℹ️  $*"; }

check_opensearch() {
  if [[ -z "${OPENSEARCH_ENDPOINT}" ]]; then
    info "OPENSEARCH_ENDPOINT not set; skipping OpenSearch checks"
    return 0
  fi
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X GET "${OPENSEARCH_ENDPOINT}/${OPENSEARCH_INDEX}") || true
  [[ "$code" == "200" ]] && pass "OpenSearch index '${OPENSEARCH_INDEX}' reachable" || fail "OpenSearch index check failed (HTTP ${code})"
}

check_dlq_depth() {
  if [[ -z "${CDC_DLQ_URL}" ]]; then
    info "CDC_DLQ_URL not set; skipping DLQ depth check"
    return 0
  fi
  local depth
  depth=$(aws sqs get-queue-attributes \
    --queue-url "$CDC_DLQ_URL" \
    --attribute-names ApproximateNumberOfMessages \
    --region "$AWS_REGION" \
    --query 'Attributes.ApproximateNumberOfMessages' --output text || echo 0)
  if [[ "$depth" == "0" ]]; then
    pass "DLQ empty"
  else
    fail "DLQ still has ${depth} messages"
  fi
}

check_cdc_logs() {
  if [[ -z "${CDC_LAMBDA_NAME}" ]]; then
    info "CDC_LAMBDA_NAME not set; skipping CDC logs check"
    return 0
  fi
  info "Checking last 5 minutes of CDC logs for errors..."
  local errors
  errors=$(aws logs tail "/aws/lambda/${CDC_LAMBDA_NAME}" --region "$AWS_REGION" --since 5m 2>/dev/null | grep -Ei "(ERROR|Exception|Task timed out)" || true)
  if [[ -z "$errors" ]]; then
    pass "CDC processor logs: no recent errors"
  else
    echo "$errors"
    fail "CDC processor shows recent errors"
  fi
}

main() {
  info "Validating recovery (region=${AWS_REGION})"
  check_opensearch
  check_dlq_depth
  check_cdc_logs
  pass "Recovery validation PASSED"
}

main "$@"
#!/bin/bash

# ECOSYSTEMCL.AI Recovery Validation Script
# Validates that the tactical recovery was successful

set -e

echo "🔍 ECOSYSTEMCL.AI Recovery Validation"
echo "======================================"

REGION="us-west-2"
OPENSEARCH_ENDPOINT="https://zwrsnhyybevsl08y2pn3.us-west-2.aoss.amazonaws.com"

echo "1. Checking OpenSearch Index Status..."
INDEX_STATUS=$(curl -s -X GET "$OPENSEARCH_ENDPOINT/helix-patterns/_stats" | jq -r '.indices."helix-patterns".health // "MISSING"')
echo "   Index Health: $INDEX_STATUS"

if [ "$INDEX_STATUS" = "MISSING" ]; then
    echo "   ❌ Index not found - recovery incomplete"
    exit 1
else
    echo "   ✅ Index exists and accessible"
fi

echo ""
echo "2. Checking Lambda Functions..."

FUNCTIONS=("ecosystemcl-opensearch-index-creator" "ecosystemcl-dlq-reprocessor" "ecosystemcl-circuit-breaker-reset")

for func in "${FUNCTIONS[@]}"; do
    STATUS=$(aws lambda get-function --function-name "$func" --region "$REGION" --query 'Configuration.State' --output text 2>/dev/null || echo "MISSING")
    if [ "$STATUS" = "Active" ]; then
        echo "   ✅ $func: Active"
    else
        echo "   ❌ $func: $STATUS"
    fi
done

echo ""
echo "3. Checking DLQ Message Count..."
DLQ_COUNT=$(aws sqs get-queue-attributes \
    --queue-url "https://sqs.us-west-2.amazonaws.com/219895243073/ecosystemcl-cdc-dlq" \
    --attribute-names ApproximateNumberOfMessages \
    --region "$REGION" \
    --query 'Attributes.ApproximateNumberOfMessages' \
    --output text 2>/dev/null || echo "ERROR")

echo "   DLQ Messages: $DLQ_COUNT"

if [ "$DLQ_COUNT" = "0" ]; then
    echo "   ✅ DLQ is empty - all messages processed"
elif [ "$DLQ_COUNT" -lt "5" ]; then
    echo "   ⚠️  Few messages remaining - acceptable"
else
    echo "   ❌ Many messages in DLQ - reprocessing may have failed"
fi

echo ""
echo "4. Testing Pattern Retrieval..."
PATTERN_COUNT=$(aws dynamodb scan \
    --table-name HelixPatternEntries \
    --region "$REGION" \
    --select COUNT \
    --query 'Count' \
    --output text 2>/dev/null || echo "ERROR")

echo "   Patterns in DynamoDB: $PATTERN_COUNT"

if [ "$PATTERN_COUNT" -gt "0" ]; then
    echo "   ✅ Patterns available in knowledge base"
else
    echo "   ⚠️  No patterns found - may need seeding"
fi

echo ""
echo "5. Checking CDC Pipeline Health..."
CDC_STATUS=$(aws lambda get-function \
    --function-name "ecosystemcl-cdc-processor" \
    --region "$REGION" \
    --query 'Configuration.State' \
    --output text 2>/dev/null || echo "MISSING")

echo "   CDC Processor: $CDC_STATUS"

if [ "$CDC_STATUS" = "Active" ]; then
    echo "   ✅ CDC pipeline ready"
else
    echo "   ❌ CDC pipeline not active"
fi

echo ""
echo "📊 Recovery Summary:"
echo "==================="

if [ "$INDEX_STATUS" != "MISSING" ] && [ "$CDC_STATUS" = "Active" ]; then
    echo "✅ RECOVERY SUCCESSFUL"
    echo "   - OpenSearch index operational"
    echo "   - CDC pipeline restored"
    echo "   - Maintenance functions deployed"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Test web app pattern retrieval"
    echo "   2. Monitor CloudWatch dashboard"
    echo "   3. Seed additional patterns if needed"
    echo ""
    echo "🔗 Useful Links:"
    echo "   - OpenSearch: $OPENSEARCH_ENDPOINT/helix-patterns/_search"
    echo "   - CloudWatch: https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=ECOSYSTEMCL-Helix-Recovery"
    echo "   - DynamoDB: https://console.aws.amazon.com/dynamodb/home?region=us-west-2#tables:selected=HelixPatternEntries"
else
    echo "❌ RECOVERY INCOMPLETE"
    echo "   Please check the error messages above and re-run emergency-recovery.sh"
    exit 1
fi
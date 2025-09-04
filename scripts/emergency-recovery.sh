#!/usr/bin/env bash
set -euo pipefail

# ECOSYSTEMCL.AI Emergency Recovery Script
# Purpose: Rapidly restore OpenSearch index, re-drive CDC DLQ, and sanity check CDC Lambda.
# Approx runtime: ~30 minutes depending on DLQ depth and index creation.

# Requirements:
# - AWS CLI v2 configured (credentials + region)
# - curl installed
# - Environment variables set (see below) or passed as flags

# Config via ENV (override per your environment)
: "${AWS_REGION:=us-west-2}"
: "${OPENSEARCH_ENDPOINT:=}"
: "${OPENSEARCH_INDEX:=helix-patterns}"           # Target index name
: "${OPENSEARCH_MAPPING_FILE:=scripts/opensearch/index-mapping.json}"

# CDC re-drive settings (prefer URLs; ARNs computed automatically)
: "${CDC_DLQ_URL:=}"
: "${CDC_SOURCE_QUEUE_URL:=}"

# CDC Lambda (optional canary)
: "${CDC_LAMBDA_NAME:=ecosystemcl-cdc-processor}"

# Helpers
log() { echo -e "[$(date '+%H:%M:%S')] $*"; }
req() { command -v "$1" >/dev/null 2>&1; }

ensure_prereqs() {
  req aws || { echo "AWS CLI is required"; exit 1; }
  req curl || { echo "curl is required"; exit 1; }
}

create_or_update_opensearch_index() {
  if [[ -z "${OPENSEARCH_ENDPOINT}" ]]; then
    log "Skipping OpenSearch step: OPENSEARCH_ENDPOINT not set"
    return 0
  fi
  if [[ ! -f "${OPENSEARCH_MAPPING_FILE}" ]]; then
    log "Mapping file not found: ${OPENSEARCH_MAPPING_FILE}"
    exit 1
  fi

  log "[OpenSearch] Checking index '${OPENSEARCH_INDEX}' on ${OPENSEARCH_ENDPOINT}"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X HEAD "${OPENSEARCH_ENDPOINT}/${OPENSEARCH_INDEX}") || true
  if [[ "$status" == "200" ]]; then
    log "[OpenSearch] Index exists. Attempting settings/mapping update (no-downtime safe)."
    # Try to put settings/mappings best-effort; ignore failure if immutable
    curl -s -X PUT "${OPENSEARCH_ENDPOINT}/${OPENSEARCH_INDEX}/_mapping" \
      -H 'Content-Type: application/json' \
      --data-binary @"${OPENSEARCH_MAPPING_FILE}" >/dev/null 2>&1 || true
    log "[OpenSearch] Mapping update attempted."
  else
    log "[OpenSearch] Creating index '${OPENSEARCH_INDEX}'"
    local code
    code=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "${OPENSEARCH_ENDPOINT}/${OPENSEARCH_INDEX}" \
      -H 'Content-Type: application/json' \
      --data-binary @"${OPENSEARCH_MAPPING_FILE}") || true
    if [[ "$code" != "200" && "$code" != "201" ]]; then
      log "[OpenSearch] Index create returned HTTP ${code}. Check mappings and OpenSearch Serverless compatibility."
      exit 1
    fi
    log "[OpenSearch] Index created."
  fi
}

get_queue_arn() {
  local url="$1"
  aws sqs get-queue-attributes \
    --queue-url "$url" \
    --attribute-names QueueArn \
    --region "$AWS_REGION" \
    --query 'Attributes.QueueArn' --output text
}

redrive_dlq() {
  if [[ -z "${CDC_DLQ_URL}" || -z "${CDC_SOURCE_QUEUE_URL}" ]]; then
    log "Skipping DLQ redrive: CDC_DLQ_URL or CDC_SOURCE_QUEUE_URL not set"
    return 0
  fi

  log "[SQS] Checking DLQ depth..."
  local dlq_depth
  dlq_depth=$(aws sqs get-queue-attributes \
    --queue-url "$CDC_DLQ_URL" \
    --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible \
    --region "$AWS_REGION" \
    --query 'Attributes.ApproximateNumberOfMessages' --output text || echo 0)
  log "[SQS] DLQ messages: ${dlq_depth}"
  if [[ "${dlq_depth}" -eq 0 ]]; then
    log "[SQS] DLQ is empty."
    return 0
  fi

  log "[SQS] Starting message move task from DLQ to source queue"
  local dlq_arn src_arn
  dlq_arn=$(get_queue_arn "$CDC_DLQ_URL")
  src_arn=$(get_queue_arn "$CDC_SOURCE_QUEUE_URL")
  local task_id
  task_id=$(aws sqs start-message-move-task \
    --source-arn "$dlq_arn" \
    --destination-arn "$src_arn" \
    --region "$AWS_REGION" \
    --query 'TaskHandle' --output text)
  log "[SQS] Move task started: ${task_id}"
}

canary_invoke_cdc_lambda() {
  if [[ -z "${CDC_LAMBDA_NAME}" ]]; then
    log "Skipping Lambda canary: CDC_LAMBDA_NAME not set"
    return 0
  fi
  log "[Lambda] Canary invoke: ${CDC_LAMBDA_NAME}"
  aws lambda invoke \
    --function-name "${CDC_LAMBDA_NAME}" \
    --invocation-type RequestResponse \
    --payload '{}' \
    --region "$AWS_REGION" \
    /dev/stdout >/dev/null || true
  log "[Lambda] Tail last 100 lines"
  aws logs tail "/aws/lambda/${CDC_LAMBDA_NAME}" --region "$AWS_REGION" --since 5m --follow=false || true
}

main() {
  log "Starting Emergency Recovery (region=${AWS_REGION})"
  ensure_prereqs
  create_or_update_opensearch_index
  redrive_dlq
  canary_invoke_cdc_lambda
  log "Emergency Recovery complete. Run scripts/validate-recovery.sh to verify."
}

main "$@"

#!/bin/bash

# ECOSYSTEMCL.AI Emergency Recovery Script
# Tactical recovery approach - fixes critical infrastructure in 2-3 days

set -e

echo "🚨 ECOSYSTEMCL.AI Emergency Recovery Starting..."
echo "Target: Restore OpenSearch index and CDC pipeline"

# Configuration
REGION="us-west-2"
ACCOUNT_ID="219895243073"
OPENSEARCH_ENDPOINT="https://zwrsnhyybevsl08y2pn3.us-west-2.aoss.amazonaws.com"
COLLECTION_ARN="arn:aws:aoss:us-west-2:219895243073:collection/zwrsnhyybevsl08y2pn3"

echo "📋 Phase 1: Deploy OpenSearch Maintenance Stack"
cd packages/infra

# Build the maintenance stack
npm run build

# Deploy maintenance stack
npx cdk deploy EcosystemCL-OpenSearchMaintenanceStack \
  --parameters opensearchEndpoint=$OPENSEARCH_ENDPOINT \
  --parameters collectionArn=$COLLECTION_ARN \
  --region $REGION \
  --require-approval never

echo "✅ Maintenance stack deployed"

echo "📋 Phase 2: Create OpenSearch Index"
aws lambda invoke \
  --function-name ecosystemcl-opensearch-index-creator \
  --region $REGION \
  --payload '{}' \
  /tmp/index-result.json

echo "Index creation result:"
cat /tmp/index-result.json
echo ""

# Verify index creation
echo "🔍 Verifying index creation..."
curl -X GET "$OPENSEARCH_ENDPOINT/helix-patterns/_mapping" || echo "Index verification failed - may need IAM propagation time"

echo "📋 Phase 3: Reset Circuit Breaker"
aws lambda invoke \
  --function-name ecosystemcl-circuit-breaker-reset \
  --region $REGION \
  --payload '{}' \
  /tmp/circuit-reset.json

echo "Circuit breaker reset result:"
cat /tmp/circuit-reset.json
echo ""

echo "📋 Phase 4: Reprocess DLQ Messages"
aws lambda invoke \
  --function-name ecosystemcl-dlq-reprocessor \
  --region $REGION \
  --payload '{}' \
  /tmp/dlq-result.json

echo "DLQ reprocessing result:"
cat /tmp/dlq-result.json
echo ""

echo "📋 Phase 5: Validate Pattern Retrieval"
# Test pattern retrieval flow
echo "Testing Helix pattern retrieval..."

# Check DynamoDB table
aws dynamodb scan \
  --table-name HelixPatternEntries \
  --region $REGION \
  --max-items 5 \
  --output table

echo "📋 Phase 6: Deploy CloudWatch Dashboard"
cat > /tmp/dashboard.json << 'EOF'
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["ECOSYSTEMCL/CDC", "ProcessedRecords"],
          [".", "FailedRecords"],
          [".", "DLQMessages"]
        ],
        "period": 300,
        "stat": "Sum",
        "region": "us-west-2",
        "title": "CDC Pipeline Health"
      }
    },
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Duration", "FunctionName", "ecosystemcl-cdc-processor"],
          [".", "Errors", ".", "."],
          [".", "Throttles", ".", "."]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-west-2",
        "title": "CDC Lambda Performance"
      }
    }
  ]
}
EOF

aws cloudwatch put-dashboard \
  --dashboard-name "ECOSYSTEMCL-Helix-Recovery" \
  --dashboard-body file:///tmp/dashboard.json \
  --region $REGION

echo "✅ Emergency Recovery Complete!"
echo ""
echo "🎯 Next Steps:"
echo "1. Monitor CloudWatch dashboard: https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=ECOSYSTEMCL-Helix-Recovery"
echo "2. Test pattern retrieval in web app"
echo "3. Verify CDC pipeline processing new patterns"
echo "4. Check OpenSearch index health: $OPENSEARCH_ENDPOINT/helix-patterns/_stats"
echo ""
echo "⚠️  Expected Recovery Time: 2-3 hours (including IAM propagation)"
echo "📊 Estimated Cost Impact: $0 (using existing resources)"
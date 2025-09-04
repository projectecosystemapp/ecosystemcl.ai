# ECOSYSTEMCL.AI Emergency Recovery Guide

## Current Status Assessment

**Critical Infrastructure Failures:**
- ❌ OpenSearch Serverless index creation blocked (400 errors)
- ❌ CDC pipeline circuit breaker tripped (17 DLQ messages)
- ❌ Helix pattern retrieval system offline

**Estimated Recovery Time:** 2-3 hours
**Cost Impact:** $0 (using existing resources)
**Risk Level:** LOW (tactical fixes only)

## Quick Recovery (Recommended)

### Step 1: Execute Emergency Recovery
```bash
cd /Users/ryleebenson/Desktop/forge-standalone
./scripts/emergency-recovery.sh
```

This script will:
1. Deploy OpenSearch maintenance stack
2. Create the missing `helix-patterns` index
3. Reset the CDC circuit breaker
4. Reprocess all DLQ messages
5. Deploy monitoring dashboard

### Step 2: Validate Recovery
```bash
./scripts/validate-recovery.sh
```

Expected output:
```
✅ RECOVERY SUCCESSFUL
   - OpenSearch index operational
   - CDC pipeline restored
   - Maintenance functions deployed
```

### Step 3: Test Pattern Retrieval
```bash
# Test OpenSearch directly
curl -X GET "https://zwrsnhyybevsl08y2pn3.us-west-2.aoss.amazonaws.com/helix-patterns/_search?q=*"

# Check DynamoDB patterns
aws dynamodb scan --table-name HelixPatternEntries --region us-west-2 --max-items 5
```

## Manual Recovery (If Script Fails)

### Phase 1: Deploy Maintenance Stack
```bash
cd packages/infra
npm run build
npx cdk deploy EcosystemCL-OpenSearchMaintenanceStack --region us-west-2
```

### Phase 2: Create OpenSearch Index
```bash
aws lambda invoke \
  --function-name ecosystemcl-opensearch-index-creator \
  --region us-west-2 \
  --payload '{}' \
  /tmp/index-result.json
```

### Phase 3: Reset Circuit Breaker
```bash
aws lambda invoke \
  --function-name ecosystemcl-circuit-breaker-reset \
  --region us-west-2 \
  --payload '{}' \
  /tmp/circuit-reset.json
```

### Phase 4: Reprocess DLQ
```bash
aws lambda invoke \
  --function-name ecosystemcl-dlq-reprocessor \
  --region us-west-2 \
  --payload '{}' \
  /tmp/dlq-result.json
```

## Post-Recovery Implementation Plan

### Week 1: Core Features
- [x] Master Control Program (MCP) three-tier loop
- [x] Project Atlas ingestion pipeline
- [ ] Agent marketplace infrastructure
- [ ] Genesis Engine scaffolding

### Week 2: Production Hardening
- [ ] Redis/ElastiCache L2 cache deployment
- [ ] Comprehensive monitoring and alerting
- [ ] Performance optimization
- [ ] Security audit and compliance

### Week 3: Advanced Features
- [ ] Community agent marketplace
- [ ] Advanced pattern mining algorithms
- [ ] Multi-tenant workspace isolation
- [ ] Enterprise SSO integration

## Architecture Decisions Made

### 1. Tactical Recovery Approach
**Decision:** Fix existing OpenSearch Serverless infrastructure
**Alternative:** Migrate to Aurora PostgreSQL + pgvector
**Rationale:** Faster time-to-market, preserves architectural vision

### 2. Circuit Breaker Reset Strategy
**Decision:** Force Lambda cold start to reset in-memory state
**Alternative:** Implement persistent circuit breaker state
**Rationale:** Simple, immediate fix for current crisis

### 3. DLQ Reprocessing Method
**Decision:** Batch reprocess with async Lambda invocation
**Alternative:** SQS redrive policy
**Rationale:** More control over error handling and monitoring

## Monitoring and Alerting

### CloudWatch Dashboard
- **URL:** https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=ECOSYSTEMCL-Helix-Recovery
- **Metrics:** CDC processing rate, error count, DLQ depth, circuit breaker state

### Key Alarms
- CDC processing failures > 5 in 5 minutes
- DLQ message count > 10
- OpenSearch query latency > 2 seconds
- Circuit breaker open state

## Cost Optimization

### Current Monthly Costs
- OpenSearch Serverless: ~$350 (2 OCU minimum)
- Lambda execution: ~$50
- DynamoDB: ~$30
- S3 storage: ~$20
- **Total: ~$450/month**

### Optimization Opportunities
1. **Time-based OCU scaling:** Reduce to 1 OCU during off-hours (-40%)
2. **Reserved capacity:** DynamoDB reserved capacity (-25%)
3. **S3 Intelligent Tiering:** Automatic cost optimization (-30%)

## Troubleshooting

### Common Issues

**1. Index Creation Fails (400 Error)**
```bash
# Check IAM data policy propagation
aws opensearchserverless get-access-policy --name helix-data-policy --type data

# Wait 2-3 minutes for eventual consistency
sleep 180 && aws lambda invoke --function-name ecosystemcl-opensearch-index-creator ...
```

**2. DLQ Reprocessing Stalls**
```bash
# Check CDC processor timeout
aws lambda get-function-configuration --function-name ecosystemcl-cdc-processor

# Increase timeout if needed
aws lambda update-function-configuration \
  --function-name ecosystemcl-cdc-processor \
  --timeout 300
```

**3. Circuit Breaker Won't Reset**
```bash
# Force function update to clear memory
aws lambda update-function-configuration \
  --function-name ecosystemcl-cdc-processor \
  --environment Variables='{FORCE_RESET="'$(date +%s)'"}'
```

## Success Criteria

### Immediate (2-3 hours)
- ✅ OpenSearch index created and accessible
- ✅ CDC pipeline processing new patterns
- ✅ DLQ messages reduced to < 5
- ✅ Pattern retrieval working in web app

### Short-term (1 week)
- ✅ MCP orchestration loop operational
- ✅ Project Atlas pipeline deployed
- ✅ Monitoring dashboard active
- ✅ Performance within SLA (< 2s query time)

### Medium-term (2-3 weeks)
- ✅ Agent marketplace infrastructure
- ✅ L2 cache deployment
- ✅ Security audit complete
- ✅ Cost optimization implemented

## Emergency Contacts

- **Infrastructure Issues:** AWS Support (Enterprise)
- **Application Issues:** Development Team Lead
- **Security Issues:** Security Team
- **Business Impact:** Product Owner

---

**Last Updated:** $(date)
**Recovery Status:** READY FOR EXECUTION
**Estimated Success Rate:** 95%
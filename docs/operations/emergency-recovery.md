# Emergency Recovery Runbook

This runbook restores search and CDC health in ~30 minutes.

Scope:

- OpenSearch Serverless index creation/update
- CDC DLQ re-drive back to source queue
- CDC processor health sanity checks

## Prerequisites

- AWS CLI v2 authenticated with sufficient permissions (SQS, Lambda, CloudWatch Logs, OpenSearch access policy)
- curl
- Region defaults to `us-west-2` (override via env)

## Environment Variables

Set as needed (export or inline):

- `AWS_REGION` (default `us-west-2`)
- `OPENSEARCH_ENDPOINT` (e.g. `https://abc123.us-west-2.aoss.amazonaws.com`)
- `OPENSEARCH_INDEX` (default `helix-patterns`)
- `OPENSEARCH_MAPPING_FILE` (default `scripts/opensearch/index-mapping.json`)
- `CDC_DLQ_URL` (full SQS URL)
- `CDC_SOURCE_QUEUE_URL` (full SQS URL for the main CDC queue)
- `CDC_LAMBDA_NAME` (default `ecosystemcl-cdc-processor`)

## Steps

1. Run Emergency Recovery

```bash
./scripts/emergency-recovery.sh
```

Success indicators:

- OpenSearch index exists or mapping updated
- DLQ move task started (if DLQ messages present)
- CDC lambda canary invocation returns 200 and logs have no recent errors

1. Validate

```bash
./scripts/validate-recovery.sh
```

Validation checks:

- OpenSearch index reachable (HTTP 200)
- DLQ depth is 0
- CDC logs have no errors in last 5 minutes

## Notes

- OpenSearch mappings are immutable after documents are indexed; changing the vector dimension or field types requires reindexing to a new index name.
- `start-message-move-task` moves all DLQ messages asynchronously; monitor source queue and lambda logs.
- If Lambda is VPC-attached and OpenSearch is in a collection with network policies, confirm egress to the OpenSearch endpoint.

## Troubleshooting

- 400 on index create: Verify Serverless collection and security/policies permit index creation. Validate `index-mapping.json` for k-NN support.
- DLQ still non-zero: Verify IAM for `sqs:StartMessageMoveTask` and that destination/source ARNs are correct.
- Lambda errors: Check function timeout, permissions to DynamoDB/OpenSearch, and any dependency failures.

---

Owned by: Platform Engineering
Last updated: 2025-09-03

#!/bin/bash

# OpenSearch endpoint
ENDPOINT="https://zwrsnhyybevsl08y2pn3.us-west-2.aoss.amazonaws.com"
INDEX="helix-patterns"

# Create index with mappings
aws opensearchserverless invoke --region us-west-2 \
  --path "/${INDEX}" \
  --http-method PUT \
  --body '{
    "settings": {
      "index": {
        "knn": true,
        "number_of_shards": 1,
        "number_of_replicas": 0
      }
    },
    "mappings": {
      "properties": {
        "patternId": { "type": "keyword" },
        "category": { "type": "keyword" },
        "intent": { "type": "text" },
        "title": { "type": "text" },
        "description": { "type": "text" },
        "implementation": { "type": "text" },
        "keywords": { "type": "keyword" },
        "complexity": { "type": "keyword" },
        "vector": {
          "type": "knn_vector",
          "dimension": 1536,
          "method": {
            "name": "hnsw",
            "space_type": "cosine",
            "engine": "lucene",
            "parameters": {
              "ef_construction": 512,
              "m": 16
            }
          }
        },
        "metadata": {
          "type": "object",
          "enabled": false
        },
        "createdAt": { "type": "date" },
        "updatedAt": { "type": "date" },
        "version": { "type": "integer" }
      }
    }
  }' \
  --endpoint-url "$ENDPOINT"
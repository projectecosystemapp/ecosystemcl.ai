#!/usr/bin/env node

const { Client } = require('@opensearch-project/opensearch');
const { AwsSigv4Signer } = require('@opensearch-project/opensearch/aws');
const { defaultProvider } = require('@aws-sdk/credential-provider-node');

const OPENSEARCH_ENDPOINT = 'https://zwrsnhyybevsl08y2pn3.us-west-2.aoss.amazonaws.com';
const INDEX_NAME = 'helix-patterns';

async function createIndex() {
  // Create OpenSearch client with AWS SigV4 signing
  const client = new Client({
    ...AwsSigv4Signer({
      region: 'us-west-2',
      service: 'aoss',
      getCredentials: () => defaultProvider()(),
    }),
    node: OPENSEARCH_ENDPOINT,
  });

  // Check if index exists
  try {
    const exists = await client.indices.exists({ index: INDEX_NAME });
    if (exists.body) {
      console.log(`Index ${INDEX_NAME} already exists, deleting and recreating...`);
      await client.indices.delete({ index: INDEX_NAME });
    }
  } catch (error) {
    console.log('Index does not exist, creating new...');
  }

  // Create index with mappings
  const indexMapping = {
    settings: {
      index: {
        knn: true,
        'knn.space_type': 'cosine',
        number_of_shards: 1,
        number_of_replicas: 0,
      },
    },
    mappings: {
      properties: {
        patternId: { type: 'keyword' },
        category: { type: 'keyword' },
        intent: { type: 'text' },
        title: { type: 'text' },
        description: { type: 'text' },
        implementation: { type: 'text' },
        keywords: { type: 'keyword' },
        complexity: { type: 'keyword' },
        vector: {
          type: 'knn_vector',
          dimension: 1536, // OpenAI/Bedrock embedding dimension
          method: {
            name: 'hnsw',
            space_type: 'cosine',
            engine: 'lucene',
            parameters: {
              ef_construction: 512,
              m: 16,
            },
          },
        },
        metadata: {
          type: 'object',
          enabled: false, // Store but don't index
        },
        createdAt: { type: 'date' },
        updatedAt: { type: 'date' },
        version: { type: 'integer' },
      },
    },
  };

  try {
    const response = await client.indices.create({
      index: INDEX_NAME,
      body: indexMapping,
    });
    console.log(`Index ${INDEX_NAME} created successfully:`, response.body);
  } catch (error) {
    console.error('Failed to create index:', error.meta?.body || error);
    process.exit(1);
  }

  console.log('Index creation complete!');
  process.exit(0);
}

createIndex().catch(console.error);
import { APIGatewayProxyHandler } from 'aws-lambda';
import { Client } from '@opensearch-project/opensearch';
import { AwsSigv4Signer } from '@opensearch-project/opensearch/aws';
import { defaultProvider } from '@aws-sdk/credential-provider-node';

/**
 * One-time Lambda to create OpenSearch index with proper mappings
 * Deploy separately with explicit IAM permissions
 */
export const handler: APIGatewayProxyHandler = async (event) => {
  const endpoint = process.env.OPENSEARCH_ENDPOINT;
  
  if (!endpoint) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OPENSEARCH_ENDPOINT not configured' })
    };
  }

  try {
    const client = new Client({
      ...AwsSigv4Signer({
        region: process.env.AWS_REGION || 'us-west-2',
        service: 'aoss',
        getCredentials: defaultProvider()
      }),
      node: endpoint
    });

    // Check if index exists
    const indexExists = await client.indices.exists({ index: 'helix-patterns' });
    
    if (indexExists.body) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'Index already exists' })
      };
    }

    // Create index with KNN support for vector search
    const indexBody = {
      settings: {
        'index.knn': true,
        'index.knn.space_type': 'cosine',
        'index.number_of_shards': 2,
        'index.number_of_replicas': 0
      },
      mappings: {
        properties: {
          patternId: { type: 'keyword' },
          category: { type: 'keyword' },
          intent: { type: 'text' },
          content: { 
            type: 'text',
            analyzer: 'standard',
            fields: {
              keyword: { type: 'keyword', ignore_above: 256 }
            }
          },
          embedding: {
            type: 'knn_vector',
            dimension: 1536,
            method: {
              name: 'hnsw',
              space_type: 'cosine',
              engine: 'faiss',
              parameters: {
                ef_construction: 128,
                m: 16
              }
            }
          },
          keywords: { type: 'keyword' },
          projectId: { type: 'keyword' },
          agentType: { type: 'keyword' },
          successRate: { type: 'float' },
          usageCount: { type: 'integer' },
          version: { type: 'integer' },
          createdAt: { type: 'date' },
          updatedAt: { type: 'date' }
        }
      }
    };

    await client.indices.create({
      index: 'helix-patterns',
      body: indexBody
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: 'Index created successfully',
        index: 'helix-patterns',
        mappings: indexBody.mappings
      })
    };
  } catch (error) {
    console.error('Index creation failed:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Index creation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    };
  }
};

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { 
  BedrockRuntimeClient, 
  InvokeModelCommand, 
  InvokeModelWithResponseStreamCommand 
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockService } from '../services/BedrockService';
import { Readable } from 'stream';

/**
 * Unit Tests for BedrockService
 * Validates Amazon Bedrock AI model invocation patterns
 */

const bedrockMock = mockClient(BedrockRuntimeClient);

describe('BedrockService', () => {
  let bedrockService: BedrockService;

  beforeEach(() => {
    bedrockMock.reset();
    process.env.BEDROCK_MODEL_ID = 'anthropic.claude-3-sonnet-20240229';
    bedrockService = new BedrockService();
  });

  describe('invokeModel', () => {
    it('should invoke Claude model with correct request format', async () => {
      const request = {
        prompt: 'Generate a React component',
        modelId: 'anthropic.claude-3-sonnet-20240229',
        maxTokens: 2048,
        temperature: 0.7,
        systemPrompt: 'You are a React expert'
      };

      const mockResponse = {
        completion: 'Here is your React component...',
        usage: {
          input_tokens: 50,
          output_tokens: 100
        }
      };

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify(mockResponse)),
        $metadata: { requestId: 'req-123' }
      });

      const response = await bedrockService.invokeModel(request);

      const calls = bedrockMock.commandCalls(InvokeModelCommand);
      expect(calls).toHaveLength(1);
      
      const [invokeCommand] = calls;
      const input = invokeCommand.args[0].input;
      const bodyParsed = JSON.parse(input.body);
      
      expect(input.modelId).toBe('anthropic.claude-3-sonnet-20240229');
      expect(bodyParsed).toMatchObject({
        prompt: expect.stringContaining('You are a React expert'),
        prompt: expect.stringContaining('Generate a React component'),
        max_tokens_to_sample: 2048,
        temperature: 0.7,
        anthropic_version: 'bedrock-2023-05-31'
      });

      expect(response).toEqual({
        text: 'Here is your React component...',
        usage: {
          inputTokens: 50,
          outputTokens: 100,
          totalTokens: 150
        },
        modelId: 'anthropic.claude-3-sonnet-20240229',
        requestId: 'req-123'
      });
    });

    it('should handle Llama model format', async () => {
      const request = {
        prompt: 'Explain quantum computing',
        modelId: 'meta.llama2-70b-chat-v1',
        maxTokens: 1024
      };

      const mockResponse = {
        generation: 'Quantum computing is...',
        prompt_token_count: 10,
        generation_token_count: 50
      };

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify(mockResponse)),
        $metadata: {}
      });

      const response = await bedrockService.invokeModel(request);

      const calls = bedrockMock.commandCalls(InvokeModelCommand);
      const bodyParsed = JSON.parse(calls[0].args[0].input.body);
      
      expect(bodyParsed.prompt).toContain('[INST]');
      expect(bodyParsed.prompt).toContain('Explain quantum computing');
      expect(bodyParsed.max_gen_len).toBe(1024);

      expect(response.text).toBe('Quantum computing is...');
      expect(response.usage?.totalTokens).toBe(60);
    });

    it('should handle Titan model format', async () => {
      const request = {
        prompt: 'Write a haiku',
        modelId: 'amazon.titan-text-express-v1'
      };

      const mockResponse = {
        results: [{
          outputText: 'Cherry blossoms fall...',
          tokenCount: 15
        }],
        inputTextTokenCount: 5
      };

      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify(mockResponse)),
        $metadata: {}
      });

      const response = await bedrockService.invokeModel(request);

      const calls = bedrockMock.commandCalls(InvokeModelCommand);
      const bodyParsed = JSON.parse(calls[0].args[0].input.body);
      
      expect(bodyParsed.inputText).toBe('Write a haiku');
      expect(bodyParsed.textGenerationConfig).toBeDefined();

      expect(response.text).toBe('Cherry blossoms fall...');
      expect(response.usage?.totalTokens).toBe(20);
    });

    it('should throw error for unsupported model', async () => {
      const request = {
        prompt: 'Test',
        modelId: 'unsupported.model-v1'
      };

      await expect(bedrockService.invokeModel(request))
        .rejects
        .toThrow('Unsupported model: unsupported.model-v1');
    });

    it('should handle Bedrock API errors', async () => {
      bedrockMock.on(InvokeModelCommand).rejects(new Error('Model not found'));

      await expect(bedrockService.invokeModel({
        prompt: 'Test',
        modelId: 'anthropic.claude-3-sonnet-20240229'
      })).rejects.toThrow('Model not found');
    });
  });

  describe('invokeModelStream', () => {
    it('should create readable stream from Bedrock response', async () => {
      const chunks = [
        { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ completion: 'Hello' })) } },
        { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ completion: ' world' })) } },
        { chunk: { bytes: new TextEncoder().encode(JSON.stringify({ completion: '!' })) } }
      ];

      // Create async generator to simulate streaming response
      async function* streamGenerator() {
        for (const chunk of chunks) {
          yield chunk;
        }
      }

      bedrockMock.on(InvokeModelWithResponseStreamCommand).resolves({
        body: streamGenerator(),
        $metadata: {}
      });

      const stream = await bedrockService.invokeModelStream({
        prompt: 'Say hello',
        modelId: 'anthropic.claude-3-sonnet-20240229'
      });

      // Collect stream chunks
      const chunks: string[] = [];
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      
      await new Promise((resolve) => stream.on('end', resolve));
      
      expect(chunks.join('')).toBe('Hello world!');
    });

    it('should handle stream errors', async () => {
      bedrockMock.on(InvokeModelWithResponseStreamCommand).rejects(
        new Error('Stream connection failed')
      );

      await expect(bedrockService.invokeModelStream({
        prompt: 'Test',
        modelId: 'anthropic.claude-3-sonnet-20240229'
      })).rejects.toThrow('Stream connection failed');
    });
  });

  describe('generateEmbeddings', () => {
    it('should generate embeddings using Titan model', async () => {
      const mockEmbedding = Array(1536).fill(0).map(() => Math.random());
      
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          embedding: mockEmbedding
        }))
      });

      const embeddings = await bedrockService.generateEmbeddings('Test text for embedding');

      const calls = bedrockMock.commandCalls(InvokeModelCommand);
      expect(calls).toHaveLength(1);
      expect(calls[0].args[0].input.modelId).toBe('amazon.titan-embed-text-v1');
      
      const bodyParsed = JSON.parse(calls[0].args[0].input.body);
      expect(bodyParsed.inputText).toBe('Test text for embedding');
      
      expect(embeddings).toHaveLength(1536);
      expect(embeddings[0]).toBeTypeOf('number');
    });
  });

  describe('validateModel', () => {
    it('should return true for available model', async () => {
      bedrockMock.on(InvokeModelCommand).resolves({
        body: new TextEncoder().encode(JSON.stringify({
          completion: 'T'
        }))
      });

      const isValid = await bedrockService.validateModel('anthropic.claude-3-sonnet-20240229');
      expect(isValid).toBe(true);
    });

    it('should return false for unavailable model', async () => {
      const error = new Error('Resource not found');
      error.name = 'ResourceNotFoundException';
      bedrockMock.on(InvokeModelCommand).rejects(error);

      const isValid = await bedrockService.validateModel('non-existent-model');
      expect(isValid).toBe(false);
    });

    it('should throw other errors', async () => {
      bedrockMock.on(InvokeModelCommand).rejects(new Error('Network error'));

      await expect(bedrockService.validateModel('anthropic.claude-3-sonnet-20240229'))
        .rejects
        .toThrow('Network error');
    });
  });
});

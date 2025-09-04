import * as cdk from 'aws-cdk-lib';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as sfnTasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

/**
 * Project Atlas - Automated codebase ingestion and pattern mining
 * 
 * Pipeline:
 * 1. Clone Repository → 2. Static Analysis → 3. Semantic Embedding → 4. Pattern Mining → 5. State Synthesis
 */
export class ProjectAtlasStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for storing analysis artifacts
    const analysisBucket = new s3.Bucket(this, 'ProjectAtlasArtifacts', {
      bucketName: 'ecosystemcl-project-atlas-artifacts',
      versioned: true,
      lifecycleRules: [{
        id: 'cleanup-old-analyses',
        expiration: cdk.Duration.days(90),
        noncurrentVersionExpiration: cdk.Duration.days(30),
      }],
    });

    // Lambda functions for each pipeline stage
    const cloneRepository = new lambdaNodejs.NodejsFunction(this, 'CloneRepository', {
      functionName: 'project-atlas-clone',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 2048,
      timeout: cdk.Duration.minutes(10),
      environment: {
        ARTIFACTS_BUCKET: analysisBucket.bucketName,
      },
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const { repositoryUrl, projectId } = event;
          
          // Placeholder for git clone logic
          console.log('Cloning repository:', repositoryUrl);
          
          return {
            projectId,
            repositoryUrl,
            cloneStatus: 'SUCCESS',
            artifactPath: \`projects/\${projectId}/source\`,
            fileCount: 150,
            languages: ['typescript', 'javascript', 'python']
          };
        };
      `),
    });

    const staticAnalysis = new lambdaNodejs.NodejsFunction(this, 'StaticAnalysis', {
      functionName: 'project-atlas-analysis',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 3008,
      timeout: cdk.Duration.minutes(15),
      environment: {
        ARTIFACTS_BUCKET: analysisBucket.bucketName,
      },
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const { projectId, artifactPath, languages } = event;
          
          console.log('Analyzing project:', projectId);
          
          // Placeholder for static analysis
          const analysis = {
            complexity: 'MEDIUM',
            patterns: ['mvc', 'repository', 'factory'],
            dependencies: ['react', 'express', 'aws-sdk'],
            metrics: {
              linesOfCode: 15000,
              cyclomaticComplexity: 8.5,
              maintainabilityIndex: 72
            }
          };
          
          return {
            ...event,
            analysis,
            analysisPath: \`projects/\${projectId}/analysis.json\`
          };
        };
      `),
    });

    const semanticEmbedding = new lambdaNodejs.NodejsFunction(this, 'SemanticEmbedding', {
      functionName: 'project-atlas-embedding',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      environment: {
        ARTIFACTS_BUCKET: analysisBucket.bucketName,
      },
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const { projectId, analysis } = event;
          
          console.log('Generating embeddings for:', projectId);
          
          // Placeholder for embedding generation
          const embeddings = {
            codeEmbeddings: new Array(1536).fill(0).map(() => Math.random()),
            patternEmbeddings: analysis.patterns.map(p => ({
              pattern: p,
              embedding: new Array(1536).fill(0).map(() => Math.random())
            }))
          };
          
          return {
            ...event,
            embeddings,
            embeddingPath: \`projects/\${projectId}/embeddings.json\`
          };
        };
      `),
    });

    const patternMining = new lambdaNodejs.NodejsFunction(this, 'PatternMining', {
      functionName: 'project-atlas-mining',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 2048,
      timeout: cdk.Duration.minutes(10),
      environment: {
        ARTIFACTS_BUCKET: analysisBucket.bucketName,
      },
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          const { projectId, analysis, embeddings } = event;
          
          console.log('Mining patterns for:', projectId);
          
          // Placeholder for pattern mining
          const minedPatterns = [
            {
              id: \`\${projectId}-auth-pattern\`,
              type: 'authentication',
              confidence: 0.92,
              usage: 'JWT token validation middleware',
              code: 'const authMiddleware = (req, res, next) => { /* ... */ }'
            },
            {
              id: \`\${projectId}-api-pattern\`,
              type: 'api-design',
              confidence: 0.87,
              usage: 'RESTful API endpoint structure',
              code: 'app.get("/api/v1/users/:id", async (req, res) => { /* ... */ })'
            }
          ];
          
          return {
            ...event,
            minedPatterns,
            patternsPath: \`projects/\${projectId}/patterns.json\`
          };
        };
      `),
    });

    const stateSynthesis = new lambdaNodejs.NodejsFunction(this, 'StateSynthesis', {
      functionName: 'project-atlas-synthesis',
      runtime: lambda.Runtime.NODEJS_20_X,
      architecture: lambda.Architecture.ARM_64,
      memorySize: 1024,
      timeout: cdk.Duration.minutes(5),
      environment: {
        ARTIFACTS_BUCKET: analysisBucket.bucketName,
        HELIX_TABLE: 'HelixPatternEntries',
      },
      code: lambda.Code.fromInline(`
        const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
        
        exports.handler = async (event) => {
          const { projectId, minedPatterns } = event;
          const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
          
          console.log('Synthesizing state for:', projectId);
          
          // Store patterns in Helix knowledge base
          for (const pattern of minedPatterns) {
            await dynamodb.send(new PutItemCommand({
              TableName: process.env.HELIX_TABLE,
              Item: {
                patternId: { S: pattern.id },
                version: { N: '1' },
                content: { S: pattern.code },
                keywords: { SS: [pattern.type, 'project-atlas'] },
                context: { S: JSON.stringify({ projectId, confidence: pattern.confidence }) },
                projectId: { S: projectId },
                agentType: { S: 'project-atlas' },
                successRate: { N: pattern.confidence.toString() },
                usageCount: { N: '0' },
                createdAt: { S: new Date().toISOString() },
                updatedAt: { S: new Date().toISOString() }
              }
            }));
          }
          
          return {
            ...event,
            status: 'COMPLETED',
            patternsStored: minedPatterns.length,
            completedAt: new Date().toISOString()
          };
        };
      `),
    });

    // Grant S3 permissions to all functions
    analysisBucket.grantReadWrite(cloneRepository);
    analysisBucket.grantReadWrite(staticAnalysis);
    analysisBucket.grantReadWrite(semanticEmbedding);
    analysisBucket.grantReadWrite(patternMining);
    analysisBucket.grantReadWrite(stateSynthesis);

    // Grant DynamoDB permissions to synthesis function
    stateSynthesis.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['dynamodb:PutItem'],
      resources: ['arn:aws:dynamodb:*:*:table/HelixPatternEntries'],
    }));

    // Step Functions state machine
    const cloneTask = new sfnTasks.LambdaInvoke(this, 'CloneTask', {
      lambdaFunction: cloneRepository,
      outputPath: '$.Payload',
    });

    const analysisTask = new sfnTasks.LambdaInvoke(this, 'AnalysisTask', {
      lambdaFunction: staticAnalysis,
      outputPath: '$.Payload',
    });

    const embeddingTask = new sfnTasks.LambdaInvoke(this, 'EmbeddingTask', {
      lambdaFunction: semanticEmbedding,
      outputPath: '$.Payload',
    });

    const miningTask = new sfnTasks.LambdaInvoke(this, 'MiningTask', {
      lambdaFunction: patternMining,
      outputPath: '$.Payload',
    });

    const synthesisTask = new sfnTasks.LambdaInvoke(this, 'SynthesisTask', {
      lambdaFunction: stateSynthesis,
      outputPath: '$.Payload',
    });

    // Define the pipeline
    const definition = cloneTask
      .next(analysisTask)
      .next(embeddingTask)
      .next(miningTask)
      .next(synthesisTask);

    const stateMachine = new stepfunctions.StateMachine(this, 'ProjectAtlasPipeline', {
      stateMachineName: 'ecosystemcl-project-atlas',
      definition,
      timeout: cdk.Duration.hours(2),
    });

    // Outputs
    new cdk.CfnOutput(this, 'StateMachineArn', {
      value: stateMachine.stateMachineArn,
      description: 'Project Atlas State Machine ARN',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucket', {
      value: analysisBucket.bucketName,
      description: 'Project Atlas Artifacts Bucket',
    });
  }
}
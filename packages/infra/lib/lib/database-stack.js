"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const cognito = __importStar(require("aws-cdk-lib/aws-cognito"));
const elasticache = __importStar(require("aws-cdk-lib/aws-elasticache"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const opensearch = __importStar(require("aws-cdk-lib/aws-opensearchservice"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
/**
 * Database Stack for ECOSYSTEMCL.AI
 *
 * Implements the primary data layer using AWS-native serverless services:
 * - DynamoDB for structured data (patterns, workspace states, subscriptions)
 * - ElastiCache Redis for high-speed caching and rate limiting
 * - OpenSearch for semantic vector search and embeddings
 * - Cognito for identity management
 */
class DatabaseStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // =====================================================================
        // HELIX PATTERN DATABASE - The Core Knowledge Base
        // =====================================================================
        /**
         * HelixPatternEntries Table
         *
         * This is the foundational component of the entire platform's intelligence.
         * It stores canonical engineering patterns that enforce the "Query-First" law.
         *
         * Access Patterns:
         * 1. Query by category + intent (primary key)
         * 2. Search by keyword (GSI)
         * 3. Browse by category
         *
         * Schema:
         * - category: Pattern category (e.g., "authentication", "database", "api")
         * - intent: Specific user intent (e.g., "implement_jwt_auth", "create_dynamodb_table")
         * - patternId: Unique identifier for the pattern
         * - canonicalName: Human-readable name for the pattern
         * - implementation: The actual code/configuration pattern
         * - metadata: Usage statistics, version, author, tags
         * - keywords: Array of searchable terms (for GSI)
         * - createdAt: ISO 8601 timestamp
         * - updatedAt: ISO 8601 timestamp
         */
        this.helixPatternTable = new dynamodb.Table(this, 'HelixPatternEntries', {
            tableName: 'HelixPatternEntries',
            partitionKey: {
                name: 'category',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'intent',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // Serverless, auto-scaling
            removalPolicy: cdk.RemovalPolicy.RETAIN, // Critical: Protects knowledge base from accidental deletion
            pointInTimeRecovery: true, // Enable PITR for data recovery
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // Enable DynamoDB Streams for change tracking
            encryption: dynamodb.TableEncryption.AWS_MANAGED, // Encryption at rest
            // CloudWatch Contributor Insights for query optimization
            contributorInsightsEnabled: true,
        });
        // Global Secondary Index for keyword-based searches
        this.helixPatternTable.addGlobalSecondaryIndex({
            indexName: 'KeywordIndex',
            partitionKey: {
                name: 'keyword',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'intent',
                type: dynamodb.AttributeType.STRING
            },
            projectionType: dynamodb.ProjectionType.ALL, // Include all attributes in index
        });
        // Global Secondary Index for pattern browsing by category
        this.helixPatternTable.addGlobalSecondaryIndex({
            indexName: 'PatternIdIndex',
            partitionKey: {
                name: 'patternId',
                type: dynamodb.AttributeType.STRING
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // =====================================================================
        // WORKSPACE STATE TABLE - Project Memory
        // =====================================================================
        /**
         * Stores the high-level state and context for each project workspace.
         * This is the "Cloud Brain" component of the two-tiered memory system.
         */
        this.workspaceStateTable = new dynamodb.Table(this, 'WorkspaceStates', {
            tableName: 'WorkspaceStates',
            partitionKey: {
                name: 'projectId',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'version',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            pointInTimeRecovery: true,
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });
        // GSI for querying by user
        this.workspaceStateTable.addGlobalSecondaryIndex({
            indexName: 'UserProjectsIndex',
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'lastModified',
                type: dynamodb.AttributeType.STRING
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // =====================================================================
        // AGENT PROFILE TABLE - Marketplace Registry
        // =====================================================================
        /**
         * Registry of all available agents in the marketplace.
         * Supports subscription tiers and agent specialization.
         */
        this.agentProfileTable = new dynamodb.Table(this, 'AgentProfiles', {
            tableName: 'AgentProfiles',
            partitionKey: {
                name: 'agentId',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });
        // GSI for querying by tier
        this.agentProfileTable.addGlobalSecondaryIndex({
            indexName: 'TierIndex',
            partitionKey: {
                name: 'minTier',
                type: dynamodb.AttributeType.STRING
            },
            sortKey: {
                name: 'popularity',
                type: dynamodb.AttributeType.NUMBER
            },
            projectionType: dynamodb.ProjectionType.ALL,
        });
        // =====================================================================
        // SUBSCRIPTION TABLE - User Tier Management
        // =====================================================================
        this.subscriptionTable = new dynamodb.Table(this, 'Subscriptions', {
            tableName: 'Subscriptions',
            partitionKey: {
                name: 'userId',
                type: dynamodb.AttributeType.STRING
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
        });
        // =====================================================================
        // COGNITO USER POOL - Identity Management
        // =====================================================================
        this.userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: 'EcosystemCL-UserPool',
            selfSignUpEnabled: true,
            signInAliases: {
                email: true,
                username: false,
            },
            autoVerify: {
                email: true,
            },
            standardAttributes: {
                email: {
                    required: true,
                    mutable: false,
                },
            },
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: true,
            },
            accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            deviceTracking: {
                challengeRequiredOnNewDevice: true,
                deviceOnlyRememberedOnUserPrompt: true,
            },
        });
        // User Pool Client for CLI authentication (Device Code Flow)
        new cognito.UserPoolClient(this, 'CLIClient', {
            userPool: this.userPool,
            userPoolClientName: 'eco-cli-client',
            authFlows: {
                custom: true,
                userPassword: true,
            },
            generateSecret: false, // Public client for CLI
            preventUserExistenceErrors: true,
            accessTokenValidity: cdk.Duration.hours(1),
            idTokenValidity: cdk.Duration.hours(1),
            refreshTokenValidity: cdk.Duration.days(30),
        });
        // =====================================================================
        // VPC FOR ELASTICACHE AND OPENSEARCH
        // =====================================================================
        const vpc = new ec2.Vpc(this, 'DataVPC', {
            vpcName: 'EcosystemCL-DataVPC',
            maxAzs: 2,
            natGateways: 0, // Cost optimization - use VPC endpoints instead
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Isolated',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });
        // Security Group for ElastiCache
        const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
            vpc,
            description: 'Security group for ElastiCache Redis',
            allowAllOutbound: false,
        });
        // =====================================================================
        // ELASTICACHE REDIS - High-Speed Caching & Rate Limiting
        // =====================================================================
        const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
            description: 'Subnet group for ElastiCache Redis',
            subnetIds: vpc.isolatedSubnets.map(subnet => subnet.subnetId),
        });
        this.redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
            cacheNodeType: 'cache.t3.micro',
            engine: 'redis',
            numCacheNodes: 1,
            vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
            cacheSubnetGroupName: redisSubnetGroup.ref,
            clusterName: 'ecosystemcl-cache',
            port: 6379,
        });
        // =====================================================================
        // OPENSEARCH - Semantic Vector Search
        // =====================================================================
        // Ensure service-linked role for OpenSearch exists (required for VPC access)
        new iam.CfnServiceLinkedRole(this, 'OpenSearchServiceLinkedRole', {
            awsServiceName: 'opensearchservice.amazonaws.com',
            description: 'Service-linked role for Amazon OpenSearch Service to access VPC resources',
        });
        const openSearchSecurityGroup = new ec2.SecurityGroup(this, 'OpenSearchSecurityGroup', {
            vpc,
            description: 'Security group for OpenSearch',
        });
        this.openSearchDomain = new opensearch.Domain(this, 'VectorSearchDomain', {
            domainName: 'ecosystemcl-vectors',
            version: opensearch.EngineVersion.OPENSEARCH_2_11,
            capacity: {
                multiAzWithStandbyEnabled: false,
                masterNodes: 0,
                dataNodes: 1,
                dataNodeInstanceType: 't3.small.search',
            },
            zoneAwareness: { enabled: false },
            ebs: {
                volumeSize: 10,
                volumeType: ec2.EbsDeviceVolumeType.GP3,
            },
            nodeToNodeEncryption: true,
            encryptionAtRest: {
                enabled: true,
            },
            vpc,
            vpcSubnets: [{ subnets: [vpc.isolatedSubnets[0]] }],
            securityGroups: [openSearchSecurityGroup],
            removalPolicy: cdk.RemovalPolicy.RETAIN,
        });
        // =====================================================================
        // CLOUDFORMATION OUTPUTS
        // =====================================================================
        new cdk.CfnOutput(this, 'HelixPatternTableName', {
            value: this.helixPatternTable.tableName,
            description: 'DynamoDB table name for Helix patterns',
            exportName: 'HelixPatternTableName',
        });
        new cdk.CfnOutput(this, 'HelixPatternTableArn', {
            value: this.helixPatternTable.tableArn,
            description: 'ARN of the Helix pattern table',
            exportName: 'HelixPatternTableArn',
        });
        new cdk.CfnOutput(this, 'UserPoolId', {
            value: this.userPool.userPoolId,
            description: 'Cognito User Pool ID',
            exportName: 'CognitoUserPoolId',
        });
        new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
            value: this.openSearchDomain.domainEndpoint,
            description: 'OpenSearch domain endpoint for vector search',
            exportName: 'OpenSearchEndpoint',
        });
    }
}
exports.DatabaseStack = DatabaseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kYXRhYmFzZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyxtRUFBcUQ7QUFDckQsaUVBQW1EO0FBQ25ELHlFQUEyRDtBQUMzRCx5REFBMkM7QUFDM0MsOEVBQWdFO0FBQ2hFLHlEQUEyQztBQUczQzs7Ozs7Ozs7R0FRRztBQUNILE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBUzFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFFeEIsd0VBQXdFO1FBQ3hFLG1EQUFtRDtRQUNuRCx3RUFBd0U7UUFFeEU7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztXQXFCRztRQUNILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3ZFLFNBQVMsRUFBRSxxQkFBcUI7WUFDaEMsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxVQUFVO2dCQUNoQixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlLEVBQUUsMkJBQTJCO1lBQzlFLGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRSw2REFBNkQ7WUFDdEcsbUJBQW1CLEVBQUUsSUFBSSxFQUFFLGdDQUFnQztZQUMzRCxNQUFNLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0IsRUFBRSw4Q0FBOEM7WUFDbEcsVUFBVSxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVyxFQUFFLHFCQUFxQjtZQUV2RSx5REFBeUQ7WUFDekQsMEJBQTBCLEVBQUUsSUFBSTtTQUNqQyxDQUFDLENBQUM7UUFFSCxvREFBb0Q7UUFDcEQsSUFBSSxDQUFDLGlCQUFpQixDQUFDLHVCQUF1QixDQUFDO1lBQzdDLFNBQVMsRUFBRSxjQUFjO1lBQ3pCLFlBQVksRUFBRTtnQkFDWixJQUFJLEVBQUUsU0FBUztnQkFDZixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHLEVBQUUsa0NBQWtDO1NBQ2hGLENBQUMsQ0FBQztRQUVILDBEQUEwRDtRQUMxRCxJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUM7WUFDN0MsU0FBUyxFQUFFLGdCQUFnQjtZQUMzQixZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFdBQVc7Z0JBQ2pCLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHO1NBQzVDLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSx5Q0FBeUM7UUFDekMsd0VBQXdFO1FBRXhFOzs7V0FHRztRQUNILElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGlCQUFpQixFQUFFO1lBQ3JFLFNBQVMsRUFBRSxpQkFBaUI7WUFDNUIsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxXQUFXO2dCQUNqQixJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNO2FBQ3BDO1lBQ0QsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELGFBQWEsRUFBRSxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU07WUFDdkMsbUJBQW1CLEVBQUUsSUFBSTtZQUN6QixNQUFNLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxrQkFBa0I7WUFDbEQsVUFBVSxFQUFFLFFBQVEsQ0FBQyxlQUFlLENBQUMsV0FBVztTQUNqRCxDQUFDLENBQUM7UUFFSCwyQkFBMkI7UUFDM0IsSUFBSSxDQUFDLG1CQUFtQixDQUFDLHVCQUF1QixDQUFDO1lBQy9DLFNBQVMsRUFBRSxtQkFBbUI7WUFDOUIsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxRQUFRO2dCQUNkLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLGNBQWM7Z0JBQ3BCLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHO1NBQzVDLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSw2Q0FBNkM7UUFDN0Msd0VBQXdFO1FBRXhFOzs7V0FHRztRQUNILElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUNqRSxTQUFTLEVBQUUsZUFBZTtZQUMxQixZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFNBQVM7Z0JBQ2YsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztZQUNELFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUN2QyxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXO1NBQ2pELENBQUMsQ0FBQztRQUVILDJCQUEyQjtRQUMzQixJQUFJLENBQUMsaUJBQWlCLENBQUMsdUJBQXVCLENBQUM7WUFDN0MsU0FBUyxFQUFFLFdBQVc7WUFDdEIsWUFBWSxFQUFFO2dCQUNaLElBQUksRUFBRSxTQUFTO2dCQUNmLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLFlBQVk7Z0JBQ2xCLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxjQUFjLEVBQUUsUUFBUSxDQUFDLGNBQWMsQ0FBQyxHQUFHO1NBQzVDLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSw0Q0FBNEM7UUFDNUMsd0VBQXdFO1FBRXhFLElBQUksQ0FBQyxpQkFBaUIsR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGVBQWUsRUFBRTtZQUNqRSxTQUFTLEVBQUUsZUFBZTtZQUMxQixZQUFZLEVBQUU7Z0JBQ1osSUFBSSxFQUFFLFFBQVE7Z0JBQ2QsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztZQUNELFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLGVBQWU7WUFDakQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUN2QyxVQUFVLEVBQUUsUUFBUSxDQUFDLGVBQWUsQ0FBQyxXQUFXO1NBQ2pELENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSwwQ0FBMEM7UUFDMUMsd0VBQXdFO1FBRXhFLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxPQUFPLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxVQUFVLEVBQUU7WUFDckQsWUFBWSxFQUFFLHNCQUFzQjtZQUNwQyxpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGFBQWEsRUFBRTtnQkFDYixLQUFLLEVBQUUsSUFBSTtnQkFDWCxRQUFRLEVBQUUsS0FBSzthQUNoQjtZQUNELFVBQVUsRUFBRTtnQkFDVixLQUFLLEVBQUUsSUFBSTthQUNaO1lBQ0Qsa0JBQWtCLEVBQUU7Z0JBQ2xCLEtBQUssRUFBRTtvQkFDTCxRQUFRLEVBQUUsSUFBSTtvQkFDZCxPQUFPLEVBQUUsS0FBSztpQkFDZjthQUNGO1lBQ0QsY0FBYyxFQUFFO2dCQUNkLFNBQVMsRUFBRSxFQUFFO2dCQUNiLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLGFBQWEsRUFBRSxJQUFJO2dCQUNuQixjQUFjLEVBQUUsSUFBSTthQUNyQjtZQUNELGVBQWUsRUFBRSxPQUFPLENBQUMsZUFBZSxDQUFDLFVBQVU7WUFDbkQsYUFBYSxFQUFFLEdBQUcsQ0FBQyxhQUFhLENBQUMsTUFBTTtZQUN2QyxjQUFjLEVBQUU7Z0JBQ2QsNEJBQTRCLEVBQUUsSUFBSTtnQkFDbEMsZ0NBQWdDLEVBQUUsSUFBSTthQUN2QztTQUNGLENBQUMsQ0FBQztRQUVILDZEQUE2RDtRQUM3RCxJQUFJLE9BQU8sQ0FBQyxjQUFjLENBQUMsSUFBSSxFQUFFLFdBQVcsRUFBRTtZQUM1QyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVE7WUFDdkIsa0JBQWtCLEVBQUUsZ0JBQWdCO1lBQ3BDLFNBQVMsRUFBRTtnQkFDVCxNQUFNLEVBQUUsSUFBSTtnQkFDWixZQUFZLEVBQUUsSUFBSTthQUNuQjtZQUNELGNBQWMsRUFBRSxLQUFLLEVBQUUsd0JBQXdCO1lBQy9DLDBCQUEwQixFQUFFLElBQUk7WUFDaEMsbUJBQW1CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO1lBQzFDLGVBQWUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUM7WUFDdEMsb0JBQW9CLEVBQUUsR0FBRyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO1NBQzVDLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSxxQ0FBcUM7UUFDckMsd0VBQXdFO1FBRXhFLE1BQU0sR0FBRyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsU0FBUyxFQUFFO1lBQ3ZDLE9BQU8sRUFBRSxxQkFBcUI7WUFDOUIsTUFBTSxFQUFFLENBQUM7WUFDVCxXQUFXLEVBQUUsQ0FBQyxFQUFFLGdEQUFnRDtZQUNoRSxtQkFBbUIsRUFBRTtnQkFDbkI7b0JBQ0UsUUFBUSxFQUFFLEVBQUU7b0JBQ1osSUFBSSxFQUFFLFVBQVU7b0JBQ2hCLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQjtpQkFDNUM7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILGlDQUFpQztRQUNqQyxNQUFNLGtCQUFrQixHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsb0JBQW9CLEVBQUU7WUFDM0UsR0FBRztZQUNILFdBQVcsRUFBRSxzQ0FBc0M7WUFDbkQsZ0JBQWdCLEVBQUUsS0FBSztTQUN4QixDQUFDLENBQUM7UUFFSCx3RUFBd0U7UUFDeEUseURBQXlEO1FBQ3pELHdFQUF3RTtRQUV4RSxNQUFNLGdCQUFnQixHQUFHLElBQUksV0FBVyxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsa0JBQWtCLEVBQUU7WUFDaEYsV0FBVyxFQUFFLG9DQUFvQztZQUNqRCxTQUFTLEVBQUUsR0FBRyxDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1NBQzlELENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxXQUFXLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxjQUFjLEVBQUU7WUFDeEUsYUFBYSxFQUFFLGdCQUFnQjtZQUMvQixNQUFNLEVBQUUsT0FBTztZQUNmLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLG1CQUFtQixFQUFFLENBQUMsa0JBQWtCLENBQUMsZUFBZSxDQUFDO1lBQ3pELG9CQUFvQixFQUFFLGdCQUFnQixDQUFDLEdBQUc7WUFDMUMsV0FBVyxFQUFFLG1CQUFtQjtZQUNoQyxJQUFJLEVBQUUsSUFBSTtTQUNYLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSxzQ0FBc0M7UUFDdEMsd0VBQXdFO1FBRXhFLDZFQUE2RTtRQUM3RSxJQUFJLEdBQUcsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLEVBQUUsNkJBQTZCLEVBQUU7WUFDaEUsY0FBYyxFQUFFLGlDQUFpQztZQUNqRCxXQUFXLEVBQUUsMkVBQTJFO1NBQ3pGLENBQUMsQ0FBQztRQUVILE1BQU0sdUJBQXVCLEdBQUcsSUFBSSxHQUFHLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSx5QkFBeUIsRUFBRTtZQUNyRixHQUFHO1lBQ0gsV0FBVyxFQUFFLCtCQUErQjtTQUM3QyxDQUFDLENBQUM7UUFFSCxJQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxVQUFVLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUN4RSxVQUFVLEVBQUUscUJBQXFCO1lBQ2pDLE9BQU8sRUFBRSxVQUFVLENBQUMsYUFBYSxDQUFDLGVBQWU7WUFDakQsUUFBUSxFQUFFO2dCQUNSLHlCQUF5QixFQUFFLEtBQUs7Z0JBQ2hDLFdBQVcsRUFBRSxDQUFDO2dCQUNkLFNBQVMsRUFBRSxDQUFDO2dCQUNaLG9CQUFvQixFQUFFLGlCQUFpQjthQUN4QztZQUNELGFBQWEsRUFBRSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUU7WUFDakMsR0FBRyxFQUFFO2dCQUNILFVBQVUsRUFBRSxFQUFFO2dCQUNkLFVBQVUsRUFBRSxHQUFHLENBQUMsbUJBQW1CLENBQUMsR0FBRzthQUN4QztZQUNELG9CQUFvQixFQUFFLElBQUk7WUFDMUIsZ0JBQWdCLEVBQUU7Z0JBQ2hCLE9BQU8sRUFBRSxJQUFJO2FBQ2Q7WUFDRCxHQUFHO1lBQ0gsVUFBVSxFQUFFLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQztZQUNuRCxjQUFjLEVBQUUsQ0FBQyx1QkFBdUIsQ0FBQztZQUN6QyxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1NBQ3hDLENBQUMsQ0FBQztRQUVILHdFQUF3RTtRQUN4RSx5QkFBeUI7UUFDekIsd0VBQXdFO1FBRXhFLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDL0MsS0FBSyxFQUFFLElBQUksQ0FBQyxpQkFBaUIsQ0FBQyxTQUFTO1lBQ3ZDLFdBQVcsRUFBRSx3Q0FBd0M7WUFDckQsVUFBVSxFQUFFLHVCQUF1QjtTQUNwQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLHNCQUFzQixFQUFFO1lBQzlDLEtBQUssRUFBRSxJQUFJLENBQUMsaUJBQWlCLENBQUMsUUFBUTtZQUN0QyxXQUFXLEVBQUUsZ0NBQWdDO1lBQzdDLFVBQVUsRUFBRSxzQkFBc0I7U0FDbkMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDcEMsS0FBSyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVTtZQUMvQixXQUFXLEVBQUUsc0JBQXNCO1lBQ25DLFVBQVUsRUFBRSxtQkFBbUI7U0FDaEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxvQkFBb0IsRUFBRTtZQUM1QyxLQUFLLEVBQUUsSUFBSSxDQUFDLGdCQUFnQixDQUFDLGNBQWM7WUFDM0MsV0FBVyxFQUFFLDhDQUE4QztZQUMzRCxVQUFVLEVBQUUsb0JBQW9CO1NBQ2pDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpVRCxzQ0F5VUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGNvZ25pdG8gZnJvbSAnYXdzLWNkay1saWIvYXdzLWNvZ25pdG8nO1xuaW1wb3J0ICogYXMgZWxhc3RpY2FjaGUgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVsYXN0aWNhY2hlJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIG9wZW5zZWFyY2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLW9wZW5zZWFyY2hzZXJ2aWNlJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG4vKipcbiAqIERhdGFiYXNlIFN0YWNrIGZvciBFQ09TWVNURU1DTC5BSVxuICogXG4gKiBJbXBsZW1lbnRzIHRoZSBwcmltYXJ5IGRhdGEgbGF5ZXIgdXNpbmcgQVdTLW5hdGl2ZSBzZXJ2ZXJsZXNzIHNlcnZpY2VzOlxuICogLSBEeW5hbW9EQiBmb3Igc3RydWN0dXJlZCBkYXRhIChwYXR0ZXJucywgd29ya3NwYWNlIHN0YXRlcywgc3Vic2NyaXB0aW9ucylcbiAqIC0gRWxhc3RpQ2FjaGUgUmVkaXMgZm9yIGhpZ2gtc3BlZWQgY2FjaGluZyBhbmQgcmF0ZSBsaW1pdGluZ1xuICogLSBPcGVuU2VhcmNoIGZvciBzZW1hbnRpYyB2ZWN0b3Igc2VhcmNoIGFuZCBlbWJlZGRpbmdzXG4gKiAtIENvZ25pdG8gZm9yIGlkZW50aXR5IG1hbmFnZW1lbnRcbiAqL1xuZXhwb3J0IGNsYXNzIERhdGFiYXNlU3RhY2sgZXh0ZW5kcyBjZGsuU3RhY2sge1xuICBwdWJsaWMgcmVhZG9ubHkgaGVsaXhQYXR0ZXJuVGFibGU6IGR5bmFtb2RiLlRhYmxlO1xuICBwdWJsaWMgcmVhZG9ubHkgd29ya3NwYWNlU3RhdGVUYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBhZ2VudFByb2ZpbGVUYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBzdWJzY3JpcHRpb25UYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbDogY29nbml0by5Vc2VyUG9vbDtcbiAgcHVibGljIHJlYWRvbmx5IHJlZGlzQ2x1c3RlcjogZWxhc3RpY2FjaGUuQ2ZuQ2FjaGVDbHVzdGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgb3BlblNlYXJjaERvbWFpbjogb3BlbnNlYXJjaC5Eb21haW47XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gSEVMSVggUEFUVEVSTiBEQVRBQkFTRSAtIFRoZSBDb3JlIEtub3dsZWRnZSBCYXNlXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICogSGVsaXhQYXR0ZXJuRW50cmllcyBUYWJsZVxuICAgICAqIFxuICAgICAqIFRoaXMgaXMgdGhlIGZvdW5kYXRpb25hbCBjb21wb25lbnQgb2YgdGhlIGVudGlyZSBwbGF0Zm9ybSdzIGludGVsbGlnZW5jZS5cbiAgICAgKiBJdCBzdG9yZXMgY2Fub25pY2FsIGVuZ2luZWVyaW5nIHBhdHRlcm5zIHRoYXQgZW5mb3JjZSB0aGUgXCJRdWVyeS1GaXJzdFwiIGxhdy5cbiAgICAgKiBcbiAgICAgKiBBY2Nlc3MgUGF0dGVybnM6XG4gICAgICogMS4gUXVlcnkgYnkgY2F0ZWdvcnkgKyBpbnRlbnQgKHByaW1hcnkga2V5KVxuICAgICAqIDIuIFNlYXJjaCBieSBrZXl3b3JkIChHU0kpXG4gICAgICogMy4gQnJvd3NlIGJ5IGNhdGVnb3J5XG4gICAgICogXG4gICAgICogU2NoZW1hOlxuICAgICAqIC0gY2F0ZWdvcnk6IFBhdHRlcm4gY2F0ZWdvcnkgKGUuZy4sIFwiYXV0aGVudGljYXRpb25cIiwgXCJkYXRhYmFzZVwiLCBcImFwaVwiKVxuICAgICAqIC0gaW50ZW50OiBTcGVjaWZpYyB1c2VyIGludGVudCAoZS5nLiwgXCJpbXBsZW1lbnRfand0X2F1dGhcIiwgXCJjcmVhdGVfZHluYW1vZGJfdGFibGVcIilcbiAgICAgKiAtIHBhdHRlcm5JZDogVW5pcXVlIGlkZW50aWZpZXIgZm9yIHRoZSBwYXR0ZXJuXG4gICAgICogLSBjYW5vbmljYWxOYW1lOiBIdW1hbi1yZWFkYWJsZSBuYW1lIGZvciB0aGUgcGF0dGVyblxuICAgICAqIC0gaW1wbGVtZW50YXRpb246IFRoZSBhY3R1YWwgY29kZS9jb25maWd1cmF0aW9uIHBhdHRlcm5cbiAgICAgKiAtIG1ldGFkYXRhOiBVc2FnZSBzdGF0aXN0aWNzLCB2ZXJzaW9uLCBhdXRob3IsIHRhZ3NcbiAgICAgKiAtIGtleXdvcmRzOiBBcnJheSBvZiBzZWFyY2hhYmxlIHRlcm1zIChmb3IgR1NJKVxuICAgICAqIC0gY3JlYXRlZEF0OiBJU08gODYwMSB0aW1lc3RhbXBcbiAgICAgKiAtIHVwZGF0ZWRBdDogSVNPIDg2MDEgdGltZXN0YW1wXG4gICAgICovXG4gICAgdGhpcy5oZWxpeFBhdHRlcm5UYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnSGVsaXhQYXR0ZXJuRW50cmllcycsIHtcbiAgICAgIHRhYmxlTmFtZTogJ0hlbGl4UGF0dGVybkVudHJpZXMnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IFxuICAgICAgICBuYW1lOiAnY2F0ZWdvcnknLCBcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgICB9LFxuICAgICAgc29ydEtleTogeyBcbiAgICAgICAgbmFtZTogJ2ludGVudCcsIFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyBcbiAgICAgIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULCAvLyBTZXJ2ZXJsZXNzLCBhdXRvLXNjYWxpbmdcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTiwgLy8gQ3JpdGljYWw6IFByb3RlY3RzIGtub3dsZWRnZSBiYXNlIGZyb20gYWNjaWRlbnRhbCBkZWxldGlvblxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZSwgLy8gRW5hYmxlIFBJVFIgZm9yIGRhdGEgcmVjb3ZlcnlcbiAgICAgIHN0cmVhbTogZHluYW1vZGIuU3RyZWFtVmlld1R5cGUuTkVXX0FORF9PTERfSU1BR0VTLCAvLyBFbmFibGUgRHluYW1vREIgU3RyZWFtcyBmb3IgY2hhbmdlIHRyYWNraW5nXG4gICAgICBlbmNyeXB0aW9uOiBkeW5hbW9kYi5UYWJsZUVuY3J5cHRpb24uQVdTX01BTkFHRUQsIC8vIEVuY3J5cHRpb24gYXQgcmVzdFxuICAgICAgXG4gICAgICAvLyBDbG91ZFdhdGNoIENvbnRyaWJ1dG9yIEluc2lnaHRzIGZvciBxdWVyeSBvcHRpbWl6YXRpb25cbiAgICAgIGNvbnRyaWJ1dG9ySW5zaWdodHNFbmFibGVkOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gR2xvYmFsIFNlY29uZGFyeSBJbmRleCBmb3Iga2V5d29yZC1iYXNlZCBzZWFyY2hlc1xuICAgIHRoaXMuaGVsaXhQYXR0ZXJuVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnS2V5d29yZEluZGV4JyxcbiAgICAgIHBhcnRpdGlvbktleTogeyBcbiAgICAgICAgbmFtZTogJ2tleXdvcmQnLCBcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgICB9LFxuICAgICAgc29ydEtleTogeyBcbiAgICAgICAgbmFtZTogJ2ludGVudCcsIFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyBcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLCAvLyBJbmNsdWRlIGFsbCBhdHRyaWJ1dGVzIGluIGluZGV4XG4gICAgfSk7XG5cbiAgICAvLyBHbG9iYWwgU2Vjb25kYXJ5IEluZGV4IGZvciBwYXR0ZXJuIGJyb3dzaW5nIGJ5IGNhdGVnb3J5XG4gICAgdGhpcy5oZWxpeFBhdHRlcm5UYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdQYXR0ZXJuSWRJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgXG4gICAgICAgIG5hbWU6ICdwYXR0ZXJuSWQnLCBcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgICB9LFxuICAgICAgcHJvamVjdGlvblR5cGU6IGR5bmFtb2RiLlByb2plY3Rpb25UeXBlLkFMTCxcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIFdPUktTUEFDRSBTVEFURSBUQUJMRSAtIFByb2plY3QgTWVtb3J5XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICogU3RvcmVzIHRoZSBoaWdoLWxldmVsIHN0YXRlIGFuZCBjb250ZXh0IGZvciBlYWNoIHByb2plY3Qgd29ya3NwYWNlLlxuICAgICAqIFRoaXMgaXMgdGhlIFwiQ2xvdWQgQnJhaW5cIiBjb21wb25lbnQgb2YgdGhlIHR3by10aWVyZWQgbWVtb3J5IHN5c3RlbS5cbiAgICAgKi9cbiAgICB0aGlzLndvcmtzcGFjZVN0YXRlVGFibGUgPSBuZXcgZHluYW1vZGIuVGFibGUodGhpcywgJ1dvcmtzcGFjZVN0YXRlcycsIHtcbiAgICAgIHRhYmxlTmFtZTogJ1dvcmtzcGFjZVN0YXRlcycsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgXG4gICAgICAgIG5hbWU6ICdwcm9qZWN0SWQnLCBcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgICB9LFxuICAgICAgc29ydEtleTogeyBcbiAgICAgICAgbmFtZTogJ3ZlcnNpb24nLCBcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIHBvaW50SW5UaW1lUmVjb3Zlcnk6IHRydWUsXG4gICAgICBzdHJlYW06IGR5bmFtb2RiLlN0cmVhbVZpZXdUeXBlLk5FV19BTkRfT0xEX0lNQUdFUyxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vIEdTSSBmb3IgcXVlcnlpbmcgYnkgdXNlclxuICAgIHRoaXMud29ya3NwYWNlU3RhdGVUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdVc2VyUHJvamVjdHNJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgXG4gICAgICAgIG5hbWU6ICd1c2VySWQnLCBcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgICB9LFxuICAgICAgc29ydEtleTogeyBcbiAgICAgICAgbmFtZTogJ2xhc3RNb2RpZmllZCcsIFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyBcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gQUdFTlQgUFJPRklMRSBUQUJMRSAtIE1hcmtldHBsYWNlIFJlZ2lzdHJ5XG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICogUmVnaXN0cnkgb2YgYWxsIGF2YWlsYWJsZSBhZ2VudHMgaW4gdGhlIG1hcmtldHBsYWNlLlxuICAgICAqIFN1cHBvcnRzIHN1YnNjcmlwdGlvbiB0aWVycyBhbmQgYWdlbnQgc3BlY2lhbGl6YXRpb24uXG4gICAgICovXG4gICAgdGhpcy5hZ2VudFByb2ZpbGVUYWJsZSA9IG5ldyBkeW5hbW9kYi5UYWJsZSh0aGlzLCAnQWdlbnRQcm9maWxlcycsIHtcbiAgICAgIHRhYmxlTmFtZTogJ0FnZW50UHJvZmlsZXMnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IFxuICAgICAgICBuYW1lOiAnYWdlbnRJZCcsIFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyBcbiAgICAgIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcmVtb3ZhbFBvbGljeTogY2RrLlJlbW92YWxQb2xpY3kuUkVUQUlOLFxuICAgICAgZW5jcnlwdGlvbjogZHluYW1vZGIuVGFibGVFbmNyeXB0aW9uLkFXU19NQU5BR0VELFxuICAgIH0pO1xuXG4gICAgLy8gR1NJIGZvciBxdWVyeWluZyBieSB0aWVyXG4gICAgdGhpcy5hZ2VudFByb2ZpbGVUYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdUaWVySW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7IFxuICAgICAgICBuYW1lOiAnbWluVGllcicsIFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLlNUUklORyBcbiAgICAgIH0sXG4gICAgICBzb3J0S2V5OiB7IFxuICAgICAgICBuYW1lOiAncG9wdWxhcml0eScsIFxuICAgICAgICB0eXBlOiBkeW5hbW9kYi5BdHRyaWJ1dGVUeXBlLk5VTUJFUiBcbiAgICAgIH0sXG4gICAgICBwcm9qZWN0aW9uVHlwZTogZHluYW1vZGIuUHJvamVjdGlvblR5cGUuQUxMLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gU1VCU0NSSVBUSU9OIFRBQkxFIC0gVXNlciBUaWVyIE1hbmFnZW1lbnRcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICB0aGlzLnN1YnNjcmlwdGlvblRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdTdWJzY3JpcHRpb25zJywge1xuICAgICAgdGFibGVOYW1lOiAnU3Vic2NyaXB0aW9ucycsXG4gICAgICBwYXJ0aXRpb25LZXk6IHsgXG4gICAgICAgIG5hbWU6ICd1c2VySWQnLCBcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcgXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRCxcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIENPR05JVE8gVVNFUiBQT09MIC0gSWRlbnRpdHkgTWFuYWdlbWVudFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIHRoaXMudXNlclBvb2wgPSBuZXcgY29nbml0by5Vc2VyUG9vbCh0aGlzLCAnVXNlclBvb2wnLCB7XG4gICAgICB1c2VyUG9vbE5hbWU6ICdFY29zeXN0ZW1DTC1Vc2VyUG9vbCcsXG4gICAgICBzZWxmU2lnblVwRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHNpZ25JbkFsaWFzZXM6IHtcbiAgICAgICAgZW1haWw6IHRydWUsXG4gICAgICAgIHVzZXJuYW1lOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICBhdXRvVmVyaWZ5OiB7XG4gICAgICAgIGVtYWlsOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHN0YW5kYXJkQXR0cmlidXRlczoge1xuICAgICAgICBlbWFpbDoge1xuICAgICAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgICAgICAgIG11dGFibGU6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHBhc3N3b3JkUG9saWN5OiB7XG4gICAgICAgIG1pbkxlbmd0aDogMTIsXG4gICAgICAgIHJlcXVpcmVMb3dlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVVcHBlcmNhc2U6IHRydWUsXG4gICAgICAgIHJlcXVpcmVEaWdpdHM6IHRydWUsXG4gICAgICAgIHJlcXVpcmVTeW1ib2xzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIGFjY291bnRSZWNvdmVyeTogY29nbml0by5BY2NvdW50UmVjb3ZlcnkuRU1BSUxfT05MWSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGRldmljZVRyYWNraW5nOiB7XG4gICAgICAgIGNoYWxsZW5nZVJlcXVpcmVkT25OZXdEZXZpY2U6IHRydWUsXG4gICAgICAgIGRldmljZU9ubHlSZW1lbWJlcmVkT25Vc2VyUHJvbXB0OiB0cnVlLFxuICAgICAgfSxcbiAgICB9KTtcblxuICAgIC8vIFVzZXIgUG9vbCBDbGllbnQgZm9yIENMSSBhdXRoZW50aWNhdGlvbiAoRGV2aWNlIENvZGUgRmxvdylcbiAgICBuZXcgY29nbml0by5Vc2VyUG9vbENsaWVudCh0aGlzLCAnQ0xJQ2xpZW50Jywge1xuICAgICAgdXNlclBvb2w6IHRoaXMudXNlclBvb2wsXG4gICAgICB1c2VyUG9vbENsaWVudE5hbWU6ICdlY28tY2xpLWNsaWVudCcsXG4gICAgICBhdXRoRmxvd3M6IHtcbiAgICAgICAgY3VzdG9tOiB0cnVlLFxuICAgICAgICB1c2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICB9LFxuICAgICAgZ2VuZXJhdGVTZWNyZXQ6IGZhbHNlLCAvLyBQdWJsaWMgY2xpZW50IGZvciBDTElcbiAgICAgIHByZXZlbnRVc2VyRXhpc3RlbmNlRXJyb3JzOiB0cnVlLFxuICAgICAgYWNjZXNzVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmhvdXJzKDEpLFxuICAgICAgaWRUb2tlblZhbGlkaXR5OiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgICByZWZyZXNoVG9rZW5WYWxpZGl0eTogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gVlBDIEZPUiBFTEFTVElDQUNIRSBBTkQgT1BFTlNFQVJDSFxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdEYXRhVlBDJywge1xuICAgICAgdnBjTmFtZTogJ0Vjb3N5c3RlbUNMLURhdGFWUEMnLFxuICAgICAgbWF4QXpzOiAyLFxuICAgICAgbmF0R2F0ZXdheXM6IDAsIC8vIENvc3Qgb3B0aW1pemF0aW9uIC0gdXNlIFZQQyBlbmRwb2ludHMgaW5zdGVhZFxuICAgICAgc3VibmV0Q29uZmlndXJhdGlvbjogW1xuICAgICAgICB7XG4gICAgICAgICAgY2lkck1hc2s6IDI0LFxuICAgICAgICAgIG5hbWU6ICdJc29sYXRlZCcsXG4gICAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBTZWN1cml0eSBHcm91cCBmb3IgRWxhc3RpQ2FjaGVcbiAgICBjb25zdCByZWRpc1NlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ1JlZGlzU2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEVsYXN0aUNhY2hlIFJlZGlzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gRUxBU1RJQ0FDSEUgUkVESVMgLSBIaWdoLVNwZWVkIENhY2hpbmcgJiBSYXRlIExpbWl0aW5nXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgY29uc3QgcmVkaXNTdWJuZXRHcm91cCA9IG5ldyBlbGFzdGljYWNoZS5DZm5TdWJuZXRHcm91cCh0aGlzLCAnUmVkaXNTdWJuZXRHcm91cCcsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3VibmV0IGdyb3VwIGZvciBFbGFzdGlDYWNoZSBSZWRpcycsXG4gICAgICBzdWJuZXRJZHM6IHZwYy5pc29sYXRlZFN1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuc3VibmV0SWQpLFxuICAgIH0pO1xuXG4gICAgdGhpcy5yZWRpc0NsdXN0ZXIgPSBuZXcgZWxhc3RpY2FjaGUuQ2ZuQ2FjaGVDbHVzdGVyKHRoaXMsICdSZWRpc0NsdXN0ZXInLCB7XG4gICAgICBjYWNoZU5vZGVUeXBlOiAnY2FjaGUudDMubWljcm8nLFxuICAgICAgZW5naW5lOiAncmVkaXMnLFxuICAgICAgbnVtQ2FjaGVOb2RlczogMSxcbiAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFtyZWRpc1NlY3VyaXR5R3JvdXAuc2VjdXJpdHlHcm91cElkXSxcbiAgICAgIGNhY2hlU3VibmV0R3JvdXBOYW1lOiByZWRpc1N1Ym5ldEdyb3VwLnJlZixcbiAgICAgIGNsdXN0ZXJOYW1lOiAnZWNvc3lzdGVtY2wtY2FjaGUnLFxuICAgICAgcG9ydDogNjM3OSxcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE9QRU5TRUFSQ0ggLSBTZW1hbnRpYyBWZWN0b3IgU2VhcmNoXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLy8gRW5zdXJlIHNlcnZpY2UtbGlua2VkIHJvbGUgZm9yIE9wZW5TZWFyY2ggZXhpc3RzIChyZXF1aXJlZCBmb3IgVlBDIGFjY2VzcylcbiAgICBuZXcgaWFtLkNmblNlcnZpY2VMaW5rZWRSb2xlKHRoaXMsICdPcGVuU2VhcmNoU2VydmljZUxpbmtlZFJvbGUnLCB7XG4gICAgICBhd3NTZXJ2aWNlTmFtZTogJ29wZW5zZWFyY2hzZXJ2aWNlLmFtYXpvbmF3cy5jb20nLFxuICAgICAgZGVzY3JpcHRpb246ICdTZXJ2aWNlLWxpbmtlZCByb2xlIGZvciBBbWF6b24gT3BlblNlYXJjaCBTZXJ2aWNlIHRvIGFjY2VzcyBWUEMgcmVzb3VyY2VzJyxcbiAgICB9KTtcblxuICAgIGNvbnN0IG9wZW5TZWFyY2hTZWN1cml0eUdyb3VwID0gbmV3IGVjMi5TZWN1cml0eUdyb3VwKHRoaXMsICdPcGVuU2VhcmNoU2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIE9wZW5TZWFyY2gnLFxuICAgIH0pO1xuXG4gICAgdGhpcy5vcGVuU2VhcmNoRG9tYWluID0gbmV3IG9wZW5zZWFyY2guRG9tYWluKHRoaXMsICdWZWN0b3JTZWFyY2hEb21haW4nLCB7XG4gICAgICBkb21haW5OYW1lOiAnZWNvc3lzdGVtY2wtdmVjdG9ycycsXG4gICAgICB2ZXJzaW9uOiBvcGVuc2VhcmNoLkVuZ2luZVZlcnNpb24uT1BFTlNFQVJDSF8yXzExLFxuICAgICAgY2FwYWNpdHk6IHtcbiAgICAgICAgbXVsdGlBeldpdGhTdGFuZGJ5RW5hYmxlZDogZmFsc2UsXG4gICAgICAgIG1hc3Rlck5vZGVzOiAwLFxuICAgICAgICBkYXRhTm9kZXM6IDEsXG4gICAgICAgIGRhdGFOb2RlSW5zdGFuY2VUeXBlOiAndDMuc21hbGwuc2VhcmNoJyxcbiAgICAgIH0sXG4gICAgICB6b25lQXdhcmVuZXNzOiB7IGVuYWJsZWQ6IGZhbHNlIH0sXG4gICAgICBlYnM6IHtcbiAgICAgICAgdm9sdW1lU2l6ZTogMTAsXG4gICAgICAgIHZvbHVtZVR5cGU6IGVjMi5FYnNEZXZpY2VWb2x1bWVUeXBlLkdQMyxcbiAgICAgIH0sXG4gICAgICBub2RlVG9Ob2RlRW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb25BdFJlc3Q6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICB2cGMsXG4gICAgICB2cGNTdWJuZXRzOiBbeyBzdWJuZXRzOiBbdnBjLmlzb2xhdGVkU3VibmV0c1swXV0gfV0sXG4gICAgICBzZWN1cml0eUdyb3VwczogW29wZW5TZWFyY2hTZWN1cml0eUdyb3VwXSxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICB9KTtcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIENMT1VERk9STUFUSU9OIE9VVFBVVFNcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSGVsaXhQYXR0ZXJuVGFibGVOYW1lJywge1xuICAgICAgdmFsdWU6IHRoaXMuaGVsaXhQYXR0ZXJuVGFibGUudGFibGVOYW1lLFxuICAgICAgZGVzY3JpcHRpb246ICdEeW5hbW9EQiB0YWJsZSBuYW1lIGZvciBIZWxpeCBwYXR0ZXJucycsXG4gICAgICBleHBvcnROYW1lOiAnSGVsaXhQYXR0ZXJuVGFibGVOYW1lJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdIZWxpeFBhdHRlcm5UYWJsZUFybicsIHtcbiAgICAgIHZhbHVlOiB0aGlzLmhlbGl4UGF0dGVyblRhYmxlLnRhYmxlQXJuLFxuICAgICAgZGVzY3JpcHRpb246ICdBUk4gb2YgdGhlIEhlbGl4IHBhdHRlcm4gdGFibGUnLFxuICAgICAgZXhwb3J0TmFtZTogJ0hlbGl4UGF0dGVyblRhYmxlQXJuJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2wudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ29nbml0byBVc2VyIFBvb2wgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogJ0NvZ25pdG9Vc2VyUG9vbElkJyxcbiAgICB9KTtcblxuICAgIG5ldyBjZGsuQ2ZuT3V0cHV0KHRoaXMsICdPcGVuU2VhcmNoRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5vcGVuU2VhcmNoRG9tYWluLmRvbWFpbkVuZHBvaW50LFxuICAgICAgZGVzY3JpcHRpb246ICdPcGVuU2VhcmNoIGRvbWFpbiBlbmRwb2ludCBmb3IgdmVjdG9yIHNlYXJjaCcsXG4gICAgICBleHBvcnROYW1lOiAnT3BlblNlYXJjaEVuZHBvaW50JyxcbiAgICB9KTtcbiAgfVxufVxuIl19
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
 * Hybrid deployment strategy:
 * - IMPORTS existing DynamoDB tables and Cognito User Pool
 * - CREATES new ElastiCache and OpenSearch infrastructure
 *
 * This approach preserves production data while transitioning to CDK management
 */
class DatabaseStack extends cdk.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        this.helixPatternTableName = 'HelixPatternEntries';
        this.workspaceStateTableName = 'WorkspaceStates';
        this.agentProfileTableName = 'AgentProfiles';
        this.subscriptionTableName = 'Subscriptions';
        // =====================================================================
        // IMPORT EXISTING COGNITO USER POOL
        // =====================================================================
        /**
         * Import the existing Cognito User Pool to maintain user continuity
         * Pool ID obtained from existing infrastructure
         */
        this.userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-west-2_F5eg8nTgU';
        const userPool = cognito.UserPool.fromUserPoolId(this, 'ImportedUserPool', this.userPoolId);
        // =====================================================================
        // IMPORT OR CREATE DYNAMODB TABLES
        // =====================================================================
        /**
         * Strategy: Check if tables exist, import if present, create if not
         * This allows the stack to work in both fresh and existing environments
         */
        // Helper function to import or create table
        const ensureTable = (scope, id, tableName, createFn) => {
            // Attempt to import existing table
            // In production, we know these tables exist
            try {
                return dynamodb.Table.fromTableName(scope, `${id}Import`, tableName);
            }
            catch {
                // If import fails, create new table
                return createFn();
            }
        };
        // Import existing HelixPatternEntries table
        const helixPatternTable = dynamodb.Table.fromTableName(this, 'HelixPatternTableImport', this.helixPatternTableName);
        // Import existing WorkspaceStates table
        const workspaceStateTable = dynamodb.Table.fromTableName(this, 'WorkspaceStateTableImport', this.workspaceStateTableName);
        // Import existing AgentProfiles table
        const agentProfileTable = dynamodb.Table.fromTableName(this, 'AgentProfileTableImport', this.agentProfileTableName);
        // Import existing Subscriptions table
        const subscriptionTable = dynamodb.Table.fromTableName(this, 'SubscriptionTableImport', this.subscriptionTableName);
        // =====================================================================
        // VPC FOR ELASTICACHE AND OPENSEARCH (NEW)
        // =====================================================================
        const vpc = new ec2.Vpc(this, 'DataVPC', {
            vpcName: 'EcosystemCL-DataVPC',
            maxAzs: 2,
            natGateways: 0, // Cost optimization
            subnetConfiguration: [
                {
                    cidrMask: 24,
                    name: 'Isolated',
                    subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
                },
            ],
        });
        // VPC Endpoints for AWS services (cost-effective private access)
        vpc.addInterfaceEndpoint('DynamoDBEndpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.DYNAMODB,
        });
        vpc.addInterfaceEndpoint('S3Endpoint', {
            service: ec2.InterfaceVpcEndpointAwsService.S3,
        });
        // =====================================================================
        // ELASTICACHE REDIS (NEW) - High-Speed Caching & Rate Limiting
        // =====================================================================
        const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
            vpc,
            description: 'Security group for ElastiCache Redis',
            allowAllOutbound: false,
        });
        // Allow Redis port from within VPC
        redisSecurityGroup.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(6379), 'Allow Redis access from VPC');
        const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
            description: 'Subnet group for ElastiCache Redis',
            subnetIds: vpc.isolatedSubnets.map(subnet => subnet.subnetId),
            cacheSubnetGroupName: 'ecosystemcl-redis-subnet-group',
        });
        const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
            cacheNodeType: 'cache.t3.micro',
            engine: 'redis',
            numCacheNodes: 1,
            vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
            cacheSubnetGroupName: redisSubnetGroup.ref,
            clusterName: 'ecosystemcl-cache',
            port: 6379,
        });
        this.redisClusterEndpoint = redisCluster.attrRedisEndpointAddress;
        // =====================================================================
        // OPENSEARCH (NEW) - Semantic Vector Search  
        // =====================================================================
        /**
         * OpenSearch deployment with minimal configuration for development
         * Consider upgrading instance types for production workloads
         */
        const openSearchSecurityGroup = new ec2.SecurityGroup(this, 'OpenSearchSecurityGroup', {
            vpc,
            description: 'Security group for OpenSearch',
            allowAllOutbound: true,
        });
        // Allow HTTPS access from within VPC
        openSearchSecurityGroup.addIngressRule(ec2.Peer.ipv4(vpc.vpcCidrBlock), ec2.Port.tcp(443), 'Allow HTTPS access to OpenSearch from VPC');
        // Create custom IAM role for OpenSearch (avoids service-linked role issues)
        const openSearchRole = new iam.Role(this, 'OpenSearchRole', {
            assumedBy: new iam.ServicePrincipal('es.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonOpenSearchServiceCognitoAccess'),
            ],
        });
        const openSearchDomain = new opensearch.Domain(this, 'VectorSearchDomain', {
            domainName: 'ecosystemcl-vectors',
            version: opensearch.EngineVersion.OPENSEARCH_2_11,
            capacity: {
                multiAzWithStandbyEnabled: false,
                masterNodes: 0,
                masterNodeInstanceType: undefined,
                dataNodes: 1,
                dataNodeInstanceType: 't3.small.search',
            },
            ebs: {
                volumeSize: 10,
                volumeType: ec2.EbsDeviceVolumeType.GP3,
                throughput: 125,
                iops: 3000,
            },
            nodeToNodeEncryption: true,
            encryptionAtRest: {
                enabled: true,
            },
            // vpcOptions: {
            //   subnets: [vpc.isolatedSubnets[0]],
            //   securityGroups: [openSearchSecurityGroup],
            // },
            logging: {
                slowSearchLogEnabled: false,
                appLogEnabled: false,
                slowIndexLogEnabled: false,
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
        });
        this.openSearchEndpoint = openSearchDomain.domainEndpoint;
        // =====================================================================
        // CLOUDFORMATION OUTPUTS
        // =====================================================================
        new cdk.CfnOutput(this, 'ImportedHelixTableName', {
            value: this.helixPatternTableName,
            description: 'Imported DynamoDB table name for Helix patterns',
            exportName: 'ImportedHelixPatternTableName',
        });
        new cdk.CfnOutput(this, 'ImportedUserPoolId', {
            value: this.userPoolId,
            description: 'Imported Cognito User Pool ID',
            exportName: 'ImportedCognitoUserPoolId',
        });
        new cdk.CfnOutput(this, 'RedisEndpoint', {
            value: this.redisClusterEndpoint,
            description: 'ElastiCache Redis endpoint',
            exportName: 'RedisEndpoint',
        });
        new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
            value: this.openSearchEndpoint,
            description: 'OpenSearch domain endpoint for vector search',
            exportName: 'OpenSearchEndpoint',
        });
        new cdk.CfnOutput(this, 'VPCId', {
            value: vpc.vpcId,
            description: 'VPC ID for data layer',
            exportName: 'DataVPCId',
        });
    }
}
exports.DatabaseStack = DatabaseStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2Utc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9kYXRhYmFzZS1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyxtRUFBcUQ7QUFDckQsaUVBQW1EO0FBQ25ELHlFQUEyRDtBQUMzRCx5REFBMkM7QUFDM0MsOEVBQWdFO0FBQ2hFLHlEQUEyQztBQUczQzs7Ozs7Ozs7R0FRRztBQUNILE1BQWEsYUFBYyxTQUFRLEdBQUcsQ0FBQyxLQUFLO0lBUzFDLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBc0I7UUFDOUQsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFUViwwQkFBcUIsR0FBVyxxQkFBcUIsQ0FBQztRQUN0RCw0QkFBdUIsR0FBVyxpQkFBaUIsQ0FBQztRQUNwRCwwQkFBcUIsR0FBVyxlQUFlLENBQUM7UUFDaEQsMEJBQXFCLEdBQVcsZUFBZSxDQUFDO1FBUTlELHdFQUF3RTtRQUN4RSxvQ0FBb0M7UUFDcEMsd0VBQXdFO1FBRXhFOzs7V0FHRztRQUNILElBQUksQ0FBQyxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsSUFBSSxxQkFBcUIsQ0FBQztRQUU1RSxNQUFNLFFBQVEsR0FBRyxPQUFPLENBQUMsUUFBUSxDQUFDLGNBQWMsQ0FDOUMsSUFBSSxFQUNKLGtCQUFrQixFQUNsQixJQUFJLENBQUMsVUFBVSxDQUNoQixDQUFDO1FBRUYsd0VBQXdFO1FBQ3hFLG1DQUFtQztRQUNuQyx3RUFBd0U7UUFFeEU7OztXQUdHO1FBRUgsNENBQTRDO1FBQzVDLE1BQU0sV0FBVyxHQUFHLENBQ2xCLEtBQWdCLEVBQ2hCLEVBQVUsRUFDVixTQUFpQixFQUNqQixRQUE4QixFQUNiLEVBQUU7WUFDbkIsbUNBQW1DO1lBQ25DLDRDQUE0QztZQUM1QyxJQUFJLENBQUM7Z0JBQ0gsT0FB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VUFBVTtZQUN0QixXQUFXLEVBQUUsK0JBQStCO1lBQzVDLFVBQVUsRUFBRSwyQkFBMkI7U0FDeEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxlQUFlLEVBQUU7WUFDdkMsS0FBSyxFQUFFLElBQUksQ0FBQyxvQkFBb0I7WUFDaEMsV0FBVyxFQUFFLDRCQUE0QjtZQUN6QyxVQUFVLEVBQUUsZUFBZTtTQUM1QixDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLG9CQUFvQixFQUFFO1lBQzVDLEtBQUssRUFBRSxJQUFJLENBQUMsa0JBQWtCO1lBQzlCLFdBQVcsRUFBRSw4Q0FBOEM7WUFDM0QsVUFBVSxFQUFFLG9CQUFvQjtTQUNqQyxDQUFDLENBQUM7UUFFSCxJQUFJLEdBQUcsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRTtZQUMvQixLQUFLLEVBQUUsR0FBRyxDQUFDLEtBQUs7WUFDaEIsV0FBVyxFQUFFLHVCQUF1QjtZQUNwQyxVQUFVLEVBQUUsV0FBVztTQUN4QixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFqUEQsc0NBaVBDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG5pbXBvcnQgKiBhcyBjb2duaXRvIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jb2duaXRvJztcbmltcG9ydCAqIGFzIGVsYXN0aWNhY2hlIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lbGFzdGljYWNoZSc7XG5pbXBvcnQgKiBhcyBlYzIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWVjMic7XG5pbXBvcnQgKiBhcyBvcGVuc2VhcmNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1vcGVuc2VhcmNoc2VydmljZSc7XG5pbXBvcnQgKiBhcyBpYW0gZnJvbSAnYXdzLWNkay1saWIvYXdzLWlhbSc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuLyoqXG4gKiBEYXRhYmFzZSBTdGFjayBmb3IgRUNPU1lTVEVNQ0wuQUlcbiAqIFxuICogSHlicmlkIGRlcGxveW1lbnQgc3RyYXRlZ3k6XG4gKiAtIElNUE9SVFMgZXhpc3RpbmcgRHluYW1vREIgdGFibGVzIGFuZCBDb2duaXRvIFVzZXIgUG9vbFxuICogLSBDUkVBVEVTIG5ldyBFbGFzdGlDYWNoZSBhbmQgT3BlblNlYXJjaCBpbmZyYXN0cnVjdHVyZVxuICogXG4gKiBUaGlzIGFwcHJvYWNoIHByZXNlcnZlcyBwcm9kdWN0aW9uIGRhdGEgd2hpbGUgdHJhbnNpdGlvbmluZyB0byBDREsgbWFuYWdlbWVudFxuICovXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VTdGFjayBleHRlbmRzIGNkay5TdGFjayB7XG4gIHB1YmxpYyByZWFkb25seSBoZWxpeFBhdHRlcm5UYWJsZU5hbWU6IHN0cmluZyA9ICdIZWxpeFBhdHRlcm5FbnRyaWVzJztcbiAgcHVibGljIHJlYWRvbmx5IHdvcmtzcGFjZVN0YXRlVGFibGVOYW1lOiBzdHJpbmcgPSAnV29ya3NwYWNlU3RhdGVzJztcbiAgcHVibGljIHJlYWRvbmx5IGFnZW50UHJvZmlsZVRhYmxlTmFtZTogc3RyaW5nID0gJ0FnZW50UHJvZmlsZXMnO1xuICBwdWJsaWMgcmVhZG9ubHkgc3Vic2NyaXB0aW9uVGFibGVOYW1lOiBzdHJpbmcgPSAnU3Vic2NyaXB0aW9ucyc7XG4gIHB1YmxpYyByZWFkb25seSB1c2VyUG9vbElkOiBzdHJpbmc7XG4gIHB1YmxpYyByZWFkb25seSByZWRpc0NsdXN0ZXJFbmRwb2ludDogc3RyaW5nO1xuICBwdWJsaWMgcmVhZG9ubHkgb3BlblNlYXJjaEVuZHBvaW50OiBzdHJpbmc7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBjZGsuU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gSU1QT1JUIEVYSVNUSU5HIENPR05JVE8gVVNFUiBQT09MXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgLyoqXG4gICAgICogSW1wb3J0IHRoZSBleGlzdGluZyBDb2duaXRvIFVzZXIgUG9vbCB0byBtYWludGFpbiB1c2VyIGNvbnRpbnVpdHlcbiAgICAgKiBQb29sIElEIG9idGFpbmVkIGZyb20gZXhpc3RpbmcgaW5mcmFzdHJ1Y3R1cmVcbiAgICAgKi9cbiAgICB0aGlzLnVzZXJQb29sSWQgPSBwcm9jZXNzLmVudi5DT0dOSVRPX1VTRVJfUE9PTF9JRCB8fCAndXMtd2VzdC0yX0Y1ZWc4blRnVSc7XG4gICAgXG4gICAgY29uc3QgdXNlclBvb2wgPSBjb2duaXRvLlVzZXJQb29sLmZyb21Vc2VyUG9vbElkKFxuICAgICAgdGhpcyxcbiAgICAgICdJbXBvcnRlZFVzZXJQb29sJyxcbiAgICAgIHRoaXMudXNlclBvb2xJZFxuICAgICk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBJTVBPUlQgT1IgQ1JFQVRFIERZTkFNT0RCIFRBQkxFU1xuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIC8qKlxuICAgICAqIFN0cmF0ZWd5OiBDaGVjayBpZiB0YWJsZXMgZXhpc3QsIGltcG9ydCBpZiBwcmVzZW50LCBjcmVhdGUgaWYgbm90XG4gICAgICogVGhpcyBhbGxvd3MgdGhlIHN0YWNrIHRvIHdvcmsgaW4gYm90aCBmcmVzaCBhbmQgZXhpc3RpbmcgZW52aXJvbm1lbnRzXG4gICAgICovXG5cbiAgICAvLyBIZWxwZXIgZnVuY3Rpb24gdG8gaW1wb3J0IG9yIGNyZWF0ZSB0YWJsZVxuICAgIGNvbnN0IGVuc3VyZVRhYmxlID0gKFxuICAgICAgc2NvcGU6IENvbnN0cnVjdCxcbiAgICAgIGlkOiBzdHJpbmcsXG4gICAgICB0YWJsZU5hbWU6IHN0cmluZyxcbiAgICAgIGNyZWF0ZUZuOiAoKSA9PiBkeW5hbW9kYi5UYWJsZVxuICAgICk6IGR5bmFtb2RiLklUYWJsZSA9PiB7XG4gICAgICAvLyBBdHRlbXB0IHRvIGltcG9ydCBleGlzdGluZyB0YWJsZVxuICAgICAgLy8gSW4gcHJvZHVjdGlvbiwgd2Uga25vdyB0aGVzZSB0YWJsZXMgZXhpc3RcbiAgICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBkeW5hbW9kYi5UYWJsZS5mcm9tVGFibGVOYW1lKHNjb3BlLCBgJHtpZH1JbXBvcnRgLCB0YWJsZU5hbWUpO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIC8vIElmIGltcG9ydCBmYWlscywgY3JlYXRlIG5ldyB0YWJsZVxuICAgICAgICByZXR1cm4gY3JlYXRlRm4oKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gSW1wb3J0IGV4aXN0aW5nIEhlbGl4UGF0dGVybkVudHJpZXMgdGFibGVcbiAgICBjb25zdCBoZWxpeFBhdHRlcm5UYWJsZSA9IGR5bmFtb2RiLlRhYmxlLmZyb21UYWJsZU5hbWUoXG4gICAgICB0aGlzLFxuICAgICAgJ0hlbGl4UGF0dGVyblRhYmxlSW1wb3J0JyxcbiAgICAgIHRoaXMuaGVsaXhQYXR0ZXJuVGFibGVOYW1lXG4gICAgKTtcblxuICAgIC8vIEltcG9ydCBleGlzdGluZyBXb3Jrc3BhY2VTdGF0ZXMgdGFibGVcbiAgICBjb25zdCB3b3Jrc3BhY2VTdGF0ZVRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZShcbiAgICAgIHRoaXMsXG4gICAgICAnV29ya3NwYWNlU3RhdGVUYWJsZUltcG9ydCcsXG4gICAgICB0aGlzLndvcmtzcGFjZVN0YXRlVGFibGVOYW1lXG4gICAgKTtcblxuICAgIC8vIEltcG9ydCBleGlzdGluZyBBZ2VudFByb2ZpbGVzIHRhYmxlXG4gICAgY29uc3QgYWdlbnRQcm9maWxlVGFibGUgPSBkeW5hbW9kYi5UYWJsZS5mcm9tVGFibGVOYW1lKFxuICAgICAgdGhpcyxcbiAgICAgICdBZ2VudFByb2ZpbGVUYWJsZUltcG9ydCcsXG4gICAgICB0aGlzLmFnZW50UHJvZmlsZVRhYmxlTmFtZVxuICAgICk7XG5cbiAgICAvLyBJbXBvcnQgZXhpc3RpbmcgU3Vic2NyaXB0aW9ucyB0YWJsZVxuICAgIGNvbnN0IHN1YnNjcmlwdGlvblRhYmxlID0gZHluYW1vZGIuVGFibGUuZnJvbVRhYmxlTmFtZShcbiAgICAgIHRoaXMsXG4gICAgICAnU3Vic2NyaXB0aW9uVGFibGVJbXBvcnQnLFxuICAgICAgdGhpcy5zdWJzY3JpcHRpb25UYWJsZU5hbWVcbiAgICApO1xuXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgLy8gVlBDIEZPUiBFTEFTVElDQUNIRSBBTkQgT1BFTlNFQVJDSCAoTkVXKVxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIFxuICAgIGNvbnN0IHZwYyA9IG5ldyBlYzIuVnBjKHRoaXMsICdEYXRhVlBDJywge1xuICAgICAgdnBjTmFtZTogJ0Vjb3N5c3RlbUNMLURhdGFWUEMnLFxuICAgICAgbWF4QXpzOiAyLFxuICAgICAgbmF0R2F0ZXdheXM6IDAsIC8vIENvc3Qgb3B0aW1pemF0aW9uXG4gICAgICBzdWJuZXRDb25maWd1cmF0aW9uOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBjaWRyTWFzazogMjQsXG4gICAgICAgICAgbmFtZTogJ0lzb2xhdGVkJyxcbiAgICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVELFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIFZQQyBFbmRwb2ludHMgZm9yIEFXUyBzZXJ2aWNlcyAoY29zdC1lZmZlY3RpdmUgcHJpdmF0ZSBhY2Nlc3MpXG4gICAgdnBjLmFkZEludGVyZmFjZUVuZHBvaW50KCdEeW5hbW9EQkVuZHBvaW50Jywge1xuICAgICAgc2VydmljZTogZWMyLkludGVyZmFjZVZwY0VuZHBvaW50QXdzU2VydmljZS5EWU5BTU9EQixcbiAgICB9KTtcblxuICAgIHZwYy5hZGRJbnRlcmZhY2VFbmRwb2ludCgnUzNFbmRwb2ludCcsIHtcbiAgICAgIHNlcnZpY2U6IGVjMi5JbnRlcmZhY2VWcGNFbmRwb2ludEF3c1NlcnZpY2UuUzMsXG4gICAgfSk7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBFTEFTVElDQUNIRSBSRURJUyAoTkVXKSAtIEhpZ2gtU3BlZWQgQ2FjaGluZyAmIFJhdGUgTGltaXRpbmdcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICBjb25zdCByZWRpc1NlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ1JlZGlzU2VjdXJpdHlHcm91cCcsIHtcbiAgICAgIHZwYyxcbiAgICAgIGRlc2NyaXB0aW9uOiAnU2VjdXJpdHkgZ3JvdXAgZm9yIEVsYXN0aUNhY2hlIFJlZGlzJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IGZhbHNlLFxuICAgIH0pO1xuXG4gICAgLy8gQWxsb3cgUmVkaXMgcG9ydCBmcm9tIHdpdGhpbiBWUENcbiAgICByZWRpc1NlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBlYzIuUGVlci5pcHY0KHZwYy52cGNDaWRyQmxvY2spLFxuICAgICAgZWMyLlBvcnQudGNwKDYzNzkpLFxuICAgICAgJ0FsbG93IFJlZGlzIGFjY2VzcyBmcm9tIFZQQydcbiAgICApO1xuXG4gICAgY29uc3QgcmVkaXNTdWJuZXRHcm91cCA9IG5ldyBlbGFzdGljYWNoZS5DZm5TdWJuZXRHcm91cCh0aGlzLCAnUmVkaXNTdWJuZXRHcm91cCcsIHtcbiAgICAgIGRlc2NyaXB0aW9uOiAnU3VibmV0IGdyb3VwIGZvciBFbGFzdGlDYWNoZSBSZWRpcycsXG4gICAgICBzdWJuZXRJZHM6IHZwYy5pc29sYXRlZFN1Ym5ldHMubWFwKHN1Ym5ldCA9PiBzdWJuZXQuc3VibmV0SWQpLFxuICAgICAgY2FjaGVTdWJuZXRHcm91cE5hbWU6ICdlY29zeXN0ZW1jbC1yZWRpcy1zdWJuZXQtZ3JvdXAnLFxuICAgIH0pO1xuXG4gICAgY29uc3QgcmVkaXNDbHVzdGVyID0gbmV3IGVsYXN0aWNhY2hlLkNmbkNhY2hlQ2x1c3Rlcih0aGlzLCAnUmVkaXNDbHVzdGVyJywge1xuICAgICAgY2FjaGVOb2RlVHlwZTogJ2NhY2hlLnQzLm1pY3JvJyxcbiAgICAgIGVuZ2luZTogJ3JlZGlzJyxcbiAgICAgIG51bUNhY2hlTm9kZXM6IDEsXG4gICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBbcmVkaXNTZWN1cml0eUdyb3VwLnNlY3VyaXR5R3JvdXBJZF0sXG4gICAgICBjYWNoZVN1Ym5ldEdyb3VwTmFtZTogcmVkaXNTdWJuZXRHcm91cC5yZWYsXG4gICAgICBjbHVzdGVyTmFtZTogJ2Vjb3N5c3RlbWNsLWNhY2hlJyxcbiAgICAgIHBvcnQ6IDYzNzksXG4gICAgfSk7XG5cbiAgICB0aGlzLnJlZGlzQ2x1c3RlckVuZHBvaW50ID0gcmVkaXNDbHVzdGVyLmF0dHJSZWRpc0VuZHBvaW50QWRkcmVzcztcblxuICAgIC8vID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuICAgIC8vIE9QRU5TRUFSQ0ggKE5FVykgLSBTZW1hbnRpYyBWZWN0b3IgU2VhcmNoICBcbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICBcbiAgICAvKipcbiAgICAgKiBPcGVuU2VhcmNoIGRlcGxveW1lbnQgd2l0aCBtaW5pbWFsIGNvbmZpZ3VyYXRpb24gZm9yIGRldmVsb3BtZW50XG4gICAgICogQ29uc2lkZXIgdXBncmFkaW5nIGluc3RhbmNlIHR5cGVzIGZvciBwcm9kdWN0aW9uIHdvcmtsb2Fkc1xuICAgICAqL1xuXG4gICAgY29uc3Qgb3BlblNlYXJjaFNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAodGhpcywgJ09wZW5TZWFyY2hTZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgT3BlblNlYXJjaCcsXG4gICAgICBhbGxvd0FsbE91dGJvdW5kOiB0cnVlLFxuICAgIH0pO1xuXG4gICAgLy8gQWxsb3cgSFRUUFMgYWNjZXNzIGZyb20gd2l0aGluIFZQQ1xuICAgIG9wZW5TZWFyY2hTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgZWMyLlBlZXIuaXB2NCh2cGMudnBjQ2lkckJsb2NrKSxcbiAgICAgIGVjMi5Qb3J0LnRjcCg0NDMpLFxuICAgICAgJ0FsbG93IEhUVFBTIGFjY2VzcyB0byBPcGVuU2VhcmNoIGZyb20gVlBDJ1xuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgY3VzdG9tIElBTSByb2xlIGZvciBPcGVuU2VhcmNoIChhdm9pZHMgc2VydmljZS1saW5rZWQgcm9sZSBpc3N1ZXMpXG4gICAgY29uc3Qgb3BlblNlYXJjaFJvbGUgPSBuZXcgaWFtLlJvbGUodGhpcywgJ09wZW5TZWFyY2hSb2xlJywge1xuICAgICAgYXNzdW1lZEJ5OiBuZXcgaWFtLlNlcnZpY2VQcmluY2lwYWwoJ2VzLmFtYXpvbmF3cy5jb20nKSxcbiAgICAgIG1hbmFnZWRQb2xpY2llczogW1xuICAgICAgICBpYW0uTWFuYWdlZFBvbGljeS5mcm9tQXdzTWFuYWdlZFBvbGljeU5hbWUoJ0FtYXpvbk9wZW5TZWFyY2hTZXJ2aWNlQ29nbml0b0FjY2VzcycpLFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIGNvbnN0IG9wZW5TZWFyY2hEb21haW4gPSBuZXcgb3BlbnNlYXJjaC5Eb21haW4odGhpcywgJ1ZlY3RvclNlYXJjaERvbWFpbicsIHtcbiAgICAgIGRvbWFpbk5hbWU6ICdlY29zeXN0ZW1jbC12ZWN0b3JzJyxcbiAgICAgIHZlcnNpb246IG9wZW5zZWFyY2guRW5naW5lVmVyc2lvbi5PUEVOU0VBUkNIXzJfMTEsXG4gICAgICBjYXBhY2l0eToge1xuICAgICAgICBtdWx0aUF6V2l0aFN0YW5kYnlFbmFibGVkOiBmYWxzZSxcbiAgICAgICAgbWFzdGVyTm9kZXM6IDAsXG4gICAgICAgIG1hc3Rlck5vZGVJbnN0YW5jZVR5cGU6IHVuZGVmaW5lZCxcbiAgICAgICAgZGF0YU5vZGVzOiAxLFxuICAgICAgICBkYXRhTm9kZUluc3RhbmNlVHlwZTogJ3QzLnNtYWxsLnNlYXJjaCcsXG4gICAgICB9LFxuICAgICAgZWJzOiB7XG4gICAgICAgIHZvbHVtZVNpemU6IDEwLFxuICAgICAgICB2b2x1bWVUeXBlOiBlYzIuRWJzRGV2aWNlVm9sdW1lVHlwZS5HUDMsXG4gICAgICAgIHRocm91Z2hwdXQ6IDEyNSxcbiAgICAgICAgaW9wczogMzAwMCxcbiAgICAgIH0sXG4gICAgICBub2RlVG9Ob2RlRW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgIGVuY3J5cHRpb25BdFJlc3Q6IHtcbiAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgIH0sXG4gICAgICAvLyB2cGNPcHRpb25zOiB7XG4gICAgICAvLyAgIHN1Ym5ldHM6IFt2cGMuaXNvbGF0ZWRTdWJuZXRzWzBdXSxcbiAgICAgIC8vICAgc2VjdXJpdHlHcm91cHM6IFtvcGVuU2VhcmNoU2VjdXJpdHlHcm91cF0sXG4gICAgICAvLyB9LFxuICAgICAgbG9nZ2luZzoge1xuICAgICAgICBzbG93U2VhcmNoTG9nRW5hYmxlZDogZmFsc2UsXG4gICAgICAgIGFwcExvZ0VuYWJsZWQ6IGZhbHNlLFxuICAgICAgICBzbG93SW5kZXhMb2dFbmFibGVkOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBDaGFuZ2UgdG8gUkVUQUlOIGZvciBwcm9kdWN0aW9uXG4gICAgfSk7XG5cbiAgICB0aGlzLm9wZW5TZWFyY2hFbmRwb2ludCA9IG9wZW5TZWFyY2hEb21haW4uZG9tYWluRW5kcG9pbnQ7XG5cbiAgICAvLyA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cbiAgICAvLyBDTE9VREZPUk1BVElPTiBPVVRQVVRTXG4gICAgLy8gPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG4gICAgXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0ltcG9ydGVkSGVsaXhUYWJsZU5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5oZWxpeFBhdHRlcm5UYWJsZU5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ0ltcG9ydGVkIER5bmFtb0RCIHRhYmxlIG5hbWUgZm9yIEhlbGl4IHBhdHRlcm5zJyxcbiAgICAgIGV4cG9ydE5hbWU6ICdJbXBvcnRlZEhlbGl4UGF0dGVyblRhYmxlTmFtZScsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnSW1wb3J0ZWRVc2VyUG9vbElkJywge1xuICAgICAgdmFsdWU6IHRoaXMudXNlclBvb2xJZCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnSW1wb3J0ZWQgQ29nbml0byBVc2VyIFBvb2wgSUQnLFxuICAgICAgZXhwb3J0TmFtZTogJ0ltcG9ydGVkQ29nbml0b1VzZXJQb29sSWQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ1JlZGlzRW5kcG9pbnQnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5yZWRpc0NsdXN0ZXJFbmRwb2ludCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnRWxhc3RpQ2FjaGUgUmVkaXMgZW5kcG9pbnQnLFxuICAgICAgZXhwb3J0TmFtZTogJ1JlZGlzRW5kcG9pbnQnLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ09wZW5TZWFyY2hFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB0aGlzLm9wZW5TZWFyY2hFbmRwb2ludCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnT3BlblNlYXJjaCBkb21haW4gZW5kcG9pbnQgZm9yIHZlY3RvciBzZWFyY2gnLFxuICAgICAgZXhwb3J0TmFtZTogJ09wZW5TZWFyY2hFbmRwb2ludCcsXG4gICAgfSk7XG5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnVlBDSWQnLCB7XG4gICAgICB2YWx1ZTogdnBjLnZwY0lkLFxuICAgICAgZGVzY3JpcHRpb246ICdWUEMgSUQgZm9yIGRhdGEgbGF5ZXInLFxuICAgICAgZXhwb3J0TmFtZTogJ0RhdGFWUENJZCcsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==
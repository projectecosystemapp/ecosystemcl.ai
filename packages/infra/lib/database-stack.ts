import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as opensearch from 'aws-cdk-lib/aws-opensearchservice';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

/**
 * Database Stack for ECOSYSTEMCL.AI
 * 
 * Hybrid deployment strategy:
 * - IMPORTS existing DynamoDB tables and Cognito User Pool
 * - CREATES new ElastiCache and OpenSearch infrastructure
 * 
 * This approach preserves production data while transitioning to CDK management
 */
export class DatabaseStack extends cdk.Stack {
  public readonly helixPatternTableName: string = 'HelixPatternEntries';
  public readonly workspaceStateTableName: string = 'WorkspaceStates';
  public readonly agentProfileTableName: string = 'AgentProfiles';
  public readonly subscriptionTableName: string = 'Subscriptions';
  public readonly userPoolId: string;
  public readonly redisClusterEndpoint: string;
  public readonly openSearchEndpoint: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // =====================================================================
    // IMPORT EXISTING COGNITO USER POOL
    // =====================================================================
    
    /**
     * Import the existing Cognito User Pool to maintain user continuity
     * Pool ID obtained from existing infrastructure
     */
    this.userPoolId = process.env.COGNITO_USER_POOL_ID || 'us-west-2_F5eg8nTgU';
    
    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      'ImportedUserPool',
      this.userPoolId
    );

    // =====================================================================
    // IMPORT OR CREATE DYNAMODB TABLES
    // =====================================================================
    
    /**
     * Strategy: Check if tables exist, import if present, create if not
     * This allows the stack to work in both fresh and existing environments
     */

    // Helper function to import or create table
    const ensureTable = (
      scope: Construct,
      id: string,
      tableName: string,
      createFn: () => dynamodb.Table
    ): dynamodb.ITable => {
      // Attempt to import existing table
      // In production, we know these tables exist
      try {
        return dynamodb.Table.fromTableName(scope, `${id}Import`, tableName);
      } catch {
        // If import fails, create new table
        return createFn();
      }
    };

    // Import existing HelixPatternEntries table
    const helixPatternTable = dynamodb.Table.fromTableName(
      this,
      'HelixPatternTableImport',
      this.helixPatternTableName
    );

    // Import existing WorkspaceStates table
    const workspaceStateTable = dynamodb.Table.fromTableName(
      this,
      'WorkspaceStateTableImport',
      this.workspaceStateTableName
    );

    // Import existing AgentProfiles table
    const agentProfileTable = dynamodb.Table.fromTableName(
      this,
      'AgentProfileTableImport',
      this.agentProfileTableName
    );

    // Import existing Subscriptions table
    const subscriptionTable = dynamodb.Table.fromTableName(
      this,
      'SubscriptionTableImport',
      this.subscriptionTableName
    );

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
    redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

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
    openSearchSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(443),
      'Allow HTTPS access to OpenSearch from VPC'
    );

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

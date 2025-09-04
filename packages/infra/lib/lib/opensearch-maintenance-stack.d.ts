import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
interface OpenSearchMaintenanceStackProps extends cdk.StackProps {
    opensearchEndpoint: string;
    collectionArn: string;
}
export declare class OpenSearchMaintenanceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: OpenSearchMaintenanceStackProps);
}
export {};

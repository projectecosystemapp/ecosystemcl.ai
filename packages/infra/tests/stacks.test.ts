import { Template } from 'aws-cdk-lib/assertions';
import * as cdk from 'aws-cdk-lib';
import { OpenSearchStack } from '../lib/opensearch-stack';
import { OpenSearchMaintenanceStack } from '../lib/opensearch-maintenance-stack';

describe('Infrastructure Stacks', () => {
  test('OpenSearch Stack creates collection with correct configuration', () => {
    const app = new cdk.App();
    const stack = new OpenSearchStack(app, 'TestOpenSearchStack');
    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::OpenSearchServerless::Collection', {
      Name: 'helix-patterns',
      Type: 'VECTORSEARCH'
    });
    
    template.hasResourceProperties('AWS::OpenSearchServerless::SecurityPolicy', {
      Type: 'encryption'
    });
  });
  
  test('Maintenance Stack creates Lambda functions with correct runtime', () => {
    const app = new cdk.App();
    const stack = new OpenSearchMaintenanceStack(app, 'TestMaintenanceStack', {
      opensearchEndpoint: 'https://test.aoss.amazonaws.com',
      collectionArn: 'arn:aws:aoss:us-west-2:123456789012:collection/test'
    });
    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Architecture: 'arm64'
    });
  });
});
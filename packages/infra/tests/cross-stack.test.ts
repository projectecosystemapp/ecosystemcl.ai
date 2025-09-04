import { App, Stack } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ComputeStack } from '../lib/compute-stack';

describe('Cross-Stack Dependencies', () => {
  test('CDC Lambda has OPENSEARCH_ENDPOINT environment variable', () => {
    const app = new App();
    const parent = new Stack(app, 'Parent');
    const bucket = new s3.Bucket(parent, 'Artifacts');

    // Provide env var as done in bin app (via process.env)
    process.env.OPENSEARCH_ENDPOINT = 'https://aoss-example.us-west-2.aoss.amazonaws.com';

    const compute = new ComputeStack(parent, 'Compute', {
      artifactsBucket: bucket,
      patternTableName: 'HelixPatternEntries',
    });

    const template = Template.fromStack(compute);
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: Match.objectLike({
          OPENSEARCH_ENDPOINT: Match.anyValue(),
        }),
      },
    });
  });
});

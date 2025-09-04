#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { OpenSearchMaintenanceStack } from '../lib/opensearch-maintenance-stack';

const app = new cdk.App();

// Deploy maintenance stack with existing OpenSearch collection
new OpenSearchMaintenanceStack(app, 'EcosystemCL-OpenSearchMaintenanceStack', {
  opensearchEndpoint: 'https://zwrsnhyybevsl08y2pn3.us-west-2.aoss.amazonaws.com',
  collectionArn: 'arn:aws:aoss:us-west-2:219895243073:collection/zwrsnhyybevsl08y2pn3',
  env: {
    account: '219895243073',
    region: 'us-west-2',
  },
});
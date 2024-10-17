#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DusPipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();
new DusPipelineStack(app, 'DusPipelineStack', {
  env: { account: cdk.Aws.ACCOUNT_ID, region: cdk.Aws.REGION }
});

app.synth();
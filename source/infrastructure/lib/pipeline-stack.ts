import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { GitHubTrigger } from 'aws-cdk-lib/aws-codepipeline-actions';
import { DusPipelineAppStage } from './pipeline-app-stage';
import { Bucket } from 'aws-cdk-lib/aws-s3';

export class DusPipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    const pipeline = new CodePipeline(this, 'Pipeline', {
      pipelineName: 'FigJamPipeline',
      //artifactBucket: Bucket.fromBucketName(this, 'FigJamPipelineBucket', "cdk-hnb659fds-assets-010526252954-us-east-1"),
      synth: new ShellStep('Synth', {
        input: CodePipelineSource.gitHub('CMS-Enterprise/FIGJAM', 'main', {
          authentication: cdk.SecretValue.secretsManager("github-oauth-token"),
          trigger: GitHubTrigger.NONE
        }),
        commands: ['npm -v']
      }),
    });

    // pipeline.addStage(new DusPipelineAppStage(this, "DusAppStack", {
    //   env: { account: cdk.Aws.ACCOUNT_ID, region: cdk.Aws.REGION }
    // }));
    
  }
}
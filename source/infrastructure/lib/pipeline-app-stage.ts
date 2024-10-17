import * as cdk from 'aws-cdk-lib';
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from "constructs";
import { DusStack } from './dus-stack';
import { AwsSolutionsChecks } from 'cdk-nag/lib/packs/aws-solutions';
import { AppRegistry } from './utils/app-registry-aspects';
import { LambdaAspects } from './utils/lambda-aspect';
import { ApiGatewayEndpointTypeResourceObserver, CfnResourceObserver, CognitoUserPoolAdvancedSecurityModeObserver, LambdaRuntimeResourceObserver, S3WebResourceObserver } from './govcloud/cfn-resource-observer';
import { AwsDeploymentPartitionAspects } from './utils/aws-deployment-partition-aspects';

export class DusPipelineAppStage extends cdk.Stage {

    constructor(scope: Construct, id: string, props?: cdk.StageProps) {
        super(scope, id, props);

        const solutionID = process.env.SOLUTION_ID ?? this.node.tryGetContext('solution_id');
        const version = process.env.VERSION ?? this.node.tryGetContext('solution_version');
        const solutionName = process.env.SOLUTION_NAME ?? this.node.tryGetContext('solution_name');
        const namespace = process.env.APP_NAMESPACE ?? this.node.tryGetContext('app_namespace');
        const applicationType = this.node.tryGetContext('application_type');
        const applicationName = this.node.tryGetContext('app_registry_name');
        const applicationTrademarkName = this.node.tryGetContext('application_trademark_name');

        const dus = new DusStack(this, 'DocUnderstanding', {
            description: `(${solutionID}) - ${solutionName}. Version ${version}`,
            synthesizer: new cdk.DefaultStackSynthesizer({
                generateBootstrapVersionRule: false
            }),
            solutionID: solutionID,
            solutionVersion: version,
            solutionName: solutionName,
            appNamespace: namespace,
            applicationTrademarkName: applicationTrademarkName
        });

        // adding cdk-nag checks
        cdk.Aspects.of(this).add(new AwsSolutionsChecks());

        // adding app registry
        cdk.Aspects.of(this).add(
            new AppRegistry(dus, 'AppRegistry', {
                solutionID: solutionID,
                solutionVersion: version,
                solutionName: solutionName,
                applicationType: applicationType,
                applicationName: applicationName
            })
        );

        // adding lambda layer to all lambda functions for injecting user-agent for SDK calls to AWS services.
        cdk.Aspects.of(this).add(
            new LambdaAspects(dus, 'AspectInject', {
                solutionID: solutionID,
                solutionVersion: version
            })
        );

        const cfnObserverMap = new Map<string, CfnResourceObserver[]>();
        cfnObserverMap.set(lambda.Function.name, [new LambdaRuntimeResourceObserver()]);
        cfnObserverMap.set(cdk.CfnStack.name, [new S3WebResourceObserver()]);
        cfnObserverMap.set(api.CfnRestApi.name, [new ApiGatewayEndpointTypeResourceObserver()]);
        cfnObserverMap.set(cognito.CfnUserPool.name, [new CognitoUserPoolAdvancedSecurityModeObserver()]);

        cdk.Aspects.of(this).add(new AwsDeploymentPartitionAspects(cfnObserverMap));
    }
}
/* Sample code, software libraries, command line tools, proofs of concept, templates, 
or other related technology are provided as AWS Content or Third-Party Content under 
the AWS Customer Agreement, or the relevant written agreement between you and AWS (whichever applies). 
You should not use this AWS Content or Third-Party Content in your production accounts, 
or on production or other critical data. You are responsible for testing, securing, and 
optimizing the AWS Content or Third-Party Content, such as sample code, as appropriate for 
production grade use based on your specific quality control practices and standards. 
Deploying AWS Content or Third-Party Content may incur AWS charges for creating or 
using AWS chargeable resources, such as running Amazon EC2 instances or using Amazon S3 storage.*/

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT-0

import { Stack, StackProps, RemovalPolicy, Tags, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Runtime  } from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';
import { Effect, ManagedPolicy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogLevel, NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { NagSuppressions } from 'cdk-nag'
import { Key } from 'aws-cdk-lib/aws-kms';


export interface IStackProps extends StackProps{
  topic: sns.ITopic; 
  kmsKey: Key; 
  environment: string; 
  costcenter: string; 
  solutionName: string;  
}

export class AiThumbnailReviewer extends Construct {

  public  readonly detectThumbnailLambda: NodejsFunction

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)

    const DetectThumbnailFunctionRole = new Role(this, `DetectThumbnail-LambdaRole`, {
      roleName: `${props.solutionName}-detect-thumbnail-${props.environment}`,
      description: "Detect Thumbnail from image MediaLive via Rekognition",
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ],
      inlinePolicies: {
        LambdaInlinePolicy: new PolicyDocument({
          assignSids:true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [
                "arn:aws:logs:*:*:*"
              ],
              actions: [
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream"
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [`arn:aws:sns:${region}:${account}:${props.topic.topicName}`], 
              actions: [
                "sns:Publish"
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [
                "arn:aws:medialive:*:*:channel:*"
              ], 
              actions: [
                "medialive:DescribeThumbnails"
              ],
            }),
            new PolicyStatement({ 
              effect: Effect.ALLOW,
              resources: [
                `*`
              ], 
              actions: [
                "rekognition:DetectLabels"
              ],
            }),
            new PolicyStatement({ 
              effect: Effect.ALLOW,
              resources: [
                props.kmsKey.keyArn
              ], 
              actions: [
                "kms:GenerateDataKey",
                "kms:Decrypt"
              ],
            })         
          ],
        })

      }
    });

    NagSuppressions.addResourceSuppressions(
      DetectThumbnailFunctionRole,
      [
        {
          id: 'AwsSolutions-IAM4',
          reason: 'Needs access to write to CloudWatch Logs'
        },
        {
          id: 'AwsSolutions-IAM5',
          reason: `
          Solution demonstrates provisioning a specific lambda function access to:
          1) Describe the thumbnail previews of any MediaLIve channel 
          2) Performing image detection via the Amazon Rekognition DetectLabels action which does not need resource-level permissions
          https://docs.aws.amazon.com/service-authorization/latest/reference/list_amazonrekognition.html#amazonrekognition-actions-as-permissions
          `
        },
      ],
      true
    );


      const detectThumbnailLambda = new NodejsFunction(this, 'detector thumbnail lambda', {
        functionName: `${props.solutionName}-detect-thumbnail-${props.environment}`,
        runtime: Runtime.NODEJS_18_X,
        memorySize: 1024,
        timeout: Duration.minutes(3),
        handler: 'handler',
        role: DetectThumbnailFunctionRole, 
        entry: path.join(__dirname, '../lambda-functions/MediaLiveThumbnailDetector/index.ts' ),
        depsLockFilePath: path.join(__dirname, '../lambda-functions/MediaLiveThumbnailDetector/package-lock.json'),
        environment: {
          TopicArn: props.topic.topicArn,
          ENV: props.environment,
          aws_region: region, 
          NODE_OPTIONS: '--enable-source-maps',
        },
        layers: [],
        bundling: { 
          externalModules: ['aws-lambda'],
          nodeModules: ['aws-sdk'],
          target: 'es2020', 
          keepNames: true,
          logLevel: LogLevel.INFO,
          minify: true, // minify code, defaults to false
          sourceMap: true, // include source map, defaults to false
          sourceMapMode: SourceMapMode.INLINE, // defaults to SourceMapMode.DEFAULT
          sourcesContent: false, // do not include original source into source map, defaults to true
        },
      }); 
      
      detectThumbnailLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

      this.detectThumbnailLambda = detectThumbnailLambda


    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

  }
}
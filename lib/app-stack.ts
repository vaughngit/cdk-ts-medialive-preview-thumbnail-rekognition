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

import * as cdk from 'aws-cdk-lib';
import { CfnOutput, CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AiThumbnailReviewer} from './constructs/lambda-thumbnail-reviewer-construct'
import { SNSTopicConstruct } from './constructs/sns-topic-construct';
import { EventBridgeStack } from './constructs/eventbridge-scheduled-task-construct';
import {LambdaCreateScheduler} from './constructs/lambda-create-scheduler'
import { KmsKeyConstruct } from './constructs/kms-key-construct';

export interface IStackProps extends cdk.StackProps{
  environment: string; 
  costcenter: string; 
  solutionName: string; 
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id, props);

    //Note that the name (logical ID) of the parameter will derive from its name and location within the stack. 
    // Therefore, it is recommended that parameters are defined at the stack level.
    const snsEmail = new CfnParameter(this, 'snsEmail');
    const channelId = new CfnParameter(this, 'channelId');
    const pipelineId = new CfnParameter(this, 'pipelineId');

    const {kmsKey} = new KmsKeyConstruct(this, "kms key", props)
    const {topic} = new SNSTopicConstruct(this, "sns topic",{snsEmail, kmsKey, ...props })
    const {detectThumbnailLambda} = new AiThumbnailReviewer(this, "review medialive thumbnail lambda",{topic,kmsKey, ...props} )
    const {schedulerRole} = new EventBridgeStack(this, "Event Bridge Scheduler", {detectThumbnailLambda, topic, channelId, pipelineId,kmsKey, ...props})
    new LambdaCreateScheduler(this, "create scheduler lambda", {detectThumbnailLambda, schedulerRole, kmsKey, ...props})

    new CfnOutput(this, "SnsTopicName", {value: topic.topicName });  

  }
}

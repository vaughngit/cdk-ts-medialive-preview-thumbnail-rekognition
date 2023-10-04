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

import {StackProps, Tags, CfnParameter } from 'aws-cdk-lib';
import {Construct} from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';
import { Key } from 'aws-cdk-lib/aws-kms';


interface IStackProps extends StackProps {
  snsEmail: CfnParameter
  environment: string; 
  solutionName: string; 
  costcenter: string; 
};

export class SNSTopicConstruct extends Construct {

  public readonly topic: sns.ITopic; 
  public readonly kmsKey: Key; 

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const snsEncryptionKey = new Key(this, 'TopicKMSKey',{enableKeyRotation: true});

    const snsTopic = new sns.Topic(this, 'MedialiveThumbnailRekognitionTopic', {
        topicName: "MediaLiveThumbnailPreview",
        displayName: "Media Live Thumbnail Sports Event Detector",
        masterKey: snsEncryptionKey
      });

      
      snsTopic.addSubscription(new EmailSubscription(props.snsEmail.valueAsString));


      //For Info on how to send messages to Amazon Chime, Slack, or Microsoft Teams: 
      //https://repost.aws/knowledge-center/sns-lambda-webhooks-chime-slack-teams
      //snsTopic.addSubscription(new LambdaSubscription(myFunction));
  
      this.topic = snsTopic 
      this.kmsKey = snsEncryptionKey
   
     
    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

   // new CfnOutput(this, 'bucketArn', {value: storageBucket.bucketArn})

  }
}

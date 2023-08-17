import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { S3StorageConstruct } from './constructs/s3-storage-construct';
import {ThumbnailApiStack} from './constructs/lambda-thumbnail-api-construct'
import { SNSTopicConstruct } from './constructs/sns-topic-construct';
import { EventBridgeStack } from './constructs/eventbridge-scheduled-task-construct';
import { CfnOutput } from 'aws-cdk-lib';

export interface IStackProps extends cdk.StackProps{
  environment: string; 
  costcenter: string; 
  solutionName: string; 
}

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id, props);

    const { thumbnailBucket} = new S3StorageConstruct(this, "s3 storage", {...props})
    const {topic} = new SNSTopicConstruct(this, "sns topic", props)
    const {detectThumbnailLambda} = new ThumbnailApiStack(this, "create thumbnail lambda",{thumbnailBucket, topic, ...props} )
    new EventBridgeStack(this, "Event Bridge Scheduler", {detectThumbnailLambda, topic, ...props})

    new CfnOutput(this, "SnsTopicName", {value: topic.topicName });  

  }
}

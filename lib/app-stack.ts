import * as cdk from 'aws-cdk-lib';
import { CfnOutput, CfnParameter } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AiThumbnailReviewer} from './constructs/lambda-thumbnail-api-construct'
import { SNSTopicConstruct } from './constructs/sns-topic-construct';
import { EventBridgeStack } from './constructs/eventbridge-scheduled-task-construct';
import {LambdaInvokeScheduler} from './constructs/lambda-invoke-scheduler'

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

    const {topic, kmsKey} = new SNSTopicConstruct(this, "sns topic",{snsEmail, ...props })
    const {detectThumbnailLambda} = new AiThumbnailReviewer(this, "review medialive thumbnail lambda",{topic,kmsKey, ...props} )
    const {schedulerRole} = new EventBridgeStack(this, "Event Bridge Scheduler", {detectThumbnailLambda, topic, channelId, pipelineId, ...props})
    new LambdaInvokeScheduler(this, "create scheduler lambda", {detectThumbnailLambda, schedulerRole, ...props})


    new CfnOutput(this, "SnsTopicName", {value: topic.topicName });  

  }
}

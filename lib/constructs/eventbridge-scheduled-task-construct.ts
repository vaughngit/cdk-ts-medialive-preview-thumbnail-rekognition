import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CfnParameter, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface IStackProps extends StackProps{

    topic: ITopic; 
    detectThumbnailLambda: NodejsFunction
    channelId: CfnParameter
    pipelineId: CfnParameter
    environment: string; 
    costcenter: string; 
    solutionName: string; 
  }

//Consider Splitting this Construct into is own stack to support reuse. 
export class EventBridgeStack extends Construct {

  public readonly schedulerRole: Role

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)


    const schedulerRole = new Role(this, "schedulerRole", {
       assumedBy: new ServicePrincipal("scheduler.amazonaws.com"),
       inlinePolicies:  {
        schedulerPolicy: new PolicyDocument({
          assignSids:true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [props.detectThumbnailLambda.functionArn],
              actions: [
                "lambda:InvokeFunction"
              ],
            }),        
          ],
        })
    }
    })
  
    this.schedulerRole = schedulerRole

    
    // Create the payload for the scheduler to send to the thumbnail review lambda
    const channelInfoPayload = {
      "AWS_REGION": region,
      "ChannelId": props.channelId.valueAsString,
      "PipelineId": props.pipelineId.valueAsString,
      "ThumbnailType": "CURRENT_ACTIVE"
    };


    new cdk.CfnResource(this, "EventBridgeRateScheduler", {
        type: "AWS::Scheduler::Schedule",
        properties: {
         Name: "EventBridgeScheduler",
         Description: `Runs a lambda every 5 Minute`,
         FlexibleTimeWindow: { Mode: "OFF" },   
         ScheduleExpression: `rate(5 minutes)`, 
         ScheduleExpressionTimezone: "America/Chicago",
         Target: {
           Arn: props.detectThumbnailLambda.functionArn,
           RoleArn: schedulerRole.roleArn,
           Input: JSON.stringify(channelInfoPayload)
         },
       }
    })


    }
}

    
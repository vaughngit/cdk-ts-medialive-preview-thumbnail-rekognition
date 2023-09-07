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
    cronRate: string, 
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

    // Create the payload
    const channelInfoPayload = {
      "AWS_REGION": region,
      "ChannelId": props.channelId.valueAsString,
      "PipelineId": props.pipelineId.valueAsString,
      "ThumbnailType": "CURRENT_ACTIVE"
    };


    //crontab guru
    // https://crontab.guru/

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

    new cdk.CfnResource(this, "EventBridgeRateScheduler", {
        type: "AWS::Scheduler::Schedule",
        properties: {
         Name: "EventBridgeScheduler",
         Description: `Runs a lambda every ${props.cronRate} Minute`,
         FlexibleTimeWindow: { Mode: "OFF" },   
         ScheduleExpression: `rate(${props.cronRate} minutes)`,
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

    
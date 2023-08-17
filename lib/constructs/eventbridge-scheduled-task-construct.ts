import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { Duration, StackProps } from 'aws-cdk-lib';
import { Effect, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { ITopic } from 'aws-cdk-lib/aws-sns';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export interface IStackProps extends StackProps{

    topic: ITopic; 
    detectThumbnailLambda: NodejsFunction
    environment: string; 
    costcenter: string; 
    solutionName: string; 
  }


export class EventBridgeStack extends Construct {
  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);



    // Create the payload
    const channelInfoPayload = {
      "AWS_REGION": "us-west-2",
      "ChannelId": "1805609",
      "PipelineId": "0",
      "ThumbnailType": "CURRENT_ACTIVE"
    };


    //crontab guru
    // https://crontab.guru/


/* 
    // Runs every 5 minutes and targets the lambda function
    new events.Rule(this, 'EventRule', {
        ruleName: "EventBridgeRuleScheduler1",
        description: "EventBridge Rules Rate Schedule that runs every 5 minutes and targets the lambda function",
        schedule: Schedule.rate(Duration.minutes(5)),
        targets: [
            new targets.LambdaFunction(props.detectThumbnailLambda, {
            event: events.RuleTargetInput.fromObject(channelInfoPayload),
            })
        ]
    });

    //Runs a task every day at 4am:
    new Rule(this, 'ScheduleRule', {
        ruleName: "EventBridgeRuleScheduler2",
        description: "EventBridge Rules Cron schedule that runs a task every day at 4am", 
        schedule: Schedule.cron({ minute: '0', hour: '4' }),
        targets: [
            new targets.LambdaFunction(props.detectThumbnailLambda, {
                event: events.RuleTargetInput.fromObject(channelInfoPayload),
            })
        ],
    });

 */
    //Schedule types on EventBridge Scheduler
    // https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html

    //crontab guru
    // https://crontab.guru/

    //Cloudformation References: https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-scheduler-schedule.html


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

    // With EventBridge Rules, you cannot create singular triggers that fire at a specific time and are thrown away.
    //EventBridge Scheduler allows you to create two types of events: one-time schedules or recurring schedules.
    //Flexible Time Windows that allow you to create variance in when your message is delivered to the target. This allows you to stagger the invocation of your events so you don’t get bursty workloads all firing at the precise minute of a certain day
    // EventBridge Scheduler uses the Time Zone Database maintained by the Internet Assigned Numbers Authority (IANA). https://www.iana.org/time-zones
    new cdk.CfnResource(this, "EventBridgeCronScheduler", {
        type: "AWS::Scheduler::Schedule",
        properties: {
         Name: "EventBridgeScheduler1",
         Description: "Runs a lambda every weekday at 6 AM EST",
         FlexibleTimeWindow: { Mode: "OFF" },   
         ScheduleExpression: "cron(0 6 ? * MON-FRI *)",
         ScheduleExpressionTimezone: "America/New_York",
         Target: {
           Arn: props.detectThumbnailLambda.functionArn,
           RoleArn: schedulerRole.roleArn,
           Input: JSON.stringify(channelInfoPayload)
         },
       }
    })

    new cdk.CfnResource(this, "EventBridgeRateScheduler", {
        type: "AWS::Scheduler::Schedule",
        properties: {
         Name: "EventBridgeScheduler2",
         Description: "Runs a lambda every 1 Minute",
         StartDate: "2023-08-17T04:36:02.000Z", //UTC  yyyy-MM-ddTHH:mm:ss.SSSZ
         FlexibleTimeWindow: { Mode: "OFF" },   
         ScheduleExpression: 'rate(1 minutes)' ,
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

    
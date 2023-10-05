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

import { SchedulerClient, CreateScheduleCommand, DeleteScheduleCommand } from "@aws-sdk/client-scheduler";
import { Event } from './types';

const schedulerClient = new SchedulerClient({ region: process.env.region });
export const handler = async (event: Event) => {
    switch (event.action) {
      case "create":
        try {
          const cmd = new CreateScheduleCommand({
            Name: event.schedulerName,
            Description: `Run rekognition detection to analyze Media Live channel ${event.channelInfoPayload.ChannelId}`,
            StartDate: event.startDate ? new Date(event.startDate) : undefined, 
            EndDate : event.endDate ? new Date(event.endDate) : undefined, 
            ScheduleExpressionTimezone: "America/Chicago",
            FlexibleTimeWindow: {
                Mode: "OFF",
              },
            ActionAfterCompletion: "DELETE",
            ScheduleExpression: `cron(${event.cron})`,
            KmsKeyArn : process.env.kmsKeyArn,
            Target: {
              RoleArn: process.env.SCHEDULE_ROLE_ARN,
              Arn: process.env.LAMBDA_ARN,
              Input: JSON.stringify({ ...event.channelInfoPayload }),
            }, 
          });
          const result = await schedulerClient.send(cmd);
          return {
            statusCode: 200,
            body: JSON.stringify(result),
          };
        } catch (error) {
          console.log("failed", error);
          return {
            statusCode: 500,
            body: JSON.stringify(error),
          };
        }
      case "delete":
        try {
          await schedulerClient.send(new DeleteScheduleCommand({ Name: event.schedulerName }));
          return {
            statusCode: 200,
            body: `${event.schedulerName} Scheduler deleted`,
          };
        } catch (error) {
          console.log("error", error);
          return {
            statusCode: 500,
            body: JSON.stringify(error),
          };
        }
      default:
        return {
          statusCode: 400,
          body: "Invalid action",
        };
    }
  }
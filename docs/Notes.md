
## Types of EventBridge Scheduler: 
### Schedule types on EventBridge Scheduler(https://docs.aws.amazon.com/scheduler/latest/UserGuide/schedule-types.html)
- Rate-based schedules
- Cron-based schedules
- One-time schedules

### EventBridge Schedule CF Ref[AWS::Scheduler::Schedule](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-scheduler-schedule.html)

(Scheduler CloudFormation API)[https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-scheduler-schedule.html]
(Scheduler Javascript SDK)[https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/Package/-aws-sdk-client-scheduler/Interface/CreateScheduleCommandInput/]


- set envars
    > Change region and channelId to match target environment
    - Linux: ` set AWS_REGION=us-west-2 && set ChannelId=5204063 `
    - Windows: ` $Env:ChannelId=3284674 ; $Env:AWS_REGION="us-west-2"  `

<br>

- create scheduler that every 10 mins during business hours 
    - ` node .\docs\event_configs\config-every5MinBusinessHours.js  `
    
    -  `aws lambda invoke --function-name "MediaLiveStack-create-scheduler-dev" --cli-binary-format raw-in-base64-out --payload file://docs/events/RunEvery5minWeekdays.json docs/events/response.json --profile dev --region us-west-2 `
 
- create new scheduler: 
    - ` node .\docs\event_configs\config-every10minWeekdays.js  `

    - ` aws lambda invoke --function-name "MediaLiveStack-create-scheduler-dev" --cli-binary-format raw-in-base64-out --payload file://docs/events/RunEvery10MinWeekdays.json docs/response.json --profile dev --region us-west-2 `

- create new scheduler: `aws lambda invoke --function-name "MediaLiveStack-create-scheduler-dev" --cli-binary-format raw-in-base64-out --payload file://docs/event-weekdayAtHalfHourWithTimezone.json docs/events/response.json --profile dev --region us-west-2`

- create new scheduler: `aws lambda invoke --function-name "MediaLiveStack-create-scheduler-dev" --cli-binary-format raw-in-base64-out --payload file://docs/event-weekdayEvery10minStartEndDate.json docs/response.json --profile dev --region us-west-2`





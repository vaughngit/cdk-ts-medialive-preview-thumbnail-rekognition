# MediaLive Thumbnail Detection with Rekognition 


## Getting Started with the AWS CDK
- Prerequisites: 
    - Install [Node.js](https://nodejs.org/en/download): 
      > All supported languages, Python, Java, or C# use the same backend, which runs on Node.js. AWS recommends selecting a version in active long-term support. 

    - Install the AWS CDK Toolkit:  
      - `npm install -g aws-cdk`

    - [Bootstrap](https://docs.aws.amazon.com/cdk/v2/guide/bootstrapping.html) your AWS Account
      > You must run bootstrap your AWS account to deploy CDK solutions. This command has to be run at least once per AWS Account:

      - `cdk bootstrap `



## Deploy this Solution:  
  > Note: This solution assumes an active MediaLive Channel is running 

  - Deploy the solution to your AWS account
    > Update the snsEmail and channelId parameter values to reflect your environment: 
<br>
  
  ` cdk deploy --parameters snsEmail=myemail@example.com --parameters channelId=1234567  --parameters pipelineId=0 `
  > The specified email will receive a SNS Subscription Confirmation email upon successful deployment. Be sure to click the confirmation link in the email to receive notifications. 

  > For more information on parameters see AWS documentation for [CloudFormation Parameters](https://docs.aws.amazon.com/cdk/v2/guide/parameters.html#parameters_use) in CDK: 


## Deploy additional Schedulers:
  
- set Region and ChannelId values in environmental variables: 
    > Change region and channelId to match target environment
    - Linux: ` set AWS_REGION=us-west-2 && set ChannelId=5204063 `
    - Windows: ` $Env:ChannelId=3284674 ; $Env:AWS_REGION="us-west-2"  `

<br>

- create scheduler that runs every 5 mins during business hours 
    - ` node .\docs\event_configs\config-every5MinBusinessHours.js  `
    
    -  `aws lambda invoke --function-name "MediaLiveStack-create-scheduler-dev" --cli-binary-format raw-in-base64-out --payload file://docs/events/RunEvery5minWeekdays.json docs/events/response.json --profile dev --region us-west-2 `
 
- create scheduler that runs every 10 mins on week days : 
    - ` node .\docs\event_configs\config-every10minWeekdays.js  `

    - ` aws lambda invoke --function-name "MediaLiveStack-create-scheduler-dev" --cli-binary-format raw-in-base64-out --payload file://docs/events/RunEvery10MinWeekdays.json docs/response.json --profile dev --region us-west-2 `



## Manually Test Lambda Function
- Go to lambda console 
- select lambda associated with this project 
- create test event with the shape below 

```
{
  "AWS_REGION": "us-west-2",
  "ChannelId": "1805609",   
  "PipelineId": "0",
  "ThumbnailType": "CURRENT_ACTIVE"
}
```



## Other Useful commands

- The `cdk.json` file tells the CDK Toolkit how to execute your app.

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
# MediaLive Thumbnail Detection with Rekognition 


## Deploy this Solution:  
-  Note: This solution assumes an active MediaLive Channel is running 

`cdk deploy --parameters snsEmail=myemail@example.com --parameters channelId=1805609  --parameters pipelineId=0`

- Note: By default, the AWS CDK retains values of parameters from previous deployments and uses them in subsequent deployments if they are not specified explicitly. Use the --no-previous-parameters flag to require all parameters to be specified.

- Note: AWS documentation for CloudFormation Parameters in CDK: https://docs.aws.amazon.com/cdk/v2/guide/parameters.html#parameters_use 

## Manually Test Lambda Function
### Go to lambda console, select lambda associated with this project, create test event with the shape below 

```
{
  "AWS_REGION": "us-west-2",
  "ChannelId": "1805609",   
  "PipelineId": "0",
  "ThumbnailType": "CURRENT_ACTIVE"
}
```


The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Other Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template
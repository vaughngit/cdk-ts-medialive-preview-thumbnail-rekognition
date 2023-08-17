import { Stack, StackProps, Tags, CfnOutput, Duration, CustomResource, RemovalPolicy, CfnParameter } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';
import { EmailSubscription, LambdaSubscription, UrlSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';


interface IStackProps extends StackProps {
  snsEmail: CfnParameter
  environment: string; 
  solutionName: string; 
  costcenter: string; 
};

export class SNSTopicConstruct extends Construct {

  public readonly topic: sns.ITopic; 


  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)


    const snsTopic = new sns.Topic(this, 'CdkTsMedialiveThumbnailRekognitionTopic', {
        topicName: "MediaLiveThumbnailPreview",
        displayName: "Media Live Thumbnail Sports Event Detector"
      });

      
      snsTopic.addSubscription(new EmailSubscription(props.snsEmail.valueAsString));


      //For Info on how to send messages to Amazon Chime, Slack, or Microsoft Teams: 
      //https://repost.aws/knowledge-center/sns-lambda-webhooks-chime-slack-teams
      //snsTopic.addSubscription(new LambdaSubscription(myFunction));
  
      this.topic = snsTopic 

   
     
    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

   // new CfnOutput(this, 'bucketArn', {value: storageBucket.bucketArn})

  }
}

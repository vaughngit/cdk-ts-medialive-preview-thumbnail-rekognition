import { Stack, StackProps, Tags, CfnOutput, Duration, CustomResource, RemovalPolicy } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import {Construct} from 'constructs';
import * as sns from 'aws-cdk-lib/aws-sns';


interface IStackProps extends StackProps {
  environment: string; 
  solutionName: string; 
  costcenter: string; 
};

export class SNSTopicConstruct extends Construct {

  public readonly topic: sns.ITopic; 


  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)


    const topic = new sns.Topic(this, 'CdkTsMedialiveThumbnailRekognitionTopic', {
        topicName: "MediaLiveThumbnailPreview",
        displayName: "Media Live Thumbnail Sports Event Detector"
      });
  
      this.topic = topic 

   
     
    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

   // new CfnOutput(this, 'bucketArn', {value: storageBucket.bucketArn})

  }
}

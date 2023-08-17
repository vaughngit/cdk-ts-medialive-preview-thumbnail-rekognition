import { Stack, StackProps, CfnOutput, RemovalPolicy, Tags, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime, Function, Code, LayerVersion, IFunction,  } from 'aws-cdk-lib/aws-lambda';
import { ITable} from 'aws-cdk-lib/aws-dynamodb';
//import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { Effect, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogLevel, NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';
import { EventType, IBucket } from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';



export interface IStackProps extends StackProps{
 // thumbnailBucket: IBucket; 
  topic: sns.ITopic; 
  environment: string; 
  costcenter: string; 
  solutionName: string; 
}

export class ThumbnailApiStack extends Construct {

  public  readonly detectThumbnailLambda: NodejsFunction

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)

    const DetectThumbnailFunctionRole = new Role(this, `DetectThumbnail-LambdaRole`, {
      roleName: `${props.solutionName}-detect-thumbnail-${props.environment}`,
      description: "Detect Thumbnail from image MediaLive via Rekognition",
      assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("service-role/AWSLambdaBasicExecutionRole")
      ],
      inlinePolicies: {
        LambdaInlinePolicy: new PolicyDocument({
          assignSids:true,
          statements: [
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [
                "arn:aws:logs:*:*:*"
              ],
              actions: [
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream"
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: ["*"], // replace with appropriate resources
              actions: [
                "medialive:describeThumbnails"
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [`arn:aws:sns:${region}:${account}:${props.topic.topicName}`], 
              actions: [
                "sns:Publish"
              ],
            }),
            new PolicyStatement({ 
              effect: Effect.ALLOW,
              resources: ["*"], 
              actions: [
                "rekognition:DetectLabels"
              ],
            })        
          ],
        })

      }
    });


      const detectThumbnailLambda = new NodejsFunction(this, 'detector thumbnail lambda', {
        functionName: `${props.solutionName}-detect-thumbnail-${props.environment}`,
        runtime: Runtime.NODEJS_14_X,
        memorySize: 1024,
        timeout: Duration.minutes(3),
        handler: 'handler',
        role: DetectThumbnailFunctionRole, 
        entry: path.join(__dirname, '../lambda-functions/MediaLiveThumbnailDetector/index.ts' ),
        depsLockFilePath: path.join(__dirname, '../lambda-functions/MediaLiveThumbnailDetector/package-lock.json'),
        environment: {
          TopicArn: props.topic.topicArn,
          ENV: props.environment,
          aws_region: region, 
          NODE_OPTIONS: '--enable-source-maps',
        },
        layers: [],
        bundling: { 
          externalModules: ['aws-lambda'],
          nodeModules: ['aws-sdk'],
          target: 'es2020', 
          keepNames: true,
          logLevel: LogLevel.INFO,
          minify: true, // minify code, defaults to false
          sourceMap: true, // include source map, defaults to false
          sourceMapMode: SourceMapMode.INLINE, // defaults to SourceMapMode.DEFAULT
          sourcesContent: false, // do not include original source into source map, defaults to true
        },
      }); 
      
      detectThumbnailLambda.applyRemovalPolicy(RemovalPolicy.DESTROY);

      this.detectThumbnailLambda = detectThumbnailLambda


    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

  }
}
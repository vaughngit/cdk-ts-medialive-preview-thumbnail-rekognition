import { Stack, StackProps, CfnOutput, RemovalPolicy, Tags, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Runtime, Function, Code, LayerVersion, IFunction,  } from 'aws-cdk-lib/aws-lambda';
import { ITable} from 'aws-cdk-lib/aws-dynamodb';
//import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as path from 'path';
import { Effect, ManagedPolicy, Policy, PolicyDocument, PolicyStatement, Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { LogLevel, NodejsFunction, SourceMapMode } from 'aws-cdk-lib/aws-lambda-nodejs';




export interface IStackProps extends StackProps{
  schedulerRole: Role
  detectThumbnailLambda: NodejsFunction
  environment: string; 
  costcenter: string; 
  solutionName: string; 
}

export class LambdaInvokeScheduler extends Construct {

  public  readonly CreateSchedulerLambda: NodejsFunction

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const { region, account }  = Stack.of(this)

    const CreateEventSchedulerFunctionRole = new Role(this, `EventScheduler-LambdaRole`, {
      roleName: `${props.solutionName}-event-scheduler-role-${props.environment}`,
      description: "Creates Event Schedulers for MediaLive Channel Reviews",
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
                `arn:aws:scheduler:${region}:${account}:schedule/*`
              ],
              actions: [
                "scheduler:CreateSchedule",
                "scheduler:DeleteSchedule"
              ],
            }),
            new PolicyStatement({
              effect: Effect.ALLOW,
              resources: [
                props.schedulerRole.roleArn
              ],
              actions: [
                "iam:PassRole"
              ],
            }),
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
      
          ],
        })

      }
    });


      const CreateEventSchedulerFunction = new NodejsFunction(this, 'create scheduler lambda', {
        functionName: `${props.solutionName}-scheduler-${props.environment}`,
        runtime: Runtime.NODEJS_14_X,
        memorySize: 1024,
        timeout: Duration.minutes(3),
        handler: 'handler',
        role: CreateEventSchedulerFunctionRole, 
        entry: path.join(__dirname, '../lambda-functions/eventbridge_scheduler/index.ts' ),
        depsLockFilePath: path.join(__dirname, '../lambda-functions/eventbridge_scheduler/package-lock.json'),
        environment: {
          SCHEDULE_ROLE_ARN: props.schedulerRole.roleArn,
          LAMBDA_ARN: props.detectThumbnailLambda.functionArn,
          ENV: props.environment,
          aws_region: region, 
          NODE_OPTIONS: '--enable-source-maps',
        },
        layers: [],
        bundling: { 
          externalModules: ['aws-lambda'],
          nodeModules: ['aws-sdk', "@aws-sdk/client-scheduler"],
          target: 'es2020', 
          keepNames: true,
          logLevel: LogLevel.INFO,
          minify: true, // minify code, defaults to false
          sourceMap: true, // include source map, defaults to false
          sourceMapMode: SourceMapMode.INLINE, // defaults to SourceMapMode.DEFAULT
          sourcesContent: false, // do not include original source into source map, defaults to true
        },
      }); 
      
      CreateEventSchedulerFunction.applyRemovalPolicy(RemovalPolicy.DESTROY);

      //this.detectThumbnailLambda = detectThumbnailLambda


    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

  }
}
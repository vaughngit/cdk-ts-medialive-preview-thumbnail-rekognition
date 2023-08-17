#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import {config} from '../config'; 

const app = new cdk.App();

//User account details from AWS CLI credentials: 
const account = process.env.CDK_DEFAULT_ACCOUNT;
//const region = process.env.CDK_DEFAULT_REGION
const region = 'us-west-2'
const env = {account, region}; 

new AppStack(app, 'thumbnailMonitor', {
  stackName: `${config.solutionName}-${config.environment}`,
  env,
  ...config
});
#!/usr/bin/env node
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

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import {config} from '../config'; 
import { AwsSolutionsChecks } from 'cdk-nag' 
import { Aspects } from 'aws-cdk-lib'; 

const app = new cdk.App();

// Add the cdk-nag AwsSolutions Pack with extra verbose logging enabled.
Aspects.of(app).add(new AwsSolutionsChecks({ verbose: true }))

//User account details from AWS CLI credentials: 
const account = process.env.CDK_DEFAULT_ACCOUNT;
const region = process.env.CDK_DEFAULT_REGION
//const region = 'us-west-2' // static region configuration to target region different from default region configured in cli profile
const env = {account, region}; 

new AppStack(app, 'AiThumbnailMonitor', {
  stackName: `${config.solutionName}-${config.environment}`,
  env,
  ...config
});
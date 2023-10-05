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

import {StackProps, Tags } from 'aws-cdk-lib';
import {Construct} from 'constructs';
import { Key } from 'aws-cdk-lib/aws-kms';


interface IStackProps extends StackProps {
  environment: string; 
  solutionName: string; 
  costcenter: string; 
};

export class KmsKeyConstruct extends Construct {

  public readonly kmsKey: Key; 

  constructor(scope: Construct, id: string, props: IStackProps) {
    super(scope, id);

    const snsEncryptionKey = new Key(this, 'TopicKMSKey',{enableKeyRotation: true});

    this.kmsKey = snsEncryptionKey
   
     
    Tags.of(this).add("environment", props.environment)
    Tags.of(this).add("solution", props.solutionName)
    Tags.of(this).add("costcenter", props.costcenter)

   // new CfnOutput(this, 'bucketArn', {value: storageBucket.bucketArn})

  }
}

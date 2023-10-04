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

const fs = require("fs");
const path = require("path");

var AWS_REGION = process.env.AWS_REGION || "us-west-2";
var ChannelId = process.env.ChannelId 
if (!ChannelId) {
  throw new Error("CHANNEL_ID environment variable is not set.");
}

var schedulerName = "EveryHourFrom9To5CSTWeekdays"
var cron = "0 9-17 ? * MON-FRI *"
var timeZone = "America/Chicago"

// Define the output directory and filename
var outputDir = "../event_objects/";

// Resolve the output directory to the script's root directory
outputDir = path.resolve(__dirname, outputDir);

// Ensure the directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}


['create', 'delete'].forEach(action => {
  var data = {
    action,
    schedulerName: schedulerName ,
    cron,
    timeZone, 
    channelInfoPayload: {
      AWS_REGION: AWS_REGION,
      ChannelId,
      PipelineId: "0",
      ThumbnailType: "CURRENT_ACTIVE"
    }
  };

  // Define the output file, prefixing with the action
  var outputFile = `${action}_${schedulerName}.json`;



  // Write data to JSON files
  fs.writeFile(path.join(outputDir, outputFile), JSON.stringify(data, null, 2), function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log(`Output saved to ${outputDir}/${outputFile}.`);
    }
  });
})
import { Handler, Context, Callback } from 'aws-lambda';
import AWS from 'aws-sdk';

let TopicArn: string;

// Initialize AWS services
const sns = new AWS.SNS();
const medialive = new AWS.MediaLive();
const rekognition = new AWS.Rekognition();

// Function to send message through SNS
async function sendSnsMessage(channelId: string, message: string) {
  const params = {
    Message: `${message}\nChannel ID: ${channelId}`,
    TopicArn
  };
  try {
    await sns.publish(params).promise();
    console.log(`Message sent: ${params.Message}`);
  } catch (error) {
    console.log(`Error sending message: ${error}`);
  }
}

// Function to detect sporting events using rekognition
async function detectSportEvent(imageBuffer: Buffer, channelId: string) {
  try {
    const params = {
      Image: {
        Bytes: imageBuffer
      },
      MaxLabels: 10,
      MinConfidence: 70
    };
    const response = await rekognition.detectLabels(params).promise();
    const labels = response.Labels;

    if (labels) {
      let sportsFound = false;
      for (let i = 0; i < labels.length; i++) {
        if (labels[i].Name === 'Sport') {
          sportsFound = true;
          break;
        }
      }
      if (sportsFound) {
        console.log("Sporting Event Streaming Detected");
        await sendSnsMessage(channelId, "Sporting Event Streaming Detected"); // Send SNS message
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                channelId,
                Message: "Sporting Event Streaming Detected"
            }),
        };
        return response

      } else {
        console.log('No sporting events detected. Detected labels are: ', labels.map((label: any) => label.Name).join(', '));
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                channelId,
                Message: 'No sporting events detected. Detected labels are: ',
                Labels: labels.map((label: any) => label.Name).join(', ')
            }),
        };
        return response
      }
    }
  } catch (error) {
    console.log('Error occurred while detecting labels', error);
  }
}

// AWS Lambda handler function
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {

   // console.log("event: ", event)
   // console.log("context: ", context)
  const { AWS_REGION, ChannelId, PipelineId, ThumbnailType } = event;
  TopicArn = event.TopicArn;

  AWS.config.update({ region: AWS_REGION });
  
  const params = {
    ChannelId,
    PipelineId,
    ThumbnailType
  };

  medialive.describeThumbnails(params, async (err: any, data: any) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      const thumbnailBody = data.ThumbnailDetails[0].Thumbnails[0].Body;

      // Decode the base64 string
      const decodedImage = Buffer.from(thumbnailBody, 'base64');

      // Detect sport events using rekognition
     const response = await detectSportEvent(decodedImage, ChannelId);

     return response 
    }
  });
};
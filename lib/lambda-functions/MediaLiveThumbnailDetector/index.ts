import { Handler, Context, Callback } from 'aws-lambda';
import AWS from 'aws-sdk';



const TopicArn = process.env.TopicArn;

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
    return `Message sent: ${params.Message}`; // Add this line
  } catch (error) {
    console.log(`Error sending message: ${error}`);
    throw error;
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
    // Debugging: 
   // console.log(response)

    const labels = response.Labels;

    if (labels) {
      let sportsFound = false;
      let sportsFoundConfidence: number
      for (let i = 0; i < labels.length; i++) {
        if (labels[i].Name === 'Sport' && labels[i].Confidence > 50) {
          sportsFound = true;
          sportsFoundConfidence = labels[i].Confidence
          break;
        }
      }
      if (sportsFound) {
        console.log("Sporting Event Streaming Detected");
        const snsResponse = await sendSnsMessage(channelId, `Sporting event streaming detected with a ${sportsFoundConfidence!} confidence level.`); 
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                channelId,
                Message: snsResponse, 
            }),
        };
        return response

      } else {
        console.log('No sporting events detected. Detected labels are: ', labels.map((label: any) => `${label.Name}: ConfidenceLevel=${label.Confidence}`).join(', '));
        const response = {
            statusCode: 200,
            body: JSON.stringify({
                channelId,
                Message: 'No sporting events detected. Detected labels are: ',
                Labels: labels.map((label: any) => `${label.Name}: ConfidenceLevel=${label.Confidence}`).join(', ')
            }),
        };
        return response
      }
    }
  } catch (error) {
    console.log('Error occurred while detecting labels', error);
  }
}

// Function to make the MediaLive API call to describe thumbnails
async function describeThumbnails(params: any) {
  return new Promise((resolve, reject) => {
    medialive.describeThumbnails(params, (err: any, data: any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// AWS Lambda handler function
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
  const { AWS_REGION, ChannelId, PipelineId, ThumbnailType } = event;
 
  AWS.config.update({ region: AWS_REGION });

  const params = {
    ChannelId,
    PipelineId,
    ThumbnailType
  };

  try {
    const data: any = await describeThumbnails(params);
    const thumbnailBody = data.ThumbnailDetails[0].Thumbnails[0].Body;

    // Decode the base64 string
    const decodedImage = Buffer.from(thumbnailBody, 'base64');

    // Detect sport events using rekognition
    const response = await detectSportEvent(decodedImage, ChannelId);

    callback(null, response);
  } catch (error) {
    console.log('Error occurred while describing thumbnails', error);
    callback(error);
  }
};
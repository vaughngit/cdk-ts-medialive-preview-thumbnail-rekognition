import { Handler, Context, Callback } from 'aws-lambda';
import AWS from 'aws-sdk';



const TopicArn = process.env.TopicArn;

// Initialize AWS services
const sns = new AWS.SNS();
const medialive = new AWS.MediaLive();
const rekognition = new AWS.Rekognition();


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
        if (labels[i].Name === 'Sport') {
          sportsFound = true;
          sportsFoundConfidence = labels[i].Confidence

          let response = {
            statusCode: 200,
            channelId,
            Message: `Sporting event streaming detected with a ${sportsFoundConfidence!} confidence level.`,
            sportsFound,
            sportsFoundConfidence,
            Labels:[] 
          }
          return response 
        }
      }

      //No Sports Events Detected: 
      let response = {
        statusCode: 200,
        sportsFound,
        sportsFoundConfidence: null,
        channelId,
        Message: 'No sporting events detected. Detected labels are: ',
        Labels: labels.map((label: any) => `${label.Name}: ConfidenceLevel=${label.Confidence}`).join(', '),
      };
     return response
  } 

  } catch (error) {
    console.log('Error occurred while detecting labels', error);
  }
}


// AWS Lambda handler function
export const handler: Handler = async (event: any, context: Context, callback: Callback) => {
 
 
 // Parameterized properties of the event object: 
  const { AWS_REGION, ChannelId, PipelineId, ThumbnailType } = event;
  AWS.config.update({ region: AWS_REGION });

  //Create the parameter object for the MediaLive API call
  const params = {
    ChannelId,
    PipelineId,
    ThumbnailType
  };

  try {
    // Call MediaLive describeThumbnails() api to retreive the latest thumbnail 
    const data: any = await describeThumbnails(params);
    const thumbnailBody = data.ThumbnailDetails[0].Thumbnails[0].Body;

    //Use the built-in Buffer class to decode the binary data into an image
    const decodedImage = Buffer.from(thumbnailBody, 'base64');

    // Detect sport events using rekognition
    let response: any = await detectSportEvent(decodedImage, ChannelId);

    // If Sports Events are detected with high confidence send notification: 
    if(response && response.sportsFound ===true){
      if(response.sportsFoundConfidence > 50){
        const snsResponse = await sendSnsMessage(response.channelId, `Sporting event streaming detected with a ${response.sportsFoundConfidence!} confidence level.`); 
        response.snsResponse = snsResponse
       callback(null, JSON.stringify(response));


      // If Sports events are detected with low confidence log it out
      }else{
        console.log(`Sporting Event Streaming Detected but with low confidence below 50%: ${response.sportsFoundConfidence}`);
        callback(null, JSON.stringify(response));
      };
      
     // If sports events are not detected log out what is:  
    } else {
      console.log('No sporting events detected. Detected labels are: ', response.Labels.map((label: any) => `${label.Name}: ConfidenceLevel=${label.Confidence}`).join(', '));
      callback(null, JSON.stringify(response));
    }



    
  } catch (error) {
    console.log('Error occurred while describing thumbnails', error);
    callback(error);
  }
};
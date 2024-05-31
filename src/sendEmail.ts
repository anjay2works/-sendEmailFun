import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import  fs, { PathOrFileDescriptor } from 'fs';
import path  from 'path';
const sesClient = new SESClient({ region: 'ap-south-1' });


const readHtmlTemplate = (filePath:PathOrFileDescriptor) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf8', (err:any, data:any) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const replaceTemplateData = (template:any, data:any) => {
  let result = template;
  for (const key in data) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
  }
  return result;
};

export const handler = async (event: any)  => {
    console.log("-event--",event); 
    const payload = JSON.parse(event.body); 
  const { 
    templateName, 
    subject, 
    email
  } = payload

 
  try {
    const templatePath = path.join(__dirname, `emailTemplates/${templateName}.html`);
    const htmlTemplate = await readHtmlTemplate(templatePath);

    const htmlContent = replaceTemplateData(htmlTemplate, {
      ...payload
    });    

    const emailParams = {
      Destination: {
        ToAddresses: [email],
        CcAddresses: [],
        BccAddresses: []
      },
      Message: {
        Body: {
          Html: {
            Data: htmlContent,
            Charset: 'UTF-8'
          }
        },
        Subject: {
          Data: subject,
          Charset: 'UTF-8'
        }
      },
      Source: 'anjay.shukla@2works.io'
    };

    await sesClient.send(new SendEmailCommand(emailParams));
    const response = {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Mail sent successfully'
      }),
    };
    return response;
  } catch (error:any) {
    const response = {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Failed to send email',
        error: error.message
      }),
    };
    return response;
  }
};

import AWS from 'aws-sdk';
import  fs, { PathOrFileDescriptor } from 'fs';
import path  from 'path';
const ses = new AWS.SES({ region: 'ap-south-1' });

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
    console.log("-event--",event.body);

   
    
    
  const { 
    templateName, 
    name, 
    email, 
    code, 
    subject, 
    ccEmailAddresses = [], 
    bccEmailAddresses = [] 
  } = JSON.parse(event.body);

 
  try {
    const templatePath = path.join(__dirname, `emailTemplates/${templateName}.html`);
    const htmlTemplate = await readHtmlTemplate(templatePath);

    const htmlContent = replaceTemplateData(htmlTemplate, {
      name,
      code
    });

    const emailParams = {
      Destination: {
        ToAddresses: [email],
        CcAddresses: ccEmailAddresses,
        BccAddresses: bccEmailAddresses
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
      Source: 'help.webiwork@gmail.com'
    };

    await ses.sendEmail(emailParams).promise();

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

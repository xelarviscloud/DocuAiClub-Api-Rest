import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const msg = {
  to: "ghori_hitesh@yahoo.com", // Change to your recipient
  from: "xelarviscloud@gmail.com", // Change to your verified sender
  subject: "Sending with SendGrid is Fun",
  text: "and easy to do anywhere, even with Node.js",
  html: "<strong>and easy to do anywhere, even with Node.js</strong>",
};

export function testEmail() {
  console.log("test email");
  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
}

export function sendEmail(to, subject, body, fileName, fileBuffer) {
  let attachment;
  if (fileBuffer) {
    attachment = {
      content: fileBuffer.toString("base64"),
      filename: fileName,
      type: "application/pdf",
      disposition: "attachment",
    };
  }

  const messageToSend = {
    to: to,
    from: "xelarviscloud@gmail.com",
    subject: subject,
    text: body,
    //html: `<strong>${body}</strong>`,
    attachments: [attachment],
  };

  return sgMail.send(messageToSend);
}

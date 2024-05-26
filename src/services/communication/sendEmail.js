import sgMail from "@sendgrid/mail";

function sendEmail(fileBuffer, fileName, emailAddress) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const attachment = {
    content: fileBuffer.toString('base64'),
    filename: fileName,
    type: 'application/pdf',
    disposition: 'attachment'
  };

  const msg = {
    to: emailAddress, // Change to your recipient
    from: "xelarviscloud@gmail.com", // Change to your verified sender
    subject: "Requested File",
    text: "Please find attached file.",
    // html: "<strong>Please find attached file</strong>",
    attachments: [attachment]
  };

  sgMail
    .send(msg)
    .then(() => {
      console.log("Email sent");
    })
    .catch((error) => {
      console.error(error);
    });
}

export default sendEmail;

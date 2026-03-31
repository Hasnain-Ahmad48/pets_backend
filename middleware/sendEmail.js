const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

const mailerSend = new MailerSend({
  apiKey: "mlsn.cdc66d07447ad3560d124b2b38524028825993b681c7e48ca32c22e7a297a469",
});

const sendEmail = async (to, subject, htmlContent, textContent) => {
  // Check if 'to' is provided and is a valid email
  if (!to || !/\S+@\S+\.\S+/.test(to)) {
    throw new Error("Invalid or missing recipient email address");
  }

  const sentFrom = new Sender("MS_DnNWcc@trial-pxkjn413xm9gz781.mlsender.net", "Wow Pets Palace ");

  const recipients = [
    new Recipient(to)
  ];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setSubject(subject)
    .setHtml(htmlContent)
    .setText(textContent);

  try {
    const response = await mailerSend.email.send(emailParams);
    console.log("Email sent successfully", response);
    return response;
  } catch (error) {
    console.error("Error sending email:", error.response ? error.response.body : error);
    throw error; // Re-throw the error so it can be caught in the controller
  }
};

module.exports = sendEmail;






// const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

// const mailerSend = new MailerSend({
//   apiKey: "mlsn.cdc66d07447ad3560d124b2b38524028825993b681c7e48ca32c22e7a297a469",
// });

// const sendEmail = async (to, subject, htmlContent, textContent) => {
//   const sentFrom = new Sender("MS_DnNWcc@trial-pxkjn413xm9gz781.mlsender.net", "RegexByte");

//   const recipients = [
//     new Recipient(to)
//   ];

//   const emailParams = new EmailParams()
//     .setFrom(sentFrom)
//     .setTo(recipients)
//     .setSubject(subject)
//     .setHtml(htmlContent)
//     .setText(textContent);

//   try {
//     await mailerSend.email.send(emailParams);
//     console.log("Email sent successfully");
//   } catch (error) {
//     console.error("Error sending email:", error);
//     throw error; // Re-throw the error so it can be caught in the controller
//   }
// };

// module.exports = sendEmail;

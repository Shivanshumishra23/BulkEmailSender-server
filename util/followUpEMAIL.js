const nodemailer = require("nodemailer");

let sent = 0;
let failed = 0;
const emailModel = require("../model/email.model");
const office365SMTPPasswordList = require("../config/emailConfigSMTP");

const saveDataToDb = async (data, status) => {
  const { email, role, name, userId, templateId } = data;

  if (!status) {
    await emailModel.create({
      userId: userId,
      roles: role,
      email: email,
      name: name,
      isEmailSend: false,
      templateId: templateId,
      failedCount: failed++,
      text: "email not sent",
    });
  } else {
    await emailModel.create({
      userId: userId,
      roles: role,
      email: email,
      name: name,
      isEmailSend: true,
      templateId: templateId,
      sentCount: sent++,
      text: "email sent",
    });
  }
};

const sendMailToEmail = async (data) => {
  const userEmail = data?.userEmail;
  const html = data?.content;
  const email = data?.email;
  const subject = data?.subject;
  const file = data?.file;

  // Microsoft Office 365 - SMTP Server
  const transporterOffice = nodemailer.createTransport({
    service: "Outlook365",
    host: "smtp.office365.com",
    port: 587,
    auth: {
      user: userEmail,
      pass: office365SMTPPasswordList.get(userEmail),
    },
    secureConnection: false,
    requireTLS: true,
    debug: true,
    tls: {
      ciphers: "SSLv3",
      rejectUnauthorized: true,
    },
  });

  // Template content
  const mailOptions = {
    from: userEmail,
    to: email,
    subject: subject,
    html: html,
    attachments: file?.map((singleFile) => ({
      filename: singleFile?.name,
      path: singleFile?.file,
    })),
  };

  await transporterOffice.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.log(error);
      await saveDataToDb(data, false);
    } else {
      console.log("sent message", info);
      await saveDataToDb(data, true);
    }
  });
};

module.exports = sendMailToEmail;

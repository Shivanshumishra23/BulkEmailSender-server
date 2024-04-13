const nodemailer = require("nodemailer");

const emailModel = require("../model/email.model");
const office365SMTPPasswordList = require("../config/emailConfigSMTP");
const htmlTemplate = require("./signature");
const newSignature = require("./signature");

const saveEmail = async (
  email,
  role,
  name,
  userId,
  templateId,
  emailType,
  text,
  status,
  messageId
) => {
  const saveEmail = await emailModel.create({
    userId: userId,
    roles: role,
    email: email,
    name: name,
    emailType: emailType,
    isEmailSend: status,
    text: text,
    messageId: messageId,
  });

  if (emailType === "firstEmail") {
    saveEmail.templateId = templateId;
  } else {
    saveEmail.followUpTemplateId = templateId;
  }
  // const emailAlreadyExist = await emailModel.findOne({
  //   userId: userId,
  //   email: email,
  // });

  // if (!emailAlreadyExist?.messageId || emailType === "firstEmail") {
  //   saveEmail.messageId = messageId;
  // }

  await saveEmail.save();
};

const saveDataToDb = async (data, messageId = "", status) => {
  const { email, role, name, userId, templateId, emailType } = data;
  if (!status) {
    await saveEmail(
      email,
      role,
      name,
      userId,
      templateId,
      emailType,
      "email not sent",
      false,
      messageId
    );
  } else {
    await saveEmail(
      email,
      role,
      name,
      userId,
      templateId,
      emailType,
      "email sent",
      true,
      messageId
    );
  }

  // if (!status) {
  //   await emailModel.create({
  //     userId: userId,
  //     roles: role,
  //     email: email,
  //     name: name,
  //     emailType: emailType,
  //     isEmailSend: false,
  //     templateId: templateId,
  //     failedCount: failed++,
  //     text: "email not sent",
  //   });
  // } else {
  //   await emailModel.create({
  //     userId: userId,
  //     roles: role,
  //     email: email,
  //     name: name,
  //     emailType: emailType,
  //     isEmailSend: true,
  //     templateId: templateId,
  //     sentCount: sent++,
  //     text: "email sent",
  //   });
  // }
};

const sendMailToEmail = async (data) => {
  const userEmail = data?.userEmail;
  const html = data?.content;
  const email = data?.email;
  const subject = data?.subject;
  const file = data?.file;
  const userId = data?.userId;
  const emailType = data?.emailType;
  const firstEmailTemplateId = data?.firstEmailTemplateId;

  const roles = data?.roles;
  // Exist Email Already
  const emailAlreadyExist = await emailModel.findOne({
    userId: userId,
    email: email,
    emailType: "firstEmail",
    templateId: firstEmailTemplateId,
  });

  const originalMessageId = emailAlreadyExist?.messageId;
  // console.log("messageId", emailAlreadyExist);

  // Microsoft Office 365 - SMTP Server
  const transporterOffice = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
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

  // Append Signature at bottom of template
  const newHtml = `${html} ${newSignature(
    "firstName",
    "lastName",
    "position",
    "email",
    "phoneNumber"
  )}`;

  // Template content
  const mailOptions = {
    from: userEmail,
    to: email,
    subject: subject,
    html: newHtml,
    attachments: file?.map((singleFile) => ({
      filename: singleFile?.name,
      path: singleFile?.file,
    })),
  };

  // Add "In-Reply-To" header if messageId is present
  if (originalMessageId && emailType === "followUp") {
    (mailOptions.replyTo = email),
      (mailOptions.headers = {
        "In-Reply-To": originalMessageId,
        References: originalMessageId,
      });
  }

  await transporterOffice.sendMail(mailOptions, async (error, info) => {
    if (error) {
      console.log(error);
      await saveDataToDb(data, false);
    } else {
      const messageId = info.messageId;
      console.log("sent message", info);
      await saveDataToDb(data, messageId, true);
    }
  });
};

module.exports = sendMailToEmail;

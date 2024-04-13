const bcrypt = require("bcryptjs");
const userModels = require("../model/user.model");
const OTP = require("../util/otp");
const sendEmailForgotPassword = require("../util/OTPMAIL");
const { createJWTTOken } = require("../util/JWT");
const SALT = parseInt(process.env.SALT);
const lodash = require("lodash");
const templateModel = require("../model/template.model");
const emailModel = require("../model/email.model");
const otpStore = {};

// Register user
const registerUser = async (req, res) => {
  try {
    const { email, password, roles } = req.body;
    if (!email || !password | !roles) {
      return res
        .status(403)
        .json({ message: "email and password,roles required fields" });
    }
    if (!req.body.roles) {
      return res.status(403).json({ message: "roles is missing" });
    }

    const emailExist = await userModels.findOne({ email: email, roles: roles });
    if (emailExist) {
      return res
        .status(403)
        .json({ message: `email already exist with  ${roles} roles` });
    }
    // save to db

    const hashPassword = await bcrypt.hash(password, SALT);

    const newUser = new userModels({
      email,
      password: hashPassword,
      roles,
    });
    const user = await newUser.save();
    res.status(201).json({ message: "user created", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login user
const lognUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(403)
        .json({ message: "Please enter your email address and password" });
    }
    // if (!req.body.roles) {
    //   return res.status(403).json({ message: "roles is missing" });
    // }
    const user = await userModels.findOne({ email: email });
    // const user = await userModels.findOne({ email: email, roles: roles });

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    // check password is matched or not
    const bcr = await bcrypt.compare(password, user.password);

    if (!bcr) {
      return res.status(403).json({ message: "Invalid password" });
    }
    // create jwt token
    const token = await createJWTTOken(user);

    const pickUser = lodash.pick(user, ["_id", "email", "roles"]);

    res
      .status(200)
      .json({ message: "user logged in", user: pickUser, token: token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Forgot password
const forgotUserPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // const { email, roles } = req.body;

    if (!email) {
      return res.status(403).json({ message: "Email is required" });
    }
    // if (!req.body.roles) {
    //   return res.status(403).json({ message: "roles is missing" });
    // }
    const otpDigit = OTP(5);

    const user = await userModels.findOne({ email: email });
    // const user = await userModels.findOne({ email: email, roles: roles });
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    // Store OTP in memory
    otpStore[email] = otpDigit;

    // save to db
    user.otp = otpDigit;
    user.isOtpVerified = false;
    await user.save();
    // send to email to - EMAIL
    await sendEmailForgotPassword(email, otpDigit);

    res.status(200).json({ message: "OTP sent to your email" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Verify OTP
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    console.log(req.body);
    // const { email, otp, roles } = req.body;
    if (!email) {
      return res.status(403).json({ message: "Email is required" });
    }
    // if (!req.body.roles) {
    //   return res.status(403).json({ message: "roles is missing" });
    // }
    const user = await userModels.findOne({ email: email });
    // const user = await userModels.findOne({ email: email, roles: roles });
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    if (user.otp === otp) {
      user.isOtpVerified = true;
      await user.save();
      res.status(200).send("OTP verification successful.");
    } else {
      res.status(401).send("Invalid OTP. Please try again.");
    }

    // Retrieve stored OTP
    // const storedOTP = otpStore[email];
    // if (otp === storedOTP) {
    //   res.status(200).send("OTP verification successful.");
    //   // Clear OTP after successful verification (optional)
    //   delete otpStore[email];
    // } else {
    //   res.status(401).send("Invalid OTP. Please try again.");
    // }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new Password

const createNewPassword = async (req, res) => {
  try {
    const { email, password, confirmPassword } = req.body;
    // const { email, password, confirmPassword, roles } = req.body;
    if (!email) {
      return res.status(403).json({ message: "Email is required" });
    }
    if (password !== confirmPassword) {
      return res.status(403).json({ message: "password does not matched" });
    }

    // if (!req.body.roles) {
    //   return res.status(403).json({ message: "roles is missing" });
    // }

    const user = await userModels.findOne({ email: email });
    // const user = await userModels.findOne({ email: email, roles: roles });
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }
    if (user.isOtpVerified) {
      const hashPassword = await bcrypt.hash(password, SALT);
      user.password = hashPassword;
      user.isOtpVerified = false;
      await user.save();

      res.status(200).json({
        message: "Password changed successfully ",
      });
    } else {
      return res.status(403).json({ message: "password created already" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { _id: userId, email, roles } = req.user;

    if (!userId || !roles) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
      return res.status(403).json({ message: "password does not matched" });
    }

    const user = await userModels.findOne({
      _id: userId,
      email: email,
      roles: roles,
    });

    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }

    const hashPassword = await bcrypt.hash(password, SALT);
    user.password = hashPassword;
    user.isOtpVerified = false;
    await user.save();
    res.status(200).json({
      message: "Password changed successfully ",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const dashboardData = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const template = await templateModel
      .find({ roles: roles })
      .sort({ count: -1 });

    // const data = await emailModel.aggregate([
    //   {
    //     $group: {
    //       _id: {
    //         email: "$email",
    //         name: "$name",
    //         emailType: "$emailType",
    //         messageId: "$templateId",
    //         followUpTemplateId: "$followUpTemplateId",
    //       },
    //       sent: { $sum: { $cond: [{ $eq: ["$isEmailSend", true] }, 1, 0] } },
    //       failed: { $sum: { $cond: [{ $eq: ["$isEmailSend", false] }, 1, 0] } },
    //       template: { $addToSet: "$templateId" },
    //       followUpTemplate: { $addToSet: "$followUpTemplateId" },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "templates",
    //       localField: "template",
    //       foreignField: "_id",
    //       as: "templateDetails",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "templates",
    //       localField: "followUpTemplate",
    //       foreignField: "_id",
    //       as: "followUpTemplateDetails",
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       email: "$_id.email",
    //       name: "$_id.name",
    //       emailType: "$_id.emailType",
    //       sent: "$sent",
    //       failed: "$failed",
    //       messageId: "$_id.messageId",
    //       followUpTemplateId: "$_id.followUpTemplateId",
    //       template: "$templateDetails",
    //       followUpTemplate: "$followUpTemplateDetails",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: {
    //         email: "$email",
    //         name: "$name",
    //         emailType: "$emailType",
    //       },
    //       sent: { $sum: "$sent" },
    //       failed: { $sum: "$failed" },
    //       totalMails: { $sum: 1 },
    //       messageId: { $push: "$messageId" },
    //       followUpTemplateId: { $push: "$followUpTemplateId" },
    //       template: { $push: "$template" },
    //       followUpTemplate: { $push: "$followUpTemplate" },
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       email: "$_id.email",
    //       name: "$_id.name",
    //       emailType: "$_id.emailType",
    //       sent: "$sent",
    //       failed: "$failed",
    //       totalMails: "$totalMails",
    //       messageId: 1,
    //       followUpTemplateId: 1,
    //       template: 1,
    //       followUpTemplate: 1,
    //     },
    //   },
    // ]);

    const data = await emailModel.aggregate([
      {
        $group: {
          _id: {
            email: "$email",
            name: "$name",
            emailType: "$emailType",
          },
          sent: { $sum: { $cond: [{ $eq: ["$isEmailSend", true] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$isEmailSend", false] }, 1, 0] } },
          template: { $addToSet: "$templateId" },
          followUpTemplate: { $addToSet: "$followUpTemplateId" },
        },
      },
      {
        $lookup: {
          from: "templates",
          localField: "template",
          foreignField: "_id",
          as: "templateDetails",
        },
      },
      {
        $lookup: {
          from: "templates",
          localField: "followUpTemplate",
          foreignField: "_id",
          as: "followUpTemplateDetails",
        },
      },
      {
        $project: {
          _id: 0,
          email: "$_id.email",
          name: "$_id.name",
          emailType: "$_id.emailType",
          sent: "$sent",
          failed: "$failed",
          template: "$templateDetails",
          followUpTemplate: "$followUpTemplateDetails",
        },
      },
      {
        $group: {
          _id: null,
          data: { $push: "$$ROOT" },
          totalSent: { $sum: "$sent" },
          totalFailed: { $sum: "$failed" },
        },
      },
      {
        $project: {
          _id: 0,
          totalSent: 1,
          totalFailed: 1,
          data: 1,
        },
      },
    ]);

    // const data = await emailModel.aggregate([
    //   {
    //     $group: {
    //       _id: {
    //         email: "$email",
    //         name: "$name",
    //         emailType: "$emailType",
    //       },
    //       sent: { $sum: { $cond: [{ $eq: ["$isEmailSend", true] }, 1, 0] } },
    //       failed: { $sum: { $cond: [{ $eq: ["$isEmailSend", false] }, 1, 0] } },
    //       template: { $addToSet: "$templateId" },
    //       followUpTemplate: { $addToSet: "$followUpTemplateId" },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "templates",
    //       localField: "template",
    //       foreignField: "_id",
    //       as: "templateDetails",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "templates",
    //       localField: "followUpTemplate",
    //       foreignField: "_id",
    //       as: "followUpTemplateDetails",
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       email: "$_id.email",
    //       name: "$_id.name",
    //       emailType: "$_id.emailType",
    //       sent: "$sent",
    //       failed: "$failed",
    //       template: "$templateDetails",
    //       followUpTemplate: "$followUpTemplateDetails",
    //     },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalSent: { $sum: "$sent" },
    //       totalFailed: { $sum: "$failed" },
    //       data: { $push: "$$ROOT" },
    //     },
    //   },
    //   {
    //     $unwind: "$data",
    //   },
    //   {
    //     $replaceRoot: {
    //       newRoot: {
    //         $mergeObjects: [
    //           "$data",
    //           { totalSent: "$totalSent", totalFailed: "$totalFailed" },
    //         ],
    //       },
    //     },
    //   },
    // ]);

    // const data = await emailModel.aggregate([
    //   {
    //     $group: {
    //       _id: {
    //         email: "$email",
    //         name: "$name",
    //         emailType: "$emailType",
    //       },
    //       sent: { $sum: { $cond: [{ $eq: ["$isEmailSend", true] }, 1, 0] } },
    //       failed: { $sum: { $cond: [{ $eq: ["$isEmailSend", false] }, 1, 0] } },
    //       template: { $addToSet: "$templateId" },
    //       followUpTemplate: { $addToSet: "$followUpTemplateId" },
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "templates", // replace with your actual templates collection name
    //       localField: "template",
    //       foreignField: "_id",
    //       as: "templateDetails",
    //     },
    //   },
    //   {
    //     $lookup: {
    //       from: "templates", // replace with your actual templates collection name
    //       localField: "followUpTemplate",
    //       foreignField: "_id",
    //       as: "followUpTemplateDetails",
    //     },
    //   },
    //   {
    //     $project: {
    //       _id: 0,
    //       email: "$_id.email",
    //       name: "$_id.name",
    //       emailType: "$_id.emailType",
    //       sent: "$sent",
    //       failed: "$failed",
    //       template: "$templateDetails",
    //       followUpTemplate: "$followUpTemplateDetails",
    //     },
    //   },
    // ]);

    // Template
    // const template = await templateModel
    //   .find({ roles: roles })
    //   .sort({ createdAt: 1 });

    res.status(200).json({ data: data, template: template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  lognUser,
  forgotUserPassword,
  verifyOTP,
  createNewPassword,
  resetPassword,
  dashboardData,
};

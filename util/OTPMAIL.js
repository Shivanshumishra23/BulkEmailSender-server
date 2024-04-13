const nodemailer = require("nodemailer");

const userEmail = process.env.email;
const userPassword = process.env.password;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: userEmail,
    pass: userPassword,
  },
});

const sendEmailForgotPassword = async (email, otp) => {
  // Email configuration
  const mailOptions = {
    from: userEmail,
    to: email,
    subject: "Your OTP for Verification",
    html: `<p>Your OTP for verification is: <strong>${otp}</strong></p>`,
  };

  // Send email
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(error);
    } else {
      console.log("Email sent: " + info.response);
    }
  });
};

module.exports = sendEmailForgotPassword;

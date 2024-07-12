const express = require("express");
const userModels = require("../model/user.model");
const {
  registerUser,
  lognUser,
  forgotUserPassword,
  verifyOTP,
  createNewPassword,
  resetPassword,
  dashboardData,
  registerUserAsCto,
} = require("../controller/user.controller");
const { authenticate } = require("../middleware/auth.middleware");
const authRouter = express.Router();

// Register user - Admin handle
authRouter.post("/register", registerUser);
authRouter.post("/register-cto", authenticate, registerUserAsCto); // New route for CTO
// Login based on rolesresetPassword
authRouter.post("/login", lognUser);

// forgot password
authRouter.post("/forgot", forgotUserPassword);
authRouter.post("/verify-otp", verifyOTP);
authRouter.post("/create-password", createNewPassword);

// Dashboard Data
authRouter.get("/dashboard", authenticate, dashboardData);

// verify token
// api/user/verify-token
authRouter.get("/verify-token", authenticate, (req, res, next) => {
  try {
    const { _id: userId } = req.user;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    res.status(200).json({ message: "Token is valid" });
  } catch (error) {
    res.status(401).json({ message: "token is invalid" });
  }
});

// authenticate route
authRouter.post("/reset-password", authenticate, resetPassword);

module.exports = authRouter;

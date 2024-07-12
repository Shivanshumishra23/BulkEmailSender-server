const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    otp: {
      type: String,
      required: false,
    },
    isOtpVerified: {
      type: Boolean,
      default: false,
    },
    roles: {
      type: String,
      enum: ["hr", "marketing", "ceo","cto"],
      default: "hr",
      required: true,
    },
    appPassword: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const userModels = mongoose.model("User", userSchema);
module.exports = userModels;

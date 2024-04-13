const mongoose = require("mongoose");

const emailSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "template",
      required: false,
    },
    followUpTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "template",
      required: false,
    },
    roles: {
      type: String,
      required: true,
    },
    messageId: {
      type: String,
      default: "",
      required: false,
    },
    name: {
      type: String,
      default: "",
      required: false,
    },
    email: {
      type: String,
      required: false,
    },
    emailType: {
      type: String,
      enum: ["firstEmail", "followUp"],
      default: "firstEmail",
      required: false,
    },
    isEmailSend: {
      type: Boolean,
      default: false,
    },

    text: {
      type: String,
      default: "",
      required: false,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

emailSchema.index({ userId: 1 });

const emailModel = mongoose.model("email", emailSchema);
module.exports = emailModel;

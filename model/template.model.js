const mongoose = require("mongoose");

const templateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    roles: {
      type: String,
      required: true,
    },
    firstEmailTemplateId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
    },
    subject: {
      type: String,
      required: false,
    },
    template: {
      type: String,
      required: false,
    },
    count: {
      type: Number,
      default: 0,
      required: false,
    },
    emailType: {
      type: String,
      enum: ["firstEmail", "followUp"],
      default: "firstEmail",
      required: false,
    },
    isFollowUp: {
      type: Boolean,
      default: false,
      required: false,
    },
    isFollowUpFirstEmail: {
      type: Boolean,
      default: false,
      required: false,
    },
    followUpTemplate: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "template",
        required: false,
      },
    ],
  },
  {
    timestamps: true,
  }
);

templateSchema.set("toObject", { virtuals: true });
templateSchema.set("toJSON", { virtuals: true });

// Define a virtual field to reference files associated with the template
templateSchema.virtual("files", {
  ref: "file", // Model to use for the reference
  localField: "_id", // Local field where the Template _id is stored
  foreignField: "templateId", // Foreign field in the File model
  justOne: false, // Set to false to get an array of files
});

templateSchema.index({ userId: 1, roles: 1 });
const templateModel = mongoose.model("template", templateSchema);
module.exports = templateModel;

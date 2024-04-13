const mongoose = require("mongoose");

const followUpSchema = new mongoose.Schema(
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
    firstTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "template",
      required: true,
    },
    followUpTemplate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "template",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const followUpModel = mongoose.model("followUp", followUpSchema);
module.exports = followUpModel;

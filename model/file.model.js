const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema(
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
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "template",
      required: true,
    },
    file: {
      type: String,
      required: false,
    },
    name: {
      type: String,
      required: false,
    },
    type: {
      type: String,
      required: false,
    },
    size: {
      type: Number,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

const fileModel = mongoose.model("file", fileSchema);
module.exports = fileModel;

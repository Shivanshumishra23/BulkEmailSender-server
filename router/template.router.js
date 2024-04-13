const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const upload = require("../util/multer");
const {
  uploadFileSendEmail,
  templateHtml,
  templateDepartmentFilter,
  deleteTemplate,
  getAllTemplateHtml,
  getSingleTemplate,
  getAllEmailBasedOnRoles,
  updateTemplate,
  followUpMailer,
  getAllFilesBasedOnRoles,
  deleteAttachment,
} = require("../controller/template.controller");
const { uploadFileS3 } = require("../config/S3Config");
const fileUpload = require("express-fileupload");

const templateRouter = express.Router();

// UPLOAD FILES AND SEND EMAIL --------------------------------
templateRouter.post(
  "/upload/file",
  authenticate,
  upload.single("file"),
  uploadFileSendEmail
);

// Follow up MAIL SENDER
// templateRouter.post("/template/followUp/email", authenticate, followUpMailer);

// Add Template
templateRouter.post(
  "/template/add",
  authenticate,
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
  templateHtml
);

templateRouter.get("/template/getAll", authenticate, getAllTemplateHtml);

// Get Template Based On Roles
templateRouter.get(
  "/template/status/:department",
  authenticate,
  templateDepartmentFilter
);

// Delete Template
templateRouter.delete(
  "/template/delete/:templateId",
  authenticate,
  deleteTemplate
);

// Edit template with ID
templateRouter.patch(
  "/template/edit/:templateId",
  authenticate,
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  }),
  updateTemplate
);

// Get Single Template
templateRouter.get(
  "/template/single/:templateId",
  authenticate,
  getSingleTemplate
);

// Get All Email based on Roles
templateRouter.get("/allEmail/roles", authenticate, getAllEmailBasedOnRoles);

// Get All Files based on Roles
templateRouter.get("/allFiles/roles", authenticate, getAllFilesBasedOnRoles);

// Delete Attachments based on ID
templateRouter.delete(
  "/attachment/:fileId/:templateId",
  authenticate,
  deleteAttachment
);

module.exports = templateRouter;

const XLSX = require("xlsx");
const { parse } = require("csv-parse");
const templateModel = require("../model/template.model");
const sendMailToEmail = require("../util/MAILER");
const emailModel = require("../model/email.model");
const fileModel = require("../model/file.model");
const path = require("path");
const { uplaodFileToS3 } = require("../config/S3Config");
const followUpModel = require("../model/followUp.model");

const mapToArrayOfObjects = (inputMap) => {
  const resultArray = [];
  for (const [key, values] of inputMap) {
    for (let i = 0; i < values.length; i++) {
      if (!resultArray[i]) {
        resultArray[i] = {};
      }
      resultArray[i][key] = values[i];
    }
  }
  return resultArray;
};

// Generate comparable emailType
const generateString = (input) => {
  if (input === "followUp") {
    return "FollowUp";
  } else if (input === "firstEmail") {
    return "FirstEmail";
  } else {
    // Handle unexpected input
    return "InvalidInput";
  }
};

// send email notification
let data = [] || null;
let emailDataList = [] || null;
const newData = new Map();

// uploadFil and send email
const uploadFileSendEmail = async (req, res, next) => {
  try {
    const { _id, roles, email: userEmail } = req.user;
    const { subject, templateId, emailType } = req.body;
    let template = req.body.template;

    if (!_id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a valid file" });
    }

    // extract all fields
    const regex = /{{(.*?)}}/g;
    const matches = [];
    let match;
    while ((match = regex.exec(template)) !== null) {
      matches.push(match[1].trim());
    }
    // END

    const fileExtension = path.extname(req.file.originalname);

    if (fileExtension === ".xlsx") {
      const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
      // const sheetName = workbook.SheetNames[];

      const sheetEmailType = generateString(emailType);

      const findSheet = workbook.SheetNames.filter(
        (sheet) => sheet === sheetEmailType
      );
      const xlsxData = XLSX.utils.sheet_to_json(workbook.Sheets[findSheet[0]]);

      const emailRow = xlsxData?.map((row) => row["Email"] || row["email"]);
      newData.set("email", emailRow);
      if (!emailRow[0]) {
        res
          .status(500)
          .json({ message: "update correct email column in exel file." });
      }
      // Find all rows of the specified column
      matches?.forEach((col, index) => {
        const rows = xlsxData?.map((row) => row[col]);
        if (rows) {
          const colName = matches[index];
          newData.set(colName, rows);
        }
      });
      const resultArray = mapToArrayOfObjects(newData);
      emailDataList = resultArray;
    } else {
      const csvData = await new Promise((resolve, reject) => {
        parse(req.file.buffer, { columns: true }, (err, records) => {
          if (err) {
            reject(err);
          } else {
            resolve(records);
          }
        });
      });
      const emailRow = csvData?.map((row) => row["Email" || "email"]);
      newData.set("email", emailRow);
      // Find all rows of the specified column
      matches?.forEach((col, index) => {
        const rows = csvData?.map((row) => row[col]);
        // Check if the column exists before setting it in the Map
        if (rows) {
          const colName = matches[index];
          newData.set(colName, rows);
        }
      });
      const resultArray = mapToArrayOfObjects(newData);
      emailDataList = resultArray;
    }

    /*************-------------------SEND EMAIL ---------------------******************* */
    const findAllAttachment = await fileModel.find({
      userId: _id,
      roles: roles,
      templateId: templateId,
    });

    //Find Template
    const findTemplate = await templateModel.findOne({
      userId: _id,
      roles: roles,
      _id: templateId,
    });
    findTemplate.count++;
    await findTemplate.save();

    const sendMailPromises = emailDataList?.map(async (obj) => {
      let dynamicTemplate = template;
      Object.entries(obj).forEach(([key, value]) => {
        const placeholder = new RegExp(`{{${key}}}`, "g");
        dynamicTemplate = dynamicTemplate.replace(placeholder, value);
      });
      const name1 = obj?.firstName + " " + obj?.lastName;
      const name2 = obj?.firstname + " " + obj?.lastname;
      const name3 = obj?.FirstName + " " + obj?.LastName;
      const emailObj = {
        role: roles,
        userId: _id,
        userEmail: userEmail,
        templateId: templateId,
        firstEmailTemplateId: findTemplate?.firstEmailTemplateId,
        email: obj?.email,
        name: obj?.name || name1 || name2 || name3 || "user",
        subject: subject,
        emailType: emailType,
        content: dynamicTemplate,
        file: findAllAttachment,
      };

      await sendMailToEmail(emailObj);
    });

    await Promise.all(sendMailPromises)
      .then(() => {
        res.status(200).json({
          message: "File uploaded and processed successfully",
          data,
        });
      })
      .catch((err) => {
        res.status(500).json({ message: err.message });
      });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// followUp email
const followUpMailer = async (req, res, next) => {
  try {
    const { _id, roles, email: userEmail } = req.user;
    const { email, templateId } = req.body;
    if (!_id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const findTemplateById = await templateModel.findOne({
      userId: _id,
      roles: roles,
      _id: templateId,
    });

    if (!findTemplateById) {
      return res
        .status(404)
        .json({ message: "Template not found. create template" });
    }

    const followUpTemplateId =
      findTemplateById?.followUp[findTemplateById?.followUp?.length - 1];

    if (!followUpTemplateId) {
      return res
        .status(404)
        .json({ message: "follow up TemplateId not found" });
    }
    // find follow up template
    const followUpTemplate = await followUpModel.findOne({
      _id: followUpTemplateId,
    });

    if (!followUpTemplate) {
      return res.status(404).json({ message: "follow up Template not found" });
    }

    const findAllAttachment = await fileModel.find({
      userId: _id,
      roles: roles,
      templateId: followUpTemplateId,
    });

    const emailObj = {
      role: roles,
      userId: _id,
      userEmail: userEmail,
      templateId: templateId,
      email: email,
      emailType: findTemplateById?.emailType,
      subject: followUpTemplate?.subject,
      content: followUpTemplate?.template,
      file: findAllAttachment,
    };

    await sendMailToEmail(emailObj);

    res.status(200).json({ message: "message sent successfully" });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: error.message });
  }
};
// end

const templateHtml = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;
    const { template, subject, emailType, templateId } = req.body;

    let isAttchFile = false;
    let attachFiles = null;

    let saveTemp = null;
    if (req.files) {
      attachFiles = req.files["files[]"];
      isAttchFile = true;
    }

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    if (!template) {
      return res.status(400).json({ message: "Please provide a template" });
    }
    if (!subject) {
      return res.status(400).json({ message: "Please provide a subject" });
    }
    // make Array is attchFiles is an object
    if (isAttchFile && !attachFiles[0]) {
      attachFiles = [req.files["files[]"]];
      isAttchFile = true;
    }

    if (emailType === "firstEmail") {
      const savedTemplate = new templateModel({
        userId: userId,
        roles: roles,
        subject: subject,
        template: template,
        emailType: emailType,
        isFollowUpFirstEmail: false,
      });
      saveTemp = await savedTemplate.save();
      if (!saveTemp) {
        return res.status(400).json({ message: "Template not saved " });
      }
    } else if (emailType === "followUp") {
      const findAlreadyExistsTemplate = await templateModel.findOne({
        userId: userId,
        roles: roles,
        _id: templateId,
      });
      // code for follow up
      const savedTemplate = new templateModel({
        userId: userId,
        roles: roles,
        subject: subject,
        template: template,
        firstEmailTemplateId: templateId,
        emailType: emailType,
        isFollowUp: true,
      });
      saveTemp = await savedTemplate.save();

      if (!saveTemp) {
        return res.status(400).json({ message: "Template not saved " });
      }
      // set follow up template
      findAlreadyExistsTemplate.isFollowUpFirstEmail = true;

      findAlreadyExistsTemplate.followUpTemplate.push(saveTemp?._id);

      // findAlreadyExistsTemplate.followedUpTemplateId = saveTemp?._id;
      await findAlreadyExistsTemplate.save();

      // create multipart FollowUp with First Email
      const savedFollowUpTemplate = await followUpModel.create({
        userId: userId,
        roles: roles,
        firstTemplate: templateId,
        followUpTemplate: saveTemp?._id,
      });
      if (!savedFollowUpTemplate) {
        return res.status(400).json({ message: "Template not saved " });
      }
    } else {
      return res.status(404).json({ message: "Invalid emailType" });
    }

    // upload to S3 - make array of object
    if (attachFiles && isAttchFile) {
      const saveFileS3 = await uplaodFileToS3(attachFiles);

      const saveFilePromises = saveFileS3?.map(async (file, index) => {
        const createdFile = await fileModel.create({
          userId: userId,
          roles: roles,
          templateId: saveTemp?._id,
          file: file?.Location,
          name: attachFiles[index]?.name,
          type: attachFiles[index]?.type,
          size: parseInt(attachFiles[index]?.size),
        });
        return createdFile;
      });

      // Wait for all file creation promises to resolve
      const savedFiles = await Promise.all(saveFilePromises);

      return res.status(200).json({
        message: "Template uploaded and processed successfully",
        savedFiles: savedFiles,
      });
    }

    return res.status(200).json({ message: "Template created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// filter based on department
const templateDepartmentFilter = async (req, res) => {
  try {
    const { id: userId, roles } = req.user;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    /******************** Already role is present - we passing  query parameters ******/
    const enumDepartment = ["hr", "marketing", "ceo"];
    const { deparment } = req.params;

    // department must be specified ["hr","marketing","ceo"]
    const isDepartment = enumDepartment.includes(deparment);

    if (!isDepartment) {
      return res.status(403).json({ message: "Department does not matched" });
    }

    // filter all templates based on department
    const template = await templateModel.find({
      userId: userId,
      $or: [{ roles: deparment }, { roles: roles }],
    });

    res
      .status(200)
      .json({ message: "template fetched successfully", data: template });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// delete template from db
const deleteTemplate = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;
    if (!userId || !roles) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    const { templateId } = req.params;

    if (!templateId) {
      return res.status(203).json({ message: "Template id not found" });
    }

    // find first template
    const findTemplate = await templateModel.findOne({
      userId: userId,
      roles: roles,
      _id: templateId,
    });

    if (findTemplate?.emailType === "followUp") {
      // find first template
      const findTemplateqwuiq = await templateModel.findOne({
        userId: userId,
        roles: roles,
        _id: findTemplate?.followedUpTemplateId,
      });
      console.log(findTemplateqwuiq);

      const deleteFollowUpIdFromFirstEmail =
        await templateModel.findByIdAndUpdate(
          findTemplate?.followedUpTemplateId,
          {
            $pull: {
              followUp: { followUpId: templateId },
            },
          }
        );

      // follow template delete
      const templateDel = await templateModel.findOneAndDelete({
        userId: userId,
        roles: roles,
        _id: templateId,
      });

      res.status(200).json({
        message: "Template deleted successfully ",
        data: "templateDel",
      });
    } else {
      // first template
      const templateDel = await templateModel.findOneAndDelete({
        userId: userId,
        roles: roles,
        _id: templateId,
      });

      res.status(200).json({ message: "Template deleted successfully " });
    }

    // follow up template
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// update template from db
const updateTemplate = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;
    let attachFiles = null;

    if (req.files && !attachFiles[0]) {
      attachFiles = [req.files["files[]"]];
    }

    if (!userId || !roles) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    const { templateId } = req.params;
    if (!templateId) {
      return res.status(203).json({ message: "Template id not found" });
    }
    const updatedTemplate = await templateModel.findOneAndUpdate(
      {
        roles: roles,
        _id: templateId,
      },
      {
        $set: {
          template: req.body.template,
          subject: req.body.subject,
        },
      }
    );

    // upload to S3 - make array of object
    if (attachFiles) {
      const saveFileS3 = await uplaodFileToS3(attachFiles);
      const saveFilePromises = saveFileS3?.map(async (file, index) => {
        const createdFile = await fileModel.create({
          userId: userId,
          roles: roles,
          templateId: templateId,
          file: file?.Location,
          name: attachFiles[index]?.name,
          type: attachFiles[index]?.type,
          size: parseInt(attachFiles[index]?.size),
        });
        return createdFile;
      });

      // Wait for all file creation promises to resolve
      await Promise.all(saveFilePromises);
    }
    res.status(200).json({ message: "Template updated successfully " });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// get ALl template from db
const getAllTemplateHtml = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;
    if (!userId || !roles) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    const allTemplate = await templateModel
      .find({
        userId: userId,
        roles: roles,
      })
      .sort({ createdAt: -1 })
      .populate("files")
      .populate({
        path: "followUpTemplate",
        model: "template",
        populate: {
          path: "files",
        },
      })
      .exec();

    res
      .status(200)
      .json({ message: "Template fetched successfully ", data: allTemplate });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// get single template from db
const getSingleTemplate = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;
    const { templateId } = req.params;
    const { ref } = req.query;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }
    if (!templateId) {
      return res.status(203).json({ message: "Template id not found" });
    }

    const template = await templateModel
      .findOne({
        userId: userId,
        roles: roles,
        _id: templateId,
      })
      .populate("files")
      .exec();

    if (!template) {
      return res
        .status(404)
        .json({ message: "Template not found. create template" });
    }

    // if (ref === "followUp") {
    // const followUpTemplateId =
    //   template?.followUp[template?.followUp?.length - 1];

    // if (!followUpTemplateId) {
    //   return res
    //     .status(404)
    //     .json({ message: "follow up TemplateId not found" });
    // }
    // find follow up template
    // const followUpTemplate = await followUpModel.findOne({
    //   _id: followUpTemplateId,
    // });

    // if (!followUpTemplate) {
    //   return res
    //     .status(404)
    //     .json({ message: "follow up Template not found" });
    // }

    // const fileAllAtach = await fileModel.find({
    //   userId: userId,
    //   roles: roles,
    //   templateId: followUpTemplateId,
    // });

    // res.status(200).json({
    //   message: "Template fetched successfully ",
    //   data: followUpTemplate,
    //   file: fileAllAtach,
    // });
    // }

    // else {

    //################### File Attachment

    // const fileAllAtach = await fileModel.find({
    //   userId: userId,
    //   roles: roles,
    //   templateId: templateId,
    // });

    res.status(200).json({
      message: "Template fetched successfully ",
      data: template,
      // file: fileAllAtach,
    });
    // }
  } catch (error) {
    console.log("errors", error);
    res.status(500).json({ message: error.message });
  }
};

// get All Email based on roles

const getAllEmailBasedOnRoles = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;
    let emailList = [];

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const emailByRoles = await emailModel
      .find({ roles: roles })
      .sort({ createdAt: -1 });

    const populatedEmails = emailByRoles.map(async (email) => {
      if (email.templateId) {
        return await email.populate("templateId");
      } else if (email.followUpTemplateId) {
        return await email.populate("followUpTemplateId");
      } else {
        return email;
      }
    });

    const populatedEmailsArray = await Promise.all(populatedEmails);

    // const promises = emailByRoles.map(async (email) => {
    //   const followUp = await followUpModel
    //     .findOne({
    //       firstTemplate: email?.templateId,
    //     })
    //     .sort({ createdAt: -1 });

    //   const firstTemp = await templateModel.findOne({
    //     _id: followUp?.firstTemplate,
    //   });

    //   const followUpTemp = await templateModel
    //     .findOne({
    //       _id: followUp?.followUpTemplate,
    //     })
    //     .sort({ createdAt: -1 });

    //   // emailList.push({
    //   //   email: email,
    //   //   followUp: followUp,
    //   //   followUpTemp: followUpTemp,
    //   //   firstTemplate: firstTemp,
    //   // });
    // });

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

    // console.log(data);

    // await Promise.all(promises);

    // if (emailList) {
    res.status(200).json({
      message: "Email fetched successfully",
      data: populatedEmailsArray,
    });
    // }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Get All files
const getAllFilesBasedOnRoles = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const files = await fileModel
      .find({ roles: roles })
      .sort({ createdAt: -1 });

    res
      .status(200)
      .json({ message: "Email fetched successfully", data: files });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: error.message });
  }
};

// Delete Attachment
const deleteAttachment = async (req, res) => {
  try {
    const { _id: userId, roles } = req.user;
    if (!userId || !roles) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const { fileId, templateId } = req.params;
    if (!templateId) {
      return res.status(404).json({ message: "Template not found" });
    }
    if (!fileId) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const removeAttachment = await fileModel.findOneAndDelete({
      userId: userId,
      templateId: templates,
      _id: fileId,
    });

    res.status(200).json({ message: "attachment removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
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
};

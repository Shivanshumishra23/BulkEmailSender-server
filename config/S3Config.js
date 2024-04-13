const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs/promises");

const accessKeyId = process.env.accessKeyId;
const secretAccessKey = process.env.secretAccessKey;
const region = process.env.region;
const bucketName = process.env.bucketName;

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype.startsWith("image/") ||
    file.mimetype.startsWith("application/")
  ) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type"), false);
  }
};
const client = new S3Client({
  credentials: {
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
  },
  region: region,
});

// Set storage engine
const storage = multer.memoryStorage();
module.exports.uploadFileS3 = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 10 },
  fileFilter: fileFilter,
});
module.exports.uplaodFileToS3 = async (files) => {
  const uploadPromises = files?.map(async (file) => {
    const fileContent = await fs.readFile(file?.tempFilePath);
    const key = `${file?.name}-${new Date().getTime()}`;
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: fileContent,
      ContentType: file?.mimetype,
    });
    await client.send(command);
    return {
      Location: `https://${bucketName}.s3.${region}.amazonaws.com/${command?.input?.Key}`,
    };
  });
  try {
    const awsResult = await Promise.all(uploadPromises);
    return awsResult;
  } catch (err) {
    console.error(err);
    throw err;
  }
};

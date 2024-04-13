const multer = require("multer");

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fieldSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    // Check if the file extension is csv or xlsx
    const allowedExtensions = /\.(csv|xlsx)$/;
    if (file.originalname.match(allowedExtensions)) {
      return cb(null, true);
    }
    return cb(new Error("Only CSV and XLSX files are allowed!"));
  },
});

module.exports = upload;

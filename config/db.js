const mongoose = require("mongoose");

const mongooseConnect = async () => {
  try {
    const MONGODB_URL_DEV = process.env.MONGODB_URL_DEV;
    const MONGODB_URL_PROD = process.env.MONGODB_URL_PROD;
    const MONGODB_URL =
      process.env.NODE_ENV === "production"
        ? MONGODB_URL_PROD
        : MONGODB_URL_DEV;

    await mongoose.connect(MONGODB_URL_PROD, {});
    console.log("Connected to db");
  } catch (error) {
    console.log("mongodb connection error", error);
  }
};

mongooseConnect();

// module.exports = mongooseConnect;

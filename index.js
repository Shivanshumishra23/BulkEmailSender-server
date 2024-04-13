require("dotenv").config({});
require("./config/db");

const express = require("express");
const cors = require("cors");
const fileUpload = require("express-fileupload");

const authRouter = require("./router/auth.router");
const templateRouter = require("./router/template.router");

// connect to db
// mongooseConnect();

const app = express();

// port
const port = process.env.PORT || 5000;

app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(express.json({ limit: "100mb" }));

// cors
app.use(
  cors({
    origin: true,
    credentials: true,
    optionsSuccessStatus: 200,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  })
);
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

// Routes
app.get("/", (req, res) => {
  res.status(200).send("Message server is working fine - EmailR");
});

// router modules
app.use("/api/user", authRouter);
app.use("/api", templateRouter);

app.listen(port, () => {
  console.log("listen port: " + port);
});

module.exports = app;

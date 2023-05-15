const express = require("express");
const ErrorHandler = require("./middlewares/error");
const multer = require("multer");
const cors = require("cors");
const cookie=require("cookie-parser")
const app = express();

const User = require("./routes/user");
const Post = require("./routes/post");

app.use(express.json());
app.use(cors());
app.use(multer().any());
app.use(cookie())


app.use("/api", User);
app.use("/api", Post);

//Error Handler middleware
app.use(ErrorHandler);
module.exports = app;

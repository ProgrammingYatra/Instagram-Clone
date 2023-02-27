const express = require("express");
const ErrorHandler = require("./middlewares/error");

const cookie=require("cookie-parser")
const cors=require("cors")
const app = express();
app.use(cookie())
app.use(express.json());
app.use(cors())


//Error Handler middleware
app.use(ErrorHandler);
module.exports = app;

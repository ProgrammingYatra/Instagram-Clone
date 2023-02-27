const userModel = require("../models/User");
const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const aws = require("../Aws/aws.js");
const User = require("../models/User");
exports.registerUser = catchAsyncError(async (req, res, next) => {
  const { name, email, password } = req.body;
  const files = req.files;
  if (!files) {
    return next(new ErrorHandler("Please Provide a Profile Image", 400));
  }
  let profileImage = await aws.uploadFile(files[0]);
  const user = await userModel.create({
    name,
    email,
    password,
    avatar: profileImage,
  });
  sendToken(user, 200, res);
});

// Login User
exports.loginUser = catchAsyncError(async (req, res, next) => {
  const { email, password } = req.body;

  // checking if user has given password and email both

  if (!email || !password) {
    return next(new ErrorHandler("Please Enter Email & Password", 400));
  }

  const user = await userModel.findOne({ email }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  sendToken(user, 200, res);
});

//logout
exports.logout = catchAsyncError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(new Date().getTime()),
    httpOnly: true,
  });

  res.status(200).json({
    sucess: true,
    message: "Logged Out Successfully",
  });
});
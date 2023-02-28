const userModel = require("../models/User");
const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const sendToken = require("../utils/jwtToken");
const aws = require("../Aws/aws.js");
const User = require("../models/User");
const Post = require("../models/Post");
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

//follow User

exports.followUser = catchAsyncError(async (req, res, next) => {
  const userTofollow = await userModel.findById(req.params.id);
  const loggedInUser = await userModel.findById(req.user._id);

  if (!userTofollow) {
    return next(new ErrorHandler("No User Found", 404));
  }

  if (loggedInUser.following.includes(userTofollow._id)) {
    const indexFollowing = loggedInUser.following.indexOf(userTofollow._id);
    const indexFollower = userTofollow.followers.indexOf(loggedInUser._id);

    userTofollow.followers.splice(indexFollower, 1);
    loggedInUser.following.splice(indexFollowing, 1);

    loggedInUser.save();
    userTofollow.save();

    return res.status(200).json({
      success: true,
      message: "User Un-Followed",
    });
  } else {
    loggedInUser.following.push(req.params.id);
    userTofollow.followers.push(loggedInUser._id);

    loggedInUser.save();
    userTofollow.save();

    return res.status(200).json({
      success: true,
      message: "User Followed",
    });
  }
});

//update password

exports.updatePassword = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req.user._id).select("+password");
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(
      new ErrorHandler("Please Provide a Password to change it", 400)
    );
  }
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    return next(new ErrorHandler("Incorrect Old password", 400));
  }

  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password Updated Successfully",
  });
});

// Profile Update

exports.updateProfile = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req.user._id);
  const { email, name } = req.body;
  if (email) {
    user.email = email;
  }

  if (name) {
    user.name = name;
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Profile Updated Successfully",
  });
});

// Delete My Profile

exports.deleteMyProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  const posts = user.posts;
  const followers = user.followers;
  const following = user.following;
  const userId = user._id;
  await user.remove();

  // Logout user after deleting profile
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  // Delete all posts of the user
  for (let i = 0; i < posts.length; i++) {
    const post = await Post.findById(posts[i]);
    await post.remove();
  }

  // Removing User from Followers Following
  for (let i = 0; i < followers.length; i++) {
    const follower = await User.findById(followers[i]);

    const index = follower.following.indexOf(userId);
    follower.following.splice(index, 1);
    await follower.save();
  }

  // Removing User from Following's Followers
  for (let i = 0; i < following.length; i++) {
    const follows = await User.findById(following[i]);

    const index = follows.followers.indexOf(userId);
    follows.followers.splice(index, 1);
    await follows.save();
  }

  // removing all comments of the user from all posts
  const allPosts = await Post.find();

  for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);

    for (let j = 0; j < post.comments.length; j++) {
      if (post.comments[j].user === userId) {
        post.comments.splice(j, 1);
      }
    }
    await post.save();
  }
  // removing all likes of the user from all posts

  for (let i = 0; i < allPosts.length; i++) {
    const post = await Post.findById(allPosts[i]._id);

    for (let j = 0; j < post.likes.length; j++) {
      if (post.likes[j] === userId) {
        post.likes.splice(j, 1);
      }
    }
    await post.save();
  }

  return res.status(200).json({
    success: true,
    message: "Profile Deleted Successfully",
  });
});

exports.myProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id).populate("posts");

  if (!user) {
    return next(new ErrorHandler("User not Found", 404));
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

//get user profile
exports.getUserProfile = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.params.id).populate("posts");

  if (!user) {
    return next(new ErrorHandler("User not Found", 404));
  }

  return res.status(200).json({
    success: true,
    user,
  });
});

//get All user
exports.getAllUsers = catchAsyncError(async (req, res, next) => {
  const user = await User.find({});

  return res.status(200).json({
    success: true,
    user,
  });
});

exports.getMyPosts = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.user._id);

  const posts = [];

  for (let i = 0; i < user.posts.length; i++) {
    const post = await Post.findById(user.posts[i]).populate(
      "likes comments.user owner"
    );
    posts.push(post);
  }

  res.status(200).json({
    success: true,
    posts,
  });
});

exports.getUserPosts = catchAsyncError(async (req, res) => {
  const user = await User.findById(req.params.id);

  const posts = [];

  for (let i = 0; i < user.posts.length; i++) {
    const post = await Post.findById(user.posts[i]).populate(
      "likes comments.user owner"
    );
    posts.push(post);
  }

  res.status(200).json({
    success: true,
    posts,
  });
});

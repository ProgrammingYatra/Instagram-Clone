const catchAsyncError = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utils/errorHandler");
const Post = require("../models/Post");
const User = require("../models/User");
const aws = require("../Aws/aws.js");

// create post
exports.createPost = catchAsyncError(async (req, res, next) => {
  const { caption } = req.body;
  const owner = req.user._id;
  console.log(owner);
  const files = req.files;
  if (!files) {
    return next(new ErrorHandler("Please Provide a Profile Image", 400));
  }
  let img = await aws.uploadFile(files[0]);
  const newPost = await Post.create({
    caption,
    owner,
    img,
  });
  const user = await User.findById(req.user._id);
  user.posts.push(newPost._id);
  await user.save();
  return res.status(201).json({ success: true, post: newPost });
});

// Delete post
exports.deletePost = catchAsyncError(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorHandler("Post not Found", 404));
  }

  if (post.owner.toString() !== req.user._id.toString()) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  await post.remove();
  const user = await User.findById(req.user._id);
  const index = user.posts.indexOf(req.params.id);
  user.posts.splice(index, 1);
  await user.save();
  return res.status(200).json({
    success: true,
    message: "Post Deleted Successfully",
  });
});

// Like & Dislike Post
exports.likeAndDislike = catchAsyncError(async (req, res, next) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    return next(new ErrorHandler("Post not Found", 404));
  }
  if (post.likes.includes(req.user._id)) {
    const index = post.likes.indexOf(req.user._id);
    post.likes.splice(index, 1);
    await post.save();
    return res.status(200).json({ success: true, message: "UnLike Post" });
  } else {
    post.likes.push(req.user._id);
    await post.save();
    return res.status(200).json({ success: true, message: "Like Post" });
  }
});

//get post of Following

exports.getPostOfFollowing = catchAsyncError(async (req, res, next) => {
  const user = await User.findById(req.user._id);
  console.log(user);
  const posts = await Post.find({
    owner: {
      $in: user.following,
    },
  }).populate("owner likes comments.user");
  console.log(posts);
  res.status(200).json({
    success: true,
    posts: posts.reverse(),
  });
});

//update caption

exports.updateCaption = catchAsyncError(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("Post not Found", 404));
  }

  if (post.owner._id.toString() !== req.user._id.toString()) {
    return next(new ErrorHandler("Unauthorised", 401));
  }
  post.caption = req.body.caption;

  post.save();

  return res.status(200).json({
    success: true,
    message: "Caption Updated Successfully",
  });
});

// comment on post
exports.commentOnPost = catchAsyncError(async (req, res) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }

  let commentIndex = -1;

  // Checking if comment already exists

  post.comments.forEach((item, index) => {
    if (item.user.toString() === req.user._id.toString()) {
      commentIndex = index;
    }
  });

  if (commentIndex !== -1) {
    post.comments[commentIndex].comment = req.body.comment;

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Comment Updated",
    });
  } else {
    post.comments.push({
      user: req.user._id,
      comment: req.body.comment,
    });

    await post.save();
    return res.status(200).json({
      success: true,
      message: "Comment added",
    });
  }
});

exports.deleteComment = catchAsyncError(async (req, res, next) => {
  const post = await Post.findById(req.params.id);

  if (!post) {
    return next(new ErrorHandler("Post not found", 404));
  }

  // Checking If owner wants to delete

  if (post.owner.toString() === req.user._id.toString()) {
    if (req.body.commentId === undefined) {
      return next(new ErrorHandler("Comment Id Required", 400));
    }

    post.comments.forEach((item, index) => {
      if (item._id.toString() === req.body.commentId.toString()) {
        return post.comments.splice(index, 1);
      }
    });

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Selected Comment has deleted",
    });
  } else {
    post.comments.forEach((item, index) => {
      if (item.user.toString() === req.user._id.toString()) {
        return post.comments.splice(index, 1);
      }
    });

    await post.save();

    return res.status(200).json({
      success: true,
      message: "Your Comment has deleted",
    });
  }
});

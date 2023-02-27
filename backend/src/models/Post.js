const mongoose = require("mongoose");
const ObjectId = mongoose.Schema.Types.ObjectId;
const postSchema = new mongoose.Schema({
  caption: {
    type: String,
  },
  img: {
    type: String,
  },
  owner: {
    type: ObjectId,
    ref: "User",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  likes: [
    {
      type: ObjectId,
      ref: "User",
    },
  ],
  comments: [
    {
      user: {
        type: ObjectId,
        ref: "User",
      },
      comment: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);

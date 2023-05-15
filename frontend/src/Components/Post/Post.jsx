import React from "react";
import "Post.css";
import { Avatar, Typography } from "@mui/material";
import { Link } from "react-router-dom";

const Post = () => {
  return (
    <div>
      <div className="post">
        <div className="postHeader"></div>

        <img src={postImage} alt="post" />

        <div className="postDetails">
          <Avatar
            src={ownerImage}
            alt="User"
            sx={{
              height: "3vmax",
              width: "3vmax",
            }}
          />

          <Link to={`user/${ownerName}`}>
            <Typography fontWeight={700}>{ownerName}</Typography>
          </Link>
          <Typography
            fontWeight={100}
            color="rgba(0, 0, 0, 0.582)"
            style={{ alignSelf: "center" }}
          >
            {caption}
          </Typography>
        </div>
      </div>
    </div>
  );
};

export default Post;

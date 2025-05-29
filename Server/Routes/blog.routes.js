import { Router } from "express";
import { Post } from "../Models/post.models.js";
import { User } from "../Models/user.models.js";
import { Comment } from "../Models/comment.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

const postRoutes = Router();

postRoutes.get("/allpost", async (req, res) => {
  try {
    const allPost = await Post.find()
      .populate("author", "name avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name avatar",
        },
      })
      .populate("tagged", "name avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "All posts fetched successfully",
      allPost,
    });
  } catch (error) {
    console.error("Error fetching all posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.post("/create-post", async (req, res) => {
  const { title, content, id } = req.body;
  try {
    const post = new Post({ title, content, author: id, comments: [] });
    await post.save();

    if (!post) {
      res.status(404).json({
        message: "Error in creating post ",
      });
    }

    await User.findByIdAndUpdate(id, { $push: { posts: post._id } });

    res.status(200).json({
      message: "Post created Successfully!",
      post,
    });
  } catch (error) {
    console.log("Error in Creating Post: ", error);
    res.status(500).json({
      message: `Error in creating User: ${error.message}`,
    });
  }
});

postRoutes.delete("/delete-post/:id", async (req, res) => {
  const postId = req.params.id;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No token provided" });
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the post to check ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the logged-in user is the author
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden - You cannot delete someone else's post" });
    }

    // Delete post
    await Post.findByIdAndDelete(postId);

    // Remove post ID from user's posts array
    await User.findByIdAndUpdate(userId, {
      $pull: { posts: postId },
    });

    res.status(200).json({ message: "Post deleted successfully!" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.put("/update-post/:id", async (req, res) => {
  const postId = req.params.id;
  const { title, content } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No token provided" });
  }

  try {
    // Verify and decode token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    // Find the post to check ownership
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if the logged-in user is the author
    if (post.author.toString() !== userId) {
      return res
        .status(403)
        .json({ message: "Forbidden - You cannot update someone else's post" });
    }

    // Update post
    post.title = title || post.title;
    post.content = content || post.content;
    await post.save();

    res.status(200).json({
      message: "Post updated successfully!",
      post,
    });
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.get("/getmypost/:id", async (req, res) => {
  const userId = req.params.id;
  try {
    const posts = await Post.find({ author: userId });
    if (!posts || posts.length === 0) {
      return res.status(404).json({ message: "No posts found for this user" });
    }
    // console.log("User's posts: ", posts);
    res.status(200).json({
      message: "User's posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.post("/like-post/:id", async (req, res) => {
  const postId = req.params.id;
  const userId = req.body.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Check if the user has already liked the post
    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post already liked by user" });
    }
    // Add user ID to the likes array
    post.likes.push(userId);
    await post.save();
    res.status(200).json({ message: "Post liked successfully", post });
  } catch (error) {
    console.error("Error liking post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.post("/unlike-post/:id", async (req, res) => {
  const postId = req.params.id;
  const userId = req.body.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Check if the user has already liked the post
    if (!post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post not liked by user" });
    }

    // Remove user ID from the likes array
    post.likes.pull(userId);
    await post.save();

    res.status(200).json({ message: "Post unliked successfully", post });
  } catch (error) {
    console.error("Error unliking post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.post("/bookmark-post/:id", async (req, res) => {
  const postId = req.params.id;
  const userId = req.body.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Check if the user has already bookmarked the post
    if (post.bookmarks.includes(userId)) {
      return res
        .status(400)
        .json({ message: "Post already bookmarked by user" });
    }
    // Add user ID to the bookmarks array
    post.bookmarks.push(userId);
    await post.save();
    res.status(200).json({ message: "Post bookmarked successfully", post });
  } catch (error) {
    console.error("Error bookmarking post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// getting all bookmarked posts for a user with user id
postRoutes.get("/bookmarked-posts/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const posts = await Post.find({ bookmarks: userId })
      .populate("author", "name avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name avatar",
        },
      });

    res.status(200).json({
      message: "Bookmarked posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Error fetching bookmarked posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.post("/unbookmark-post/:id", async (req, res) => {
  const postId = req.params.id;
  const userId = req.body.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    // Check if the user has already bookmarked the post
    if (!post.bookmarks.includes(userId)) {
      return res.status(400).json({ message: "Post not bookmarked by user" });
    }
    // Remove user ID from the bookmarks array
    post.bookmarks.pull(userId);
    await post.save();
    res.status(200).json({ message: "Post unbookmarked successfully", post });
  } catch (error) {
    console.error("Error unbookmarking post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.post("/comment-post/:id", async (req, res) => {
  const postId = req.params.id;
  const { userId, comment } = req.body;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Create a new comment document
    const newComment = new Comment({
      post: postId,
      author: userId,
      content: comment,
    });

    // Save the comment to get an _id
    const savedComment = await newComment.save();

    // Push the comment's _id to the post's comments array
    post.comments.push(savedComment._id);
    await post.save();

    // Fetch the updated post with populated comments
    const updatedPost = await Post.findById(postId)
      .populate("author", "name avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name avatar",
        },
      });

    res.status(200).json({
      message: "Comment added successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error commenting on post:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.delete("/delete-comment/:postId/:commentId", async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    // Remove the comment from the comments collection
    await Comment.findByIdAndDelete(commentId);

    // Remove the reference from the post
    await Post.findByIdAndUpdate(postId, {
      $pull: { comments: commentId },
    });

    const updatedPost = await Post.findById(postId)
      .populate("author", "name avatar")
      .populate({
        path: "comments",
        populate: {
          path: "author",
          select: "name avatar",
        },
      });

    res.status(200).json({
      message: "Comment deleted successfully",
      post: updatedPost,
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.get("/post/:id", async (req, res) => {
  const postId = req.params.id;

  try {
    // Use populate to get author details
    const post = await Post.findById(postId)
      .populate("author", "name avatar") // Populate the main post author
      .populate("comments.author", "name avatar"); // Populate comment authors

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ message: "Post fetched successfully", post });
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.get("/get-tagged-posts/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const posts = await Post.find({ tagged: userId }).populate(
      "author",
      "name"
    );

    if (!posts || posts.length === 0) {
      return res
        .status(404)
        .json({ message: "No tagged posts found for this user" });
    }

    res.status(200).json({
      message: "Tagged posts fetched successfully",
      posts,
    });
  } catch (error) {
    console.error("Error fetching tagged posts:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

postRoutes.post("/comment-reply/:commentId", async (req, res) => {
  const { commentId } = req.params;
  const { userId, content } = req.body;

  try {
    // Find the comment to reply to
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    // Create a new reply object
    const reply = {
      user: userId,
      content,
      username: "", // This will be populated later
    };

    const updatedReply = await User.findById(userId)
      .select("name avatar")
      .then((user) => {
        reply.username = user.name;
        return reply;
      });

    // Push the reply to the comment's replies array
    comment.replies.push(updatedReply);
    await comment.save();

    // Populate the updated comment with author details
    const updatedComment = await Comment.findById(commentId)
      .populate("author", "name avatar")
      .populate("replies.user", "name avatar");

    res.status(200).json({
      message: "Reply added successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("Error adding reply to comment:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default postRoutes;

import { Router } from "express";
import { User } from "../Models/user.models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import "dotenv/config";

const appRoutes = Router();

appRoutes.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists with this email" });
    }

    // Hash password first
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, role });
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: user, // Return the user document, not user[0]
    });
  } catch (error) {
    console.error("Error in /register route:", error);
    res.status(500).json({ message: "Internal Server Error" }); // Return JSON response
  }
});

appRoutes.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.find({ email });
    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    const isPasswordValid = await bcrypt.compare(password, user[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }
    // Generate JWT token
    const token = jwt.sign(
      { id: user[0]._id, role: user[0].role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      }
    );
    console.log("Token: ", token);
    res
      .status(200)
      .json({ message: "Login successful", token: token, user: user[0] });
  } catch (error) {
    console.error("Error in /login route:", error);
    res.status(500).send("Internal Server Error");
  }
});

appRoutes.get("/get-currentuser-details", async (req, res) => {
  try {
    // More robust token extraction
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token format" });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ message: "Unauthorized: Token is missing" });
    }

    // Additional logging for debugging
    console.log("Token received:", token.substring(0, 10) + "...");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error in /get-currentuser-details route:", error);

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token",
        error: error.message,
      });
    }

    res.status(500).json({ message: "Internal Server Error" });
  }
});

appRoutes.post("/update-user-detail", async (req, res) => {
  const { id, name, email, password, role, bio } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const updates = {};

  if (name) updates.name = name;
  if (email) updates.email = email;
  if (bio) updates.bio = bio;

  if (role) updates.role = role;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(400).json({ message: "Token is not verified" });
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.password = hashedPassword;
    }

    const updatedUser = await User.findOneAndUpdate({ _id: id }, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not Found" });
    }
    res.status(200).json({
      message: "User Updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    console.log("Error in Updating User Detail: ", error);
    res.status(500).send("Internal server Error", error.message);
  }
});

appRoutes.put("/update-user/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Check if user is updating their own profile
    if (decoded.id !== req.params.id) {
      return res.status(403).json({
        message: "Unauthorized: You can only update your own profile",
      });
    }

    const { name, email, bio } = req.body;

    // Find and update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, bio },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

appRoutes.post("/change-password", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const { id, oldPassword, newPassword } = req.body;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log("Decoded", decoded);
    if (!decoded || decoded.id !== id) {
      return res.status(403).json({ message: "Forbidden: Token mismatch" });
    }

    const user = await User.findById(decoded.id); // Correct usage
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid current password" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    await user.save();

    res.status(200).json({
      message: "Password updated successfully!",
    });
  } catch (error) {
    console.error("Error in Change Password:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
});

appRoutes.post("/get-users", async (req, res) => {
  const { userIds } = req.body;

  if (!userIds || !Array.isArray(userIds)) {
    return res
      .status(400)
      .json({ message: "Invalid request, userIds array required" });
  }

  // Filter out any invalid IDs
  const validUserIds = userIds.filter((id) => id && typeof id === "string");

  try {
    const users = await User.find({
      _id: { $in: validUserIds },
    }).select("name email avatar");

    res.status(200).json({
      message: "Users fetched successfully",
      users,
    });
  } catch (error) {
    console.error("Error fetching users by IDs:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

appRoutes.post("/follow-user/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const userId = req.params.id;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.id;

    if (currentUserId === userId) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const userToFollow = await User.findById(userId);

    if (!currentUser || !userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already following
    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Add to following and followers
    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({
      message: "Successfully followed the user",
      following: currentUser.following,
      followers: userToFollow.followers,
    });
  } catch (error) {
    console.error("Error in follow-user route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

appRoutes.post("/unfollow-user/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  const userId = req.params.id;

  if (!token) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const currentUserId = decoded.id;

    if (currentUserId === userId) {
      return res.status(400).json({ message: "You cannot unfollow yourself" });
    }

    const currentUser = await User.findById(currentUserId);
    const userToUnfollow = await User.findById(userId);

    if (!currentUser || !userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if not following
    if (!currentUser.following.includes(userId)) {
      return res.status(400).json({ message: "Not following this user" });
    }

    // Remove from following and followers
    currentUser.following.pull(userId);
    userToUnfollow.followers.pull(currentUserId);

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({
      message: "Successfully unfollowed the user",
      following: currentUser.following,
      followers: userToUnfollow.followers,
    });
  } catch (error) {
    console.error("Error in unfollow-user route:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

export default appRoutes;

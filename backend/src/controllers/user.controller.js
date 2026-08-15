

import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { randomBytes, createHash } from "node:crypto";
import User from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateToken } from "../utils/generateToken.js";
import { sendVerificationEmail } from "../service/mail.service.js";
import { config } from "../config/config.js";
import imagekit from "../service/imagekit.js";

export const updatePasswordController = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (!oldPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "Old password, new password and confirm password are required",
    });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({
      success: false,
      message: "New password and confirm password do not match",
    });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({
      success: false,
      message: "New password must be at least 8 characters long",
    });
  }

  // Password schema me select:false hai,
  // isliye manually +password select karna zaroori hai.
  const user = await User.findById(userId).select("+password");

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

  if (!isOldPasswordCorrect) {
    return res.status(401).json({
      success: false,
      message: "Old password is incorrect",
    });
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);

  if (isSamePassword) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from old password",
    });
  }

  user.password = await bcrypt.hash(newPassword, 12);

  await user.save();

  return res.status(200).json({
    success: true,
    message: "Password updated successfully",
  });
});

export const updateAvatarController = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "Please select a profile image",
    });
  }

  const user = await User.findById(userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found",
    });
  }

  const uploadedImage = await imagekit.upload({
    file: req.file.buffer,
    fileName: `avatar-${userId}-${Date.now()}`,
    folder: "/lms-ai/avatars",
    useUniqueFileName: true,
    tags: ["avatar", `user-${userId}`],
  });

  const oldAvatarFileId = user.avatarFileId;

  user.avatarUrl = uploadedImage.url;
  user.avatarFileId = uploadedImage.fileId;

  await user.save();

  // Database update hone ke baad old image delete karo.
  if (oldAvatarFileId) {
    try {
      await imagekit.deleteFile(oldAvatarFileId);
    } catch (error) {
      console.error("Failed to delete old avatar:", error.message);
    }
  }

  return res.status(200).json({
    success: true,
    message: "Profile image updated successfully",
    avatar: {
      url: user.avatarUrl,
      fileId: user.avatarFileId,
    },
  });
});

export const updateMyProfileController = asyncHandler(
  async (req, res) => {
    const { fullName } = req.body;

    if (!fullName?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Full name is required",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          fullName: fullName.trim(),
        },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      },
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  },
);
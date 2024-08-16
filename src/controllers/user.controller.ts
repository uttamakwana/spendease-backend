import { User } from "../models/user.model.js";
import type {
  TLoginUserAPIRequestBody,
  TRegisterUserAPIRequestBody,
  TUserUpdateRequestBody,
} from "../types/user.type.js";
import { tryCatch } from "../utils/tryCatch.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import {
  deleteOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.util.js";
import { generateTokens } from "../utils/generateTokens.util.js";
import { cookieOptions } from "../constants/global.constant.js";

// 1. POST
// route: user/register
// PUBLIC
// does: Create/Register new user in the database
export const registerUser = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { name, email, password }: TRegisterUserAPIRequestBody = req.body;

  // Step 2. Check if anything is empty
  if (!name || !email || !password) {
    return next(new ApiError(400, "Name, email and password are required!"));
  }

  // Step 3. Check if user is already registered
  let user = await User.findOne({ email });
  if (user) {
    return next(new ApiError(400, "User already exists!"));
  }

  // Step 4. Get the avatar from multer storage
  const avatarLocalFilePath = req.file?.path;

  // Step 5. Upload image on the cloudinary
  const avatar = await uploadOnCloudinary(avatarLocalFilePath || "");
  if (!avatar) {
    return next(new ApiError(400, "Failed to upload user avatar!"));
  }

  // Step 6. Create an user
  user = await User.create({
    name,
    email: email.toLowerCase(),
    avatar: avatar.url,
    password,
  });

  // 7. Generate access token & refresh token
  const { accessToken, refreshToken } = await generateTokens(user._id);
  user = await User.findById(user._id).select("-password -refreshToken");

  // 8. Return a response and send cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, "User registered successfully!", { user }));
});

// 2. POST
// route: user/login
// PUBLIC
// does: Logs in the user
export const loginUser = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { email, password }: TLoginUserAPIRequestBody = req.body;

  // Step 2. Check if anything is empty
  if (!email || !password) {
    return next(new ApiError(400, "Email and password both are required!"));
  }

  // Step 3. Find user
  let user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(400, "Email or password is incorrect!"));
  }

  // Step 4. Check password is correct or not
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    return next(new ApiError(400, "Invalid credentials!"));
  }

  // Step 5. Generate access token & refresh token
  const { accessToken, refreshToken } = await generateTokens(user._id);
  user = await User.findById(user._id).select("-password -refreshToken");

  // Step 6. return a response and send cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, "User logged in successfully!", { user }));
});

// 3. POST
// route: user/logout
// PRIVATE
// does: logs out the user
export const logoutUser = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { _id } = req.user;
  // Step 2. Find user and remove refresh token
  await User.findByIdAndUpdate(
    _id,
    {
      // this remove the field from the document
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  // Step 3. Return a response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully!"));
});

// 4. GET
// route: user/list
// PRIVATE
// does: search all users
export const listUsers = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { _id } = req.user;

  // Step 2. Find all user and exclude current user
  const users = await User.find({ _id: { $ne: _id } }).select(
    "-password -refreshToken"
  );

  // Step 3. Return a response
  return res.status(200).json(
    new ApiResponse(200, "User retrieved successfully!", {
      users,
    })
  );
});

// 5. GET
// route: user/info
// PRIVATE
// does: get current user info
export const getUserInfo = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { _id } = req.user;
  // Step 2. Find the user info
  const user = await User.findById(_id).select("-password -refreshToken");
  // Step 3. Check if user present or not
  if (!user) {
    return next(new ApiError(400, "User not found!"));
  }
  // Step 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "User info retrieved successfully!", { user }));
});

// 6. PUT
// route: user/update
// PRIVATE
// does: update user
export const updateUser = tryCatch(async (req, res, next) => {
  // Step 1. Get req body type
  const { name, email, password }: TUserUpdateRequestBody = req.body;
  const { _id } = req.user;
  // Step 2. Check if the required data is present or not
  if (!name && !email && !password) {
    return next(new ApiError(400, "Data is required!"));
  }
  // Step 3. Update the data
  const user = await User.findById(_id);
  if (!user) {
    return next(new ApiError(400, "User not found!"));
  }
  if (name) user.name = name;
  if (email) user.email = email;
  if (password) user.password = password;

  // Step 4. Save the user
  await user?.save();

  // Step 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "User info updated successfully!", { user }));
});

// 7. PATCH
// route: user/update/avatar
// PRIVATE
// does: update only user avatar and delete the old one
export const updateUserAvatar = tryCatch(async (req, res, next) => {
  // Step 1. Get New Avatar Local File Path
  const avatarLocalFilePath = req.file?.path;
  const { _id } = req.user;
  if (!avatarLocalFilePath) {
    return next(new ApiError(400, "Please provide an avatar!"));
  }
  // Step 2. Find the user avatar if it is not present then upload new one and delete the old one if present
  let user = await User.findById(_id);
  if (user && user.avatar) {
    await deleteOnCloudinary(user.avatar);
  }

  const updatedAvatar = await uploadOnCloudinary(avatarLocalFilePath);
  if (!updatedAvatar?.url) {
    return next(new ApiError(400, "Couldn't get new updated avatar!"));
  }

  // Step 3. Update new avatar and delete the old one stored on cloudinary
  user = await User.findByIdAndUpdate(
    _id,
    {
      $set: { avatar: updatedAvatar.url },
    },
    { new: true }
  ).select("-password -refreshToken");

  // Step 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Avatar updated successfully!", { user }));
});

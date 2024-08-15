import { tryCatch } from "../utils/tryCatch.util.js";
import { User } from "../models/user.model.js";
import type {
  TUserAcceptRequestBody,
  TUserLoginRequestBody,
  TUserRegisterRequestBody,
  TUserRejectRequestBody,
  TUserSendRequestBody,
  TUserUpdateRequestBody,
} from "../types/user.type.js";
import {
  isAnythingEmpty,
  isEverythingEmpty,
} from "../utils/validation.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { uploadOnCloudinary } from "../utils/cloudinary.util.js";
import { generateTokens } from "../utils/generateTokens.util.js";
import type { ObjectId } from "mongoose";
import { cookieOptions } from "../constants/global.constant.js";

// 1. POST
// route: /api/v1/user/register
// PUBLIC
// does: Create a new user in the database
export const registerUser = tryCatch(async (req, res, next) => {
  // 1. get the data from user
  const { name, email, password }: TUserRegisterRequestBody = req.body;
  // 2. check if anything is empty
  if (isAnythingEmpty(name, email, password)) {
    return next(new ApiError(400, "All fields are required!"));
  }
  // 3. check if user is already registered
  let user = await User.findOne({ email });
  if (user) {
    return next(new ApiError(400, "User already exists!"));
  }
  // 4. upload image on the cloudinary
  const avatarLocalFilePath = req.file?.path;
  const avatar = await uploadOnCloudinary(avatarLocalFilePath || "");
  // 5. create an user
  user = await User.create({
    name,
    email: email.toLowerCase(),
    avatar: avatar?.url,
    password,
  });
  // 6. generate access & refresh token
  const { accessToken, refreshToken } = await generateTokens(user._id);

  user = await User.findById(user._id).select("-password -refreshToken");

  // 7. return a response and send cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, "User created successfully!", { user }));
});

// 2. POST
// route: /api/v1/user/login
// PUBLIC
// does: Basically logs in as a user
export const loginUser = tryCatch(async (req, res, next) => {
  // 1. Get user input data
  const { email, password }: TUserLoginRequestBody = req.body;
  // 2. Check if empty or not
  if (isAnythingEmpty(email, password)) {
    return next(new ApiError(400, "Email and password both are required!"));
  }
  // 3. Find user
  let user = await User.findOne({ email });
  if (!user) {
    return next(new ApiError(400, "User doesn't exist!"));
  }
  // 4. Check password is correct or not
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    return next(new ApiError(400, "Email or password is incorrect!"));
  }
  // 5. generate access & refresh token
  const { accessToken, refreshToken } = await generateTokens(user._id);

  user = await User.findById(user._id).select("-password -refreshToken");

  // 6. return a response and send cookies
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new ApiResponse(200, "User logged in successfully!", { user }));
});

// 3. POST
// route: /api/v1/user/logout
// PRIVATE
// does: logs out the user
export const logoutUser = tryCatch(async (req, res, next) => {
  // 1. Get user id from request
  const { _id } = req.user;
  // 2. Find user and remove refresh token
  await User.findByIdAndUpdate(
    _id,
    {
      // this remove the field from the document
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  // 3. Return a response
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully!"));
});

// 4. POST
// route: /api/v1/user/send-request
// PRIVATE
// does: send a friend request to the receiver user
export const sendFriendRequest = tryCatch(async (req, res, next) => {
  // 1. Get sender and receiver id
  const { receiverId }: TUserSendRequestBody = req.body;
  const { _id: senderId } = req.user;
  // 2. Check if required data is present or not
  if (isAnythingEmpty(senderId, receiverId)) {
    return next(new ApiError(400, "Sender and receiver id is required!"));
  }
  if (senderId.toString() === receiverId.toString()) {
    return next(new ApiError(400, "Please provide valid ids!"));
  }
  // 3. Find both users
  const [sender, receiver] = await Promise.all([
    await User.findById(senderId),
    await User.findById(receiverId),
  ]);
  if (!sender || !receiver) {
    return next(new ApiError(400, "Sender or receiver not found!"));
  }
  // 4. Check if receiver is already friend of sender
  const isReceiverAlreadyFriendOfSender = sender.friends.find(
    (friend) => friend.userId.toString() === receiverId.toString()
  );
  if (isReceiverAlreadyFriendOfSender) {
    return next(new ApiError(400, "User is already friend!"));
  }
  // 5. Check if sender is already friend of receiver
  const isSenderAlreadyFriendOfReceiver = receiver.friends.find(
    (friend) => friend.userId.toString() === senderId.toString()
  );
  if (isSenderAlreadyFriendOfReceiver) {
    return next(new ApiError(400, "User is already friend!"));
  }
  // 6. Check if receiver has already sent a friend request to sender
  const isReceiverIdExistInSenderFriendRequests = sender.friendRequests.find(
    (friendRequest) =>
      friendRequest.requestedBy.toString() === receiverId.toString()
  );
  if (isReceiverIdExistInSenderFriendRequests) {
    return next(
      new ApiError(400, "You already have pending request of receiver!")
    );
  }
  // 7. Check if sender has already sent a friend request to receiver
  const isSenderIdExistsInReceiverFriendRequests = receiver.friendRequests.find(
    (friendRequest) =>
      friendRequest.requestedBy.toString() === senderId.toString()
  );
  if (isSenderIdExistsInReceiverFriendRequests) {
    return next(new ApiError(400, "You have already sent a friend request!"));
  }
  receiver.friendRequests.push({ requestedBy: senderId });
  await receiver.save();
  // 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request send successfully!"));
});

// 5. POST
// route: /api/v1/user/accept-request
// PRIVATE
// does: accept receiver's friend request if not friends with each other
export const acceptFriendRequest = tryCatch(async (req, res, next) => {
  // 1. Get sender and receiver id
  const { receiverId }: TUserAcceptRequestBody = req.body;
  const { _id: senderId } = req.user;
  if (isAnythingEmpty(senderId, receiverId)) {
    return next(new ApiError(400, "Sender and receiver id is required!"));
  }
  if (senderId.toString() === receiverId.toString()) {
    return next(new ApiError(400, "Invalid id!"));
  }
  // 2. Find both users
  const [sender, receiver] = await Promise.all([
    await User.findById(senderId),
    await User.findById(receiverId),
  ]);
  if (!sender || !receiver) {
    return next(new ApiError(400, "Sender or receiver not found!"));
  }
  // 3. Check receiver is already friend of sender
  const isReceiverAlreadyFriendOfSender = sender.friends.find(
    (friend) => friend.userId.toString() === receiverId.toString()
  );
  if (isReceiverAlreadyFriendOfSender) {
    return next(new ApiError(400, "User is already friend!"));
  }
  // 4. Check sender is already friend of receiver
  const isSenderAlreadyFriendOfReceiver = receiver.friends.find(
    (friend) => friend.userId.toString() === senderId.toString()
  );
  if (isSenderAlreadyFriendOfReceiver) {
    return next(new ApiError(400, "User is already friend!"));
  }
  // 5. Check if receiver has sent you a friend request or not
  const isReceiverHasSentFriendRequest = sender.friendRequests.find(
    (friendRequest) =>
      friendRequest.requestedBy.toString() === receiverId.toString()
  );
  if (!isReceiverHasSentFriendRequest) {
    return next(new ApiError(400, "Couldn't accept friend request!"));
  }
  // 6. Add receiver in sender's friend list and sender in receiver's friend list and also remove receiver's request from the sender
  sender.friends.push({ userId: receiverId });
  sender.friendRequests = sender.friendRequests.filter(
    (friendRequest) =>
      friendRequest.requestedBy.toString() !== receiverId.toString()
  );
  receiver.friends.push({ userId: senderId });

  await Promise.all([await sender.save(), await receiver.save()]);

  // 5. Return a Response
  return res
    .status(200)
    .json(new ApiResponse(200, "Request accepted successfully!"));
});

// 6. GET
// route: /api/v1/user/list
// PRIVATE
// does: list all users
export const getAllUsers = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { _id } = req.user;
  // 2. Find the users and send a response
  const users = await User.find({ _id: { $ne: _id } })
    .select("-password -refreshToken")
    .exec();
  return res
    .status(200)
    .json(new ApiResponse(200, "Users retrieved successfully!", { users }));
});

// 7. GET
// route: /api/v1/user/request/list
// PRIVATE
// does: list all user's pending requests
export const getAllFriendRequests = tryCatch(async (req, res, next) => {
  // 1. Get user id
  const { _id } = req.user;
  // 2. Find user and populate requests if exists
  const user = await User.findById(_id).populate("friendRequests");
  if (!user) {
    return next(new ApiError(404, "User not found!"));
  }
  const friendRequestIds = user.friendRequests.map(
    (friendRequest) => friendRequest.requestedBy
  );
  // 3. Find all the users by using $in
  const users = await User.find({
    _id: {
      $in: friendRequestIds,
    },
  }).select("name email avatar");
  if (!users) {
    return next(new ApiError(400, "No users found!"));
  }
  // 4. Return a response
  return res.status(200).json(
    new ApiResponse(200, "User's requests retrieved successfully!", {
      users,
    })
  );
});

// 8. DELETE
// route: /api/v1/user/delete/request
// PRIVATE
// does: delete an existing friend request
export const rejectFriendRequest = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { requestedBy }: TUserRejectRequestBody = req.body;
  const { _id } = req.user;

  // 2. Check if the required data is present or not
  if (!requestedBy) {
    return next(new ApiError(400, "RequestedBy ID is required!"));
  }

  // 3. Find if request is already exist or not
  const user = await User.findById(_id);
  const isRequestExist = user?.friendRequests.find(
    (friendRequest) =>
      friendRequest.requestedBy.toString() === requestedBy.toString()
  );
  if (!isRequestExist || !user) {
    return next(new ApiError(400, "Request doesn't exist!"));
  }
  // 4. Delete the request
  user.friendRequests = user?.friendRequests.filter(
    (friendRequest) =>
      friendRequest.requestedBy.toString() !== requestedBy.toString()
  );
  await user.save();
  // 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Request rejected successfully!"));
});

// 9. GET
// route: /api/v1/user/friend/list
// PRIVATE
// does: list all users' friends
export const listFriends = tryCatch(async (req, res, next) => {
  // 1. Get user id
  const { _id } = req.user;

  // 2. Find user and populate friends if exists
  const user = await User.findById(_id).populate("friends");
  if (!user) {
    return next(new ApiError(404, "User not found!"));
  }
  const friendIds = user.friends;
  // if (!friends) {
  //   return next(new ApiError(400, "No friends found!"));
  // }

  // 3. Find all the friend of user by using $in
  const friends = await User.find({
    _id: {
      $in: friendIds,
    },
  }).select("_id");
  // if (!friends) {
  //   return next(new ApiError(400, "Couldn't find out friends!"));
  // }

  // 4. Return a response
  return res.status(200).json(
    new ApiResponse(200, "User's friends retrieved successfully!", {
      friends,
    })
  );
});

// 10. PUT
// route: /api/v1/user/update
// PRIVATE
// does: update user
export const updateUser = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { name, email, password }: TUserUpdateRequestBody = req.body;
  const { _id } = req.user;
  // 2. Check if the required data is present or not
  if (isEverythingEmpty(name, email, password)) {
    return next(new ApiError(400, "Data is required!"));
  }
  // 3. Update the data
  const user = await User.findById(_id);
  if (user) {
    if (name) user.name = name;
    if (email) user.email = email;
    if (password) user.password = password;
  }

  await user?.save();

  // 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "User updated successfully!", { user }));
});

import { Friend } from "../models/friend.model.js";
import { FriendRequest } from "../models/friendRequest.model.js";
import { User } from "../models/user.model.js";
import type {
  TAcceptFriendRequestAPIRequestBody,
  TRejectFriendRequestAPIRequestBody,
  TRemoveFriendRequestAPIRequestBody,
  TSendFriendRequestAPIRequestBody,
} from "../types/friendRequest.type.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";

// 1. POST
// route: friendRequest/send
// PRIVATE
// does: send a friend request
export const sendFriendRequest = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { receiverId }: TSendFriendRequestAPIRequestBody = req.body;
  const { _id: senderId } = req.user;

  // Step 2. Check for required things
  if (!receiverId) {
    return next(new ApiError(400, "ReceiverId is required!"));
  }

  // Step 3. _id and receiverId can't be equal
  if (senderId === receiverId) {
    return next(new ApiError(400, "Please provide valid ids!"));
  }

  // Step 4. Find the both users
  const [sender, receiver] = await Promise.all([
    await User.findById(senderId),
    await User.findById(receiverId),
  ]);
  if (!sender || !receiver) {
    return next(new ApiError(400, "Sender or receiver not found!"));
  }

  // Step 5. Validate friend request and friend status between users
  const isExistingFriendRequestOrFriendship =
    (await FriendRequest.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId },
      ],
    })) ||
    (await Friend.findOne({
      $or: [
        { user1: senderId, user2: receiverId },
        { user1: receiverId, user2: senderId },
      ],
    }));

  if (isExistingFriendRequestOrFriendship) {
    return next(
      new ApiError(
        400,
        "A friend request or friendship already exists between these users!"
      )
    );
  }

  // Step 6. Create a new friend request
  await FriendRequest.create({ senderId, receiverId });

  // Step 7. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request sent successfully!"));
});

// 2. POST
// route: friendRequest/accept
// PRIVATE
// does: accept a friend request
export const acceptFriendRequest = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  // ATTENTION: here we are treating the receiverId as senderId because whenever user is accepting someone's request the person who has sent the request become the sender of the request
  const { friendRequestSenderId }: TAcceptFriendRequestAPIRequestBody =
    req.body;
  const { _id: currentUserId } = req.user;
  // Step 2. Check for required data
  if (!friendRequestSenderId) {
    return next(new ApiError(400, "FriendRequestSenderId is required!"));
  }

  // Step 3. currentUserId and friendRequestSenderId can't be equal
  if (friendRequestSenderId === currentUserId) {
    return next(new ApiError(400, "Please provide valid ids!"));
  }

  // Step 4. Find the both users
  const [sender, receiver] = await Promise.all([
    await User.findById(currentUserId),
    await User.findById(friendRequestSenderId),
  ]);
  if (!sender || !receiver) {
    return next(new ApiError(400, "Sender or receiver not found!"));
  }
  // Step 5. Check for friendship status between users
  const isFriendshipExist = await Friend.findOne({
    $or: [
      { user1: currentUserId, user2: friendRequestSenderId },
      { user1: friendRequestSenderId, user2: friendRequestSenderId },
    ],
  });
  if (isFriendshipExist) {
    return next(new ApiError(400, "Friendship exist between users!"));
  }
  // Step 4. Create new friendship
  await Friend.create({ user1: currentUserId, user2: friendRequestSenderId });
  // Step 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request accepted successfully!"));
});

// 3. GET
// route: friendRequest/list
// PRIVATE
// does: list friend requests
export const listFriendRequests = tryCatch(async (req, res, next) => {
  // Step 1. Get req body type
  const { _id } = req.user;
  // Step 2. Find user id in friend request model as receiver id
  const friendRequests = await FriendRequest.find({ receiverId: _id });
  // Step 3. Return a response
  return res.status(200).json(
    new ApiResponse(200, "Friend request retrieved successfully!", {
      friendRequests,
    })
  );
});

// 4. DELETE
// route: friendRequest/reject
// PRIVATE
// does: reject friend requests
export const rejectFriendRequest = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { friendRequestId }: TRejectFriendRequestAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;

  // Step 2. Find the request and check if you have permission to delete
  const friendRequest = await FriendRequest.findOne({
    _id: friendRequestId,
    $or: [{ senderId: currentUserId, receiverId: currentUserId }],
  });
  if (!friendRequest) {
    return next(
      new ApiError(
        400,
        "Friend request not found or you don't have permission to remove it"
      )
    );
  }

  // Step 3. Delete friend request
  await FriendRequest.deleteOne({ _id: friendRequestId });

  // Step 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request rejected successfully!"));
});

// 5. DELETE
// route: friendRequest/remove
// PRIVATE
// does: remove friend requests
export const removeFriendRequest = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const {
    friendRequestId,
    friendRequestReceiverId,
  }: TRemoveFriendRequestAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;

  // Step 2. Find the request and check if you have permission to delete
  const friendRequest = await FriendRequest.findOne({
    _id: friendRequestId,
    senderId: currentUserId,
    receiverId: friendRequestReceiverId,
  });
  if (!friendRequest) {
    return next(new ApiError(400, "Friend request not found"));
  }

  // Step 3. Delete friend request
  await FriendRequest.deleteOne({ _id: friendRequestId });

  // Step 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Friend request removed successfully!"));
});

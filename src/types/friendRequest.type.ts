import type { Document, ObjectId } from "mongoose";

// FRIEND REQUEST SCHEMA TYPE
export type TFriendRequestSchema = {
  senderId: ObjectId;
  receiverId: ObjectId;
} & Document;

// FRIEND REQUEST MODEL TYPE
export type TFriendRequestModel = TFriendRequestSchema;

// API REQUEST TYPE
// Send Friend Request
export type TSendFriendRequestAPIRequestBody = {
  receiverId: ObjectId;
};

// Accept Friend Request
export type TAcceptFriendRequestAPIRequestBody = {
  friendRequestSenderId: ObjectId;
};

// Reject Friend Request
export type TRejectFriendRequestAPIRequestBody = {
  friendRequestId: ObjectId;
};

// Remove Friend Request
export type TRemoveFriendRequestAPIRequestBody = {
  friendRequestId: ObjectId;
  friendRequestReceiverId: ObjectId;
};

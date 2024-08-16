import type { Document, ObjectId } from "mongoose";

export type TFriendRequestSchema = {
  senderId: ObjectId;
  receiverId: ObjectId;
} & Document;

export type TFriendRequestModel = TFriendRequestSchema;

export type TSendFriendRequestAPIRequestBody = {
  receiverId: ObjectId;
};

export type TAcceptFriendRequestAPIRequestBody = {
  friendRequestSenderId: ObjectId;
};

export type TRejectFriendRequestAPIRequestBody = {
  friendRequestId: ObjectId;
};

export type TRemoveFriendRequestAPIRequestBody = {
  friendRequestId: ObjectId;
  friendRequestReceiverId: ObjectId;
};

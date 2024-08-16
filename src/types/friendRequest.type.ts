import type { Document, ObjectId } from "mongoose";

export type TFriendRequestSchema = {
  senderId: ObjectId;
  receiverId: ObjectId;
} & Document;

export type TFriendRequestModel = TFriendRequestSchema;

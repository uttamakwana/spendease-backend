import mongoose from "mongoose";
import type {
  TFriendRequestModel,
  TFriendRequestSchema,
} from "../types/friendRequest.type.js";
import { FriendRequestModel, UserModel } from "../constants/global.constant.js";

// FRIEND REQUEST SCHEMA
const FriendRequestSchema = new mongoose.Schema<TFriendRequestSchema>(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
    },
  },
  { timestamps: true }
);

// FRIEND REQUEST MODEL
export const FriendRequest = mongoose.model<TFriendRequestModel>(
  FriendRequestModel,
  FriendRequestSchema
);

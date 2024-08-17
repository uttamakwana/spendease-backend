import mongoose from "mongoose";
import type { TFriendModel, TFriendSchema } from "../types/friend.type.js";
import { FriendModel, UserModel } from "../constants/global.constant.js";

// FRIEND SCHEMA
const FriendSchema = new mongoose.Schema<TFriendSchema>(
  {
    user1: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
    user2: { type: mongoose.Schema.Types.ObjectId, ref: UserModel },
  },
  { timestamps: true }
);

// FRIEND MODEL
export const Friend = mongoose.model<TFriendModel>(FriendModel, FriendSchema);

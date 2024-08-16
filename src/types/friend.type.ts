import type { Document, ObjectId } from "mongoose";

export type TFriendSchema = {
  user1: ObjectId;
  user2: ObjectId;
} & Document;

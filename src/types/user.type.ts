import type { Document, ObjectId } from "mongoose";

export type TUserSchema = {
  _id: ObjectId;
  name: string;
  email: string;
  avatar: string;
  password: string;
  friendRequests: Array<TFriendRequestsSchema>;
  settleRequests: Array<TSettleExpenseRequestsSchema>;
  friends: Array<TFriendSchema>;
  refreshToken?: string;
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  isPasswordCorrect: (password: TUserSchema["password"]) => Promise<boolean>;
} & Document;

export type TFriendRequestsSchema = {
  requestedBy: ObjectId;
} & Partial<Document>;

export type TFriendSchema = {
  userId: ObjectId;
} & Partial<Document>;

export type TSettleExpenseRequestsSchema = {
  requestedBy: ObjectId;
  expenseId: ObjectId;
  isSettleAll: boolean;
} & Partial<Document>;

export type TUserModel = TUserSchema;

export type TUserId = ObjectId;

export type TUserRegisterRequestBody = Pick<
  TUserSchema,
  "name" | "email" | "avatar" | "password"
>;

export type TUserLoginRequestBody = Pick<TUserSchema, "email" | "password">;

export type TUserSendRequestBody = {
  receiverId: ObjectId;
};

export type TUserAcceptRequestBody = {
  receiverId: ObjectId;
};

export type TUserRejectRequestBody = {
  requestedBy: ObjectId;
};

export type TUserUpdateRequestBody = Pick<
  TUserSchema,
  "name" | "email" | "password"
>;

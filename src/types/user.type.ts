import type { Document, ObjectId } from "mongoose";

// SCHEMA TYPE
export type TUserSchema = {
  _id: ObjectId;
  name: string;
  email: string;
  avatar: string;
  password: string;
  refreshToken?: string;
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  isPasswordCorrect: (password: TUserSchema["password"]) => Promise<boolean>;
} & Document;

// MODEL TYPE
export type TUserModel = TUserSchema;

// API REQUEST TYPE
// Register User
export type TRegisterUserAPIRequestBody = Pick<
  TUserSchema,
  "name" | "email" | "avatar" | "password"
>;

// Login User
export type TLoginUserAPIRequestBody = Pick<TUserSchema, "email" | "password">;

export type TUserUpdateAPIRequestBody = Partial<
  Pick<TUserSchema, "name" | "email" | "password">
>;

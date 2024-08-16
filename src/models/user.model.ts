import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt, { type Secret } from "jsonwebtoken";
import { SALT_ROUND, UserModel } from "../constants/global.constant.js";
import { ApiError } from "../utils/errorHandling.util.js";
import type { TUserModel, TUserSchema } from "../types/user.type.js";

// USER SCHEMA
const UserSchema = new mongoose.Schema<TUserSchema>(
  {
    name: {
      type: String,
      required: [true, "Name is required!"],
      trim: true,
      min: [2, "Name requires at least 2 characters!"],
      max: [30, "Name can't contain more than 30 characters!"],
    },
    email: {
      type: String,
      required: [true, "Email is required!"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    avatar: {
      type: String,
      required: [true, "Avatar is required!"],
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
      min: [5, "Password requires at least 5 characters!"],
      max: [20, "Password can't contain more than 20 characters!"],
    },
    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// CUSTOM USER SCHEMA MIDDLEWARE
// does: generate hashed password | 1. User is created for the first time | 2. Password is modified/updated
UserSchema.pre<TUserSchema>("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRound = await bcrypt.genSalt(SALT_ROUND);
  this.password = await bcrypt.hash(this.password, saltRound);
  next();
});

// CUSTOM USER SCHEMA METHODS
// does: decrypt the encrypted password and compare with the user input password
UserSchema.methods.isPasswordCorrect = async function (
  password: TUserSchema["password"]
) {
  return await bcrypt.compare(password, this.password);
};

// does: generate access token for user
UserSchema.methods.generateAccessToken = function () {
  const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
  const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRY;

  if (!accessTokenExpiry || !accessTokenSecret)
    throw new ApiError(500, "Failed to generate access token!");

  return jwt.sign(
    {
      _id: this._id,
    },
    accessTokenSecret as Secret,
    {
      expiresIn: accessTokenExpiry,
    }
  );
};

// does: generate refresh token for user
UserSchema.methods.generateRefreshToken = function () {
  const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
  const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRY;

  if (!refreshTokenSecret || !refreshTokenExpiry) {
    throw new ApiError(500, "Failed to generate refresh token!");
  }
  return jwt.sign(
    {
      _id: this._id,
    },
    refreshTokenSecret as Secret,
    {
      expiresIn: refreshTokenExpiry,
    }
  );
};

// USER MODEL
export const User = mongoose.model<TUserModel>(UserModel, UserSchema);

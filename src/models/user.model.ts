import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt, { type Secret } from "jsonwebtoken";
import { SALT_ROUND } from "../constants/global.constant.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { isAnythingEmpty } from "../utils/validation.util.js";
import type {
  TFriendRequestsSchema,
  TFriendSchema,
  TSettleExpenseRequestsSchema,
  TUserModel,
  TUserSchema,
} from "../types/user.type.js";

// Friend Requests Schema
const FriendRequestsSchema = new mongoose.Schema<TFriendRequestsSchema>(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Settle Expense Requests Schema
const SettleExpenseRequestsSchema =
  new mongoose.Schema<TSettleExpenseRequestsSchema>(
    {
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      expenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Expense",
      },
      isSettleAll: {
        type: Boolean,
        required: [true, "isSettleAll is required!"],
      },
    },
    { timestamps: true }
  );

// Friends Schema
const FriendSchema = new mongoose.Schema<TFriendSchema>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// User Schema
const UserSchema = new mongoose.Schema<TUserSchema>(
  {
    name: {
      type: String,
      required: [true, "Name is required!"],
      trim: true,
      min: [3, "Name requires at least 3 characters!"],
      max: [20, "Name doesn't required more than 20 characters!"],
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
      max: [20, "Password doesn't required more than 20 characters!"],
    },
    friendRequests: [FriendRequestsSchema],
    settleRequests: [SettleExpenseRequestsSchema],
    friends: [FriendSchema],
    refreshToken: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// custom user schema middleware
// does: whenever user is creating/password is updating, it will create a new hashed password and will save the hashed password
UserSchema.pre<TUserSchema>("save", async function (next) {
  if (!this.isModified("password")) return next();

  const saltRound = await bcrypt.genSalt(SALT_ROUND);
  this.password = await bcrypt.hash(this.password, saltRound);
  next();
});

// custom user schema methods
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

  if (isAnythingEmpty(accessTokenSecret, accessTokenExpiry))
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

  if (isAnythingEmpty(refreshTokenSecret, refreshTokenExpiry)) {
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

export const User = mongoose.model<TUserModel>("User", UserSchema);

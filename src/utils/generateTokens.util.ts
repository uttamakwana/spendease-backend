import type { ObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "./errorHandling.util.js";

// does: utility for generating both access token and refresh token
export const generateTokens = async (userId: ObjectId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user?.generateAccessToken();
    const refreshToken = user?.generateRefreshToken();

    if (!refreshToken || !user || !accessToken) {
      throw new ApiError(
        500,
        "Failed to generate access token and refresh token!"
      );
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access token & refresh token!"
    );
  }
};

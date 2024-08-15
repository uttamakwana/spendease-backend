import { User } from "../models/user.model.js";
import { ApiError } from "./errorHandling.util.js";
import type { TUserId } from "../types/user.type.js";

// does: utility for generating both access token and refresh token
export const generateTokens = async (userId: TUserId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user?.generateAccessToken();
    const refreshToken = user?.generateRefreshToken();

    if (!refreshToken || !user) {
      throw new ApiError(
        500,
        "Can't generate to access token and refresh token!"
      );
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access & refresh tokens."
    );
  }
};

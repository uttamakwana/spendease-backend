import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";
import type { AuthenticatedRequest } from "../types/global.type.js";

// does: to verify user is already logged in or not
export const isAuth = tryCatch(async (req, _, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "Unauthorized request!");
  }

  let decodedToken: JwtPayload | string;
  try {
    decodedToken = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as Secret
    ) as JwtPayload;
  } catch (error) {
    throw new ApiError(401, "Invalid access token!");
  }

  const user = await User.findById(decodedToken?._id).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(401, "Invalid access token!");
  }

  req.user = user;
  next();
});

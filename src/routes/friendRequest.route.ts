import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  acceptFriendRequest,
  listFriendRequests,
  rejectFriendRequest,
  removeFriendRequest,
  sendFriendRequest,
} from "../controllers/friendRequests.controller.js";

// CONSTANTS
export const friendRequestRouter = Router();

// ROUTES
// 1. Create/Send Friend Request | PRIVATE
friendRequestRouter.route("/send").post(isAuth, sendFriendRequest);
// 2. Accept Friend Request | PRIVATE
friendRequestRouter.route("/accept").post(isAuth, acceptFriendRequest);
// 3. List Friend Requests | PRIVATE
friendRequestRouter.route("/list").get(isAuth, listFriendRequests);
// 4. Reject Friend Request | PRIVATE
friendRequestRouter.route("/reject").delete(isAuth, rejectFriendRequest);
// 5. Remove Friend Request | PRIVATE
friendRequestRouter.route("/remove").delete(isAuth, removeFriendRequest);

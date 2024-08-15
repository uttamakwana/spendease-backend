import { Router } from "express";
import {
  acceptFriendRequest,
  listFriends,
  getAllFriendRequests,
  getAllUsers,
  loginUser,
  logoutUser,
  registerUser,
  sendFriendRequest,
  rejectFriendRequest,
  updateUser,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";

// constants
export const userRouter = Router();

// routes
// 1. User Registration (Public)
userRouter.route("/register").post(upload.single("avatar"), registerUser);
// 2. User Login (Public)
userRouter.route("/login").post(loginUser);
// 3. User Logout (Private)
userRouter.route("/logout").post(isAuth, logoutUser);
// 4. User Send Request (Private)
userRouter.route("/send-request").post(isAuth, sendFriendRequest);
// 5. User Accept Request (Private)
userRouter.route("/accept-request").post(isAuth, acceptFriendRequest);
// 6. User Accept Request (Private)
userRouter.route("/reject-request").delete(isAuth, rejectFriendRequest);
// 7. User List
userRouter.route("/list").get(isAuth, getAllUsers);
// 8. User List by Requests
userRouter.route("/request/list").get(isAuth, getAllFriendRequests);
// 9. User List by Friends
userRouter.route("/friend/list").get(isAuth, listFriends);
// 10. User Update
userRouter.route("/update").put(isAuth, updateUser);

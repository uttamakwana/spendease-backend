import { Router } from "express";
import {
  acceptFriendRequest,
  listFriends,
  listFriendRequests,
  listUsers,
  loginUser,
  logoutUser,
  registerUser,
  sendFriendRequest,
  rejectFriendRequest,
  updateUser,
  updateUserAvatar,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";

// constants
export const userRouter = Router();

// user routes
// 1. Register (PUBLIC)
userRouter.route("/register").post(upload.single("avatar"), registerUser);
// 2. Login (PUBLIC)
userRouter.route("/login").post(loginUser);
// 3. Logout (PRIVATE)
userRouter.route("/logout").post(isAuth, logoutUser);
// 4. Send Request (PRIVATE)
userRouter.route("/request/send").post(isAuth, sendFriendRequest);
// 5. Accept Request (PRIVATE)
userRouter.route("/request/accept").post(isAuth, acceptFriendRequest);
// 6. Reject/Delete/Remove Request (PRIVATE)
userRouter.route("/request/reject").delete(isAuth, rejectFriendRequest);
// 7. List Users (PRIVATE)
userRouter.route("/list").get(isAuth, listUsers);
// 8. List Friend Requests (PRIVATE)
userRouter.route("/list/request").get(isAuth, listFriendRequests);
// 9. List Friends (PRIVATE)
userRouter.route("/list/friend").get(isAuth, listFriends);
// 10. Update (PRIVATE)
userRouter.route("/update").put(isAuth, updateUser);
// 10. Update Avatar (PRIVATE)
userRouter
  .route("/update/avatar")
  .patch(isAuth, upload.single("avatar"), updateUserAvatar);

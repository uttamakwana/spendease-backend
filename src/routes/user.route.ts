import { Router } from "express";
import {
  listUsers,
  loginUser,
  logoutUser,
  registerUser,
  updateUser,
  updateUserAvatar,
  getUserInfo,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { isAuth } from "../middlewares/auth.middleware.js";

// CONSTANTS
export const userRouter = Router();

// USER ROUTES
// 1. Register | PUBLIC
userRouter.route("/register").post(upload.single("avatar"), registerUser);
// 2. Login | PUBLIC
userRouter.route("/login").post(loginUser);
// 3. Logout | PRIVATE
userRouter.route("/logout").post(isAuth, logoutUser);
// 4. List Users | PRIVATE
userRouter.route("/list").get(isAuth, listUsers);
// 5. List User Info | PRIVATE
userRouter.route("/info").get(isAuth, getUserInfo);
// 6. Update | PRIVATE
userRouter.route("/update").put(isAuth, updateUser);
// 7. Update Avatar | PRIVATE
userRouter
  .route("/update/avatar")
  .patch(isAuth, upload.single("avatar"), updateUserAvatar);

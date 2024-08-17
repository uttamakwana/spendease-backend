import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  listFriends,
  listIndividualFriendExpenses,
} from "../controllers/friend.controller.js";

// CONSTANTS
export const friendRouter = Router();

// FRIEND ROUTES
// 1. List Friend
friendRouter.route("/list").get(isAuth, listFriends);
// 2. List Individual Friend Expenses
friendRouter.route("/individual").get(isAuth, listIndividualFriendExpenses);

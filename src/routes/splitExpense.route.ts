import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import {
  createSplitExpense,
  deleteSplitExpense,
  updateSplitExpense,
} from "../controllers/splitExpense.controller.js";

// CONSTANTS
export const splitExpenseRouter = Router();

// ROUTES
// 1. Create Split Expense | PRIVATE
splitExpenseRouter.route("/create").post(isAuth, createSplitExpense);
// 2. Update Split Expense | PRIVATE
splitExpenseRouter.route("/update").put(isAuth, updateSplitExpense);
// 3. Delete Split Expense | PRIVATE
splitExpenseRouter.route("/delete").delete(isAuth, deleteSplitExpense);

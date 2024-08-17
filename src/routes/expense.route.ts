import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  listExpenses,
  updateExpense,
} from "../controllers/expense.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

// CONSTANTS
export const expenseRouter = Router();

// ROUTES
// 1. Create Personal Expense | PRIVATE
expenseRouter.route("/create").post(isAuth, createExpense);
// 3. Update Personal Expense | PRIVATE
expenseRouter.route("/update").put(isAuth, updateExpense);
// 5. Delete Expense | PRIVATE
expenseRouter.route("/delete").delete(isAuth, deleteExpense);
// 6. Get All Expense | PRIVATE
expenseRouter.route("/list").get(isAuth, listExpenses);

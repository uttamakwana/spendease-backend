import { Router } from "express";
import {
  createPersonalExpense,
  createSplitExpense,
  deleteExpense,
  getAllExpenses,
  getAllExpensesOfFriend,
  settleAllExpenses,
  updatePersonalExpense,
  updateSplitExpense,
} from "../controllers/expense.controller.js";
import { isAuth } from "../middlewares/auth.middleware.js";

// constants
export const expenseRouter = Router();

// routes
// 1. Create Personal Expense (Private)
expenseRouter.route("/create/personal").post(isAuth, createPersonalExpense);
// 2. Create Split Expense (Private)
expenseRouter.route("/create/split").post(isAuth, createSplitExpense);
// 3. Update Personal Expense (Private)
expenseRouter.route("/update/personal").put(isAuth, updatePersonalExpense);
// 4. Update Split Expense (Private)
expenseRouter.route("/update/split").put(isAuth, updateSplitExpense);
// 5. Delete Expense (Private)
expenseRouter.route("/delete").delete(isAuth, deleteExpense);
// 6. Get All Expense (Private)
expenseRouter.route("/all").get(isAuth, getAllExpenses);
// 7. Get All Expense of Friend (Private)
expenseRouter.route("/friend/list").get(isAuth, getAllExpensesOfFriend);
// 8. Settle All Expense of Friend (Private)
expenseRouter.route("/settle/all").post(isAuth, settleAllExpenses);

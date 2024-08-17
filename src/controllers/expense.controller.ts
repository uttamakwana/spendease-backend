import { Expense } from "../models/expense.model.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";
import { isValidCategory } from "../utils/validation.util.js";
import type {
  TCreateExpenseAPIRequestBody,
  TDeleteExpenseAPIRequestBody,
  TListExpensesAnalysis,
  TUpdateExpenseAPIRequestBody,
} from "../types/expense.type.js";

// 1. POST
// route: expense/create
// PRIVATE
// does: create an expense for a user
export const createExpense = tryCatch(async (req, res, next) => {
  // Step 1. Get req body type
  const { amount, description, category }: TCreateExpenseAPIRequestBody =
    req.body;
  const { _id } = req.user;

  // Step 2. Check if required fields are present or not
  if (!amount && !description) {
    return next(new ApiError(400, "Amount and description are required!"));
  }
  if (category && !isValidCategory(category)) {
    return next(new ApiError(400, "Provide valid category!"));
  }

  // Step 3. Create an expense
  await Expense.create({
    createdBy: _id,
    amount: Number(amount),
    description,
    category,
    isPersonal: true,
    isSettled: true,
  });
  // Step 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense created successfully!"));
});

// 2. PUT
// route: expense/update
// PRIVATE
// does: update personal expense
export const updateExpense = tryCatch(async (req, res, next) => {
  // 1. Get req body type
  const {
    expenseId,
    amount,
    description,
    category,
  }: TUpdateExpenseAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;

  // 2. Check if everything necessary is present
  if (!expenseId) {
    return next(new ApiError(400, "ExpenseId is required!"));
  }
  if (!amount && !description && !category) {
    return next(
      new ApiError(
        400,
        "Provide amount, description or category to update expense!"
      )
    );
  }

  // 3. Find expense
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    return next(new ApiError(400, "Expense not found!"));
  }
  // 4. Check if the expense is created by current user
  if (expense.createdBy.toString() !== currentUserId.toString()) {
    return next(
      new ApiError(400, "You are not authorized to update this expense!")
    );
  }
  if (amount) expense.amount = amount;
  if (description) expense.description = description;
  if (category) expense.category = category;

  // 4. Save updated expense
  await expense.save();

  // 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense updated successfully!"));
});

// 3. DELETE
// route: expense/delete
// PRIVATE
// does: delete split expense between user's friend
export const deleteExpense = tryCatch(async (req, res, next) => {
  // Step 1. Get the data
  const { expenseId }: TDeleteExpenseAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;
  // Step 2. Check if the required data is present or not
  if (!expenseId) {
    return next(new ApiError(400, "ExpenseId is required!"));
  }
  // Step 3. Find an expense & delete
  const expense = await Expense.findOne({
    _id: expenseId,
    createdBy: currentUserId,
  });
  if (!expense) {
    return next(new ApiError(400, "Expense not found!"));
  }
  await expense.deleteOne({ _id: expenseId });
  // Step 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense deleted successfully!"));
});

// 4. GET
// route: api/v1/expense/update/split
// PRIVATE
// does: get all expenses of users
export const listExpenses = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { _id: currentUserId } = req.user;
  // 2. Check if the valid data is present or not
  const expenses = await Expense.find({ createdBy: currentUserId });
  // 3. Return a response
  // ATTENTION: We can send personal and splitted expenses from here also
  // const personalExpenses = expenses.filter((expense) => expense.isPersonal);
  // const splittedExpenses = expenses.filter((expense) => !expense.isPersonal);
  const analysis: TListExpensesAnalysis = expenses.reduce(
    (acc, currentValue) => {
      if (currentValue.isPersonal) {
        acc.count.personal += 1;
        acc.amount.personal += currentValue.amount;
      } else {
        acc.count.split += 1;
        acc.amount.split +=
          currentValue.amount - currentValue.totalSplittedAmount;
      }
      return acc;
    },
    {
      count: {
        personal: 0,
        split: 0,
        total: 0,
      },
      amount: {
        personal: 0,
        split: 0,
        total: 0,
      },
    }
  );

  analysis.count.total = analysis.count.personal + analysis.count.split;
  analysis.amount.total = analysis.amount.personal + analysis.amount.split;

  return res.status(200).json(
    new ApiResponse(200, "Expenses retrieved successfully!", {
      expenses,
      analysis,
    })
  );
});

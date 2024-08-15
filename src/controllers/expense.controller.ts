import { Expense } from "../models/expense.model.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";
import {
  isAnythingEmpty,
  isEverythingEmpty,
  isValidCategory,
} from "../utils/validation.util.js";
import type {
  TCreatePersonalExpenseRequestBody,
  TCreateSplitExpenseRequestBody,
  TDeleteExpenseRequestBody,
  TGetAllExpensesOfFriendRequestBody,
  TSettleAllExpensesOfFriendRequestBody,
  TUpdatePersonalExpenseRequestBody,
  TUpdateSplitExpenseRequestBody,
} from "../types/expense.type.js";
import { Types, type ObjectId } from "mongoose";
import { getFriendExpenses } from "../utils/expense.util.js";

// 1. POST
// route: api/v1/expense/create/personal
// PRIVATE
// does: create an expense for a user
export const createPersonalExpense = tryCatch(async (req, res, next) => {
  // 1. Get data from req
  const { amount, description, category }: TCreatePersonalExpenseRequestBody =
    req.body;
  const { _id } = req.user;

  // 2. Check if required fields are present or not
  if (isAnythingEmpty(_id, amount, description)) {
    return next(new ApiError(400, "All fields are required!"));
  }
  if (category && !isValidCategory(category)) {
    return next(new ApiError(400, "Provide valid category!"));
  }

  // 3. Create an expense
  await Expense.create({
    userId: _id,
    amount: Number(amount),
    description,
    category,
    isPersonal: true,
    isSettled: true,
  });
  // 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense created successfully!"));
});

// 2. POST
// route: api/v1/expense/create/split
// PRIVATE
// does: split an expense between a user's friend
export const createSplitExpense = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const {
    amount,
    description,
    category,
    splits,
  }: TCreateSplitExpenseRequestBody = req.body;
  const { _id } = req.user;
  // 2. Check if required things are present in valid format or not
  if (isAnythingEmpty(amount, description, category, splits)) {
    return next(new ApiError(400, "All fields are required!"));
  }
  if (category && !isValidCategory(category)) {
    return next(new ApiError(400, "Provide valid category!"));
  }
  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    return next(new ApiError(400, "Splitted data is required!"));
  }
  // 3. Split an expense
  // check if our id is contained here or not
  const userIdFoundInSplits = splits.find(
    (e) => e.userId.toString() === (_id as ObjectId).toString()
  );
  if (userIdFoundInSplits) {
    return next(new ApiError(400, "Provide valid ids!"));
  }
  // check if the splitted amount is greater than the original amount
  const splittedAmount = splits.reduce(
    (total, currentValue) => total + currentValue.amount,
    0
  );
  // ATTENTION: right now we are keeping the splitted amount as zero
  //   if (splittedAmount === 0) {
  //     return next(new ApiError(400, "Splitted amount can't be zero!"));
  //   }
  if (splittedAmount > amount) {
    return next(
      new ApiError(
        400,
        "Splitted amount can't be greater than the original amount!"
      )
    );
  }
  await Expense.create({
    userId: req.user._id,
    amount,
    description,
    category,
    splits,
    isPersonal: false,
  });
  // 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense splitted successfully!"));
});

// 3. PUT
// route: api/v1/expense/update/personal
// PRIVATE
// does: update personal expense
export const updatePersonalExpense = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const {
    expenseId,
    amount,
    description,
    category,
  }: TUpdatePersonalExpenseRequestBody = req.body;

  // 2. Check if everything necessary is present
  if (!expenseId) {
    return next(new ApiError(400, "ExpenseId is required!"));
  }
  if (isEverythingEmpty(amount, description, category)) {
    return next(
      new ApiError(
        400,
        "Provide amount, description or category to update expense!"
      )
    );
  }

  // 3. Create a object that should be updated instead of updating everything which is not available
  const updatedData: Partial<TUpdatePersonalExpenseRequestBody> = {};
  if (amount !== undefined) {
    updatedData.amount = amount;
  }
  if (description !== undefined) {
    updatedData.description = description;
  }
  if (category !== undefined) {
    updatedData.category = category;
  }
  if (Object.keys(updatedData).length === 0) {
    return next(new ApiError(400, "No valid fields provided for update!"));
  }

  // 4. Find and update an expense
  const expense = await Expense.findByIdAndUpdate(expenseId, {
    $set: {
      amount: updatedData.amount,
      description: updatedData.description,
      category: updatedData.category,
    },
  });
  if (!expense) {
    return next(new ApiError(400, "No expense found!"));
  }
  // 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense updated successfully!"));
});

// 4. PUT
// route: api/v1/expense/update/split
// PRIVATE
// does: update split expense between user's friend
export const updateSplitExpense = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const {
    expenseId,
    amount,
    category,
    description,
    splits,
  }: TUpdateSplitExpenseRequestBody = req.body;
  const { _id } = req.user;
  // 2. Check if required data is present or not
  if (!expenseId) {
    return next(new ApiError(400, "ExpenseId is required!"));
  }
  if (isEverythingEmpty(amount, description, category, splits)) {
    return next(
      new ApiError(
        400,
        "Provide amount, description, category or splits to update expense!"
      )
    );
  }
  // 3. Create the updatedData
  const updatedData: Partial<TUpdateSplitExpenseRequestBody> = {};
  if (amount !== undefined) updatedData.amount = amount;
  if (description !== undefined) updatedData.description = description;
  if (category !== undefined) updatedData.category = category;
  if (splits !== undefined) updatedData.splits = splits;

  // checking if the splitted amount between friends is greater than actual amount or not
  // check if splits contains your id
  const userIdInSplits = updatedData.splits?.find(
    (e) => e.userId.toString() === (_id as ObjectId).toString()
  );

  if (userIdInSplits) {
    return next(new ApiError(400, "Please provide valid ids!"));
  }

  const splittedAmount =
    updatedData.splits?.reduce(
      (total, currentValue) => total + currentValue.amount,
      0
    ) || 0;

  if (
    splittedAmount &&
    updatedData?.amount &&
    splittedAmount > updatedData.amount
  ) {
    return next(
      new ApiError(
        400,
        "Splitted amount can't be greater than the original amount"
      )
    );
  }
  // 4. Find expense and update
  const expense = await Expense.findByIdAndUpdate(
    expenseId,
    {
      $set: {
        amount: updatedData.amount,
        description: updatedData.description,
        category: updatedData.category,
        splits: updatedData.splits,
      },
    },
    { runValidators: true }
  );
  if (!expense) {
    return next(new ApiError(400, "Expense not found!"));
  }
  // 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense updated successfully!"));
});

// 5. DELETE
// route: api/v1/expense/delete
// PRIVATE
// does: delete split expense between user's friend
export const deleteExpense = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { expenseId }: TDeleteExpenseRequestBody = req.body;
  // 2. Check if the required data is present or not
  if (!expenseId) {
    return next(new ApiError(400, "ExpenseId is required!"));
  }
  // 3. Find an expense & delete
  const expense = await Expense.findByIdAndDelete(expenseId);
  if (!expense) {
    return next(new ApiError(400, "Expense not found!"));
  }
  // 4. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense deleted successfully!"));
});

// 6. GET
// route: api/v1/expense/update/split
// PRIVATE
// does: get all expenses of users
export const getAllExpenses = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { _id: userId } = req.user;
  // 2. Check if the valid data is present or not
  const expenses = await Expense.find({ userId });
  // 3. Return a response
  // ATTENTION: We can send personal and splitted expenses from here also
  // const personalExpenses = expenses.filter((expense) => expense.isPersonal);
  // const splittedExpenses = expenses.filter((expense) => !expense.isPersonal);
  return res.status(200).json(
    new ApiResponse(200, "Expenses retrieved successfully!", {
      expenses,
    })
  );
});

// 7. GET
// route: api/v1/expense/friend/list
// PRIVATE
// does: get all expenses of individual friend
export const getAllExpensesOfFriend = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { targetUserId }: TGetAllExpensesOfFriendRequestBody = req.body;
  const { _id } = req.user;

  if (targetUserId.toString() === (_id as ObjectId).toString()) {
    return next(new ApiError(400, "Please provide a valid id"));
  }

  // 2. Find all expenses related to that friend
  const response = await getFriendExpenses(_id as ObjectId, targetUserId, next);

  // 3. Return a response
  return res.status(200).json(
    new ApiResponse(200, "Friend expenses retrieved successfully!", {
      expenses: response?.expenses || [],
      finalAmount: response?.finalAmount || 0,
    })
  );
});

// 8. POST
// route: api/v1/expense/settle/all
// PRIVATE
// does: settle all expenses
export const settleAllExpenses = tryCatch(async (req, res, next) => {
  // 1. Get the data
  const { targetUserId }: TSettleAllExpensesOfFriendRequestBody = req.body;
  const { _id } = req.user;
  const targetUserObjectId = new Types.ObjectId(targetUserId);

  return res.status(200).json(new ApiResponse(200, "Settled all expenses!"));
});

// 9. POST
// route: api/v1/expense/settle/individual
// PRIVATE
// does: settle an individual expense

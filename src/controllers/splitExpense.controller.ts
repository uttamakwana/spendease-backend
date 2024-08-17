import { Expense } from "../models/expense.model.js";
import { Friend } from "../models/friend.model.js";
import { SplitExpense } from "../models/splitExpense.model.js";
import { User } from "../models/user.model.js";
import type { TSplitsSchema } from "../types/expense.type.js";
import type {
  TCreateSplitExpenseAPIRequestBody,
  TDeleteSplitExpenseAPIRequestBody,
  TUpdateSplitExpenseAPIRequestBody,
} from "../types/splitExpense.type.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";
import { isValidCategory } from "../utils/validation.util.js";

// 1. POST
// route: splitExpense/create
// PRIVATE
// does: create split expense
export const createSplitExpense = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const {
    amount,
    description,
    category,
    splits,
  }: TCreateSplitExpenseAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;

  // Step 2. Check for required data fields
  if (!amount || !description || !category || !splits) {
    return next(new ApiError(400, "All fields are required!"));
  }

  // Step 3. Valid category
  if (category && !isValidCategory(category)) {
    return next(new ApiError(400, "Invalid category!"));
  }

  // Step 4. Check if current user id is included in splits
  const isCurrentUserIdExistInSplits = splits.find(
    (split) => split.splittedFor.toString() === currentUserId.toString()
  );
  if (isCurrentUserIdExistInSplits) {
    return next(new ApiError(400, "Please provide valid ids"));
  }

  // Step 5. Validate each split expense
  for (const split of splits) {
    // Find the user for the split
    const splittedForUser = await User.findById(split.splittedFor);
    if (!splittedForUser) {
      return next(
        new ApiError(400, `User with ID ${split.splittedFor} not found!`)
      );
    }

    // Check if there is a friendship between the current user and the splittedForUser
    const isFriendShip = await Friend.findOne({
      $or: [
        { user1: splittedForUser._id, user2: currentUserId },
        { user1: currentUserId, user2: splittedForUser._id },
      ],
    });

    if (!isFriendShip) {
      return next(
        new ApiError(
          400,
          `You are not friends with user ${splittedForUser.name}!`
        )
      );
    }
  }

  // Step 6. Create Splits array with only splittedFor ids
  const splittedFor: TSplitsSchema[] = splits.map((split) => {
    return {
      splittedFor: split.splittedFor,
    };
  });

  // Step 7. Create an Expense
  const totalSplittedAmount = splits.reduce(
    (totalAmount, currentValue) => totalAmount + currentValue.splittedAmount,
    0
  );

  if (totalSplittedAmount > amount) {
    return next(new ApiError(400, "Provide valid splitted amount!"));
  }

  const expense = await Expense.create({
    createdBy: currentUserId,
    amount,
    description,
    category,
    isPersonal: false,
    isSettled: false,
    splits: splittedFor,
    totalSplittedAmount,
  });

  // Step 8. Create Split Expense
  for (const split of splits) {
    await SplitExpense.create({
      expenseId: expense._id,
      createdBy: currentUserId,
      createdFor: split.splittedFor,
      splittedAmount: split.splittedAmount,
      splittedDescription: split.splittedDescription,
      isSplittedSettled: false,
    });
  }

  // Step 9. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense splitted successfully!"));
});

// 2. PUT
// route: splitExpense/update
// PRIVATE
// does: update split expense
export const updateSplitExpense = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const {
    expenseId,
    amount,
    description,
    category,
    splits,
  }: TUpdateSplitExpenseAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;
  // Step 2. Check if data is present or not
  if (!expenseId && !amount && !description && !category && !splits) {
    return next(
      new ApiError(
        400,
        "Please provide at least one field to update split expense!"
      )
    );
  }
  // Step 3. Check if only createdBy user is updating
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    return next(new ApiError(400, "Expense not found!"));
  }
  if (expense.createdBy.toString() !== currentUserId.toString()) {
    return next(new ApiError(400, "You are not authorize to update!"));
  }

  // Step 4. Find Expense & Update
  if (amount) expense.amount = amount;
  if (description) expense.description = description;
  if (category && isValidCategory(category)) expense.category = category;

  const totalSplittedAmount = splits.reduce(
    (totalAmount, currentValue) => totalAmount + currentValue.splittedAmount,
    0
  );

  if (totalSplittedAmount > amount) {
    return next(new ApiError(400, "Please provide valid splitted amount!"));
  }
  expense.totalSplittedAmount = totalSplittedAmount;

  const newSplits: TSplitsSchema[] = splits.map((split) => {
    return { splittedFor: split.splittedFor };
  });
  if (newSplits) expense.splits = newSplits;

  await expense.save();

  // Step 5. Find Split Expenses & Split Expenses to be removed
  const newSplittedForIds = splits.map((split) => split.splittedFor.toString());
  const existingSplitExpenses = await SplitExpense.find({ expenseId });
  const splitExpenseToRemove = existingSplitExpenses.filter(
    (splitExpense) =>
      !newSplittedForIds.includes(splitExpense.createdFor.toString())
  );

  // Step 6. Remove Split Expense
  if (splitExpenseToRemove && splitExpenseToRemove.length > 0) {
    for (const split of splitExpenseToRemove) {
      await SplitExpense.findByIdAndDelete(split._id);
    }
  }

  // Step 7. Update Split Expense & Add new Split Expense if added
  for (const split of splits) {
    const existingSplit = existingSplitExpenses.find(
      (es) => es.createdFor.toString() === split.splittedFor.toString()
    );

    if (existingSplit) {
      // Update the existing split
      existingSplit.splittedAmount = split.splittedAmount;
      existingSplit.splittedDescription = split.splittedDescription;
      await existingSplit.save();
    } else {
      // Create a new split
      await SplitExpense.create({
        expenseId: expense._id,
        createdBy: currentUserId,
        createdFor: split.splittedFor,
        splittedAmount: split.splittedAmount,
        splittedDescription: split.splittedDescription,
      });
    }
  }

  // Step 8. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Split expense updated successfully!"));
});

// 3. DELETE
// route: splitExpense/delete
// PRIVATE
// does: delete split expense
export const deleteSplitExpense = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const { expenseId }: TDeleteSplitExpenseAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;

  // Step 2. Find the expense by ID
  const expense = await Expense.findById(expenseId);
  if (!expense) {
    return next(new ApiError(404, "Expense not found!"));
  }

  // Step 3. Check if the current user is authorized to delete this expense
  if (expense.createdBy.toString() !== currentUserId.toString()) {
    return next(
      new ApiError(403, "You are not authorized to delete this expense!")
    );
  }

  // Step 4. Delete associated split expenses
  await SplitExpense.deleteMany({ expenseId: expense._id });

  // Step 5. Delete the expense itself
  await Expense.findByIdAndDelete(expense._id);

  // Step 6. Return a success response
  return res
    .status(200)
    .json(new ApiResponse(200, "Expense and its splits deleted successfully!"));
});

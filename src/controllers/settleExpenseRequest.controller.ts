import { Friend } from "../models/friend.model.js";
import { SettleExpenseRequest } from "../models/settleExpenseRequest.model.js";
import { SplitExpense } from "../models/splitExpense.model.js";
import type {
  TAcceptSettleExpenseRequestAPIRequestBody,
  TRejectSettleExpenseRequestAPIRequestBody,
  TRemoveSettleExpenseRequestAPIRequestBody,
  TSendSettleExpenseRequestAPIRequestBody,
} from "../types/settleExpenseRequest.type.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";

// 1. POST
// route: settleExpense/send
// PRIVATE
// does: send a settle expense request
export const sendSettleExpenseRequest = tryCatch(async (req, res, next) => {
  // Step 1. Get req body data
  const {
    receiverId,
    expenseId,
    isSettleAll,
  }: TSendSettleExpenseRequestAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;

  // Step 2. Check for required data
  if (!receiverId && !isSettleAll) {
    return next(new ApiError(400, "ReceiverId and isSettleAll are required!"));
  }

  // Step 3. Check if request already exists or not
  const isSettleExpenseRequestExists = await SettleExpenseRequest.findOne({
    senderId: currentUserId,
    receiverId,
    isSettleAll,
  });
  if (isSettleExpenseRequestExists) {
    return next(new ApiError(400, "Settle expense request already exists!"));
  }

  // Step 4. Create Settle Expense Request
  await SettleExpenseRequest.create({
    senderId: currentUserId,
    receiverId,
    expenseId,
    isSettleAll,
  });

  // Step 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Settle expense request send successfully!"));
});

// 2. POST
// route: settleExpense/remove
// PRIVATE
// does: remove a settle expense request
export const removeSettleExpenseRequest = tryCatch(async (req, res, next) => {
  // Step 1. Get the request body data
  const { settleExpenseRequestId }: TRemoveSettleExpenseRequestAPIRequestBody =
    req.body;
  const { _id: currentUserId } = req.user;
  // Step 2. Check if required data is present
  if (!settleExpenseRequestId) {
    return next(new ApiError(400, "SettleExpenseRequestId is required!"));
  }
  // Step 3. Validate the current user has sent that request or not
  const isSettleExpenseRequestExists = await SettleExpenseRequest.findOne({
    senderId: currentUserId,
    _id: settleExpenseRequestId,
  });
  if (!isSettleExpenseRequestExists) {
    return next(new ApiError(400, "No such request exists!"));
  }
  // Step 4. Remove the settle expense request
  await SettleExpenseRequest.findByIdAndDelete(settleExpenseRequestId);
  // Step 5. Return a response
  return res
    .status(200)
    .json(new ApiResponse(200, "Settle Expense Request Removed Successfully!"));
});

// 3. POST
// route: settleExpense/reject
// PRIVATE
// does: remove a settle expense request
export const rejectSettleExpenseRequest = tryCatch(async (req, res, next) => {
  // Step 1. Get the req body data
  const { settleExpenseRequestId }: TRejectSettleExpenseRequestAPIRequestBody =
    req.body;
  const { _id: currentUserId } = req.user;
  // Step 2. Check if required data is present
  if (!settleExpenseRequestId) {
    return next(new ApiError(400, "SettleExpenseRequestId is required!"));
  }
  // Step 3. Validate currentUser has authorized to reject the request or not
  const isSettleExpenseRequestExists = await SettleExpenseRequest.findOne({
    receiverId: currentUserId,
    _id: settleExpenseRequestId,
  });
  if (!isSettleExpenseRequestExists) {
    return next(new ApiError(400, "No such request exists!"));
  }
  // Step 4. Remove the settle expense request
  await SettleExpenseRequest.findByIdAndDelete(settleExpenseRequestId);
  // Step 5. Return a response
  return res
    .status(200)
    .json(
      new ApiResponse(200, "Settle Expense Request Rejected Successfully!")
    );
});

// 4. POST
// route: settleExpenseRequest/accept
// PRIVATE
// does: accept a settle expense request
export const acceptSettleExpenseRequest = tryCatch(async (req, res, next) => {
  // Step 1: Get the req body data
  const {
    settleExpenseRequestId,
    expenseId,
  }: TAcceptSettleExpenseRequestAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;

  // Step 2: Check if required data is present or not
  if (!settleExpenseRequestId) {
    return next(new ApiError(400, "SettleExpenseRequestId is required!"));
  }

  // Step 3: Find the settle expense request first
  const settleExpenseRequest = await SettleExpenseRequest.findById(
    settleExpenseRequestId
  );
  if (!settleExpenseRequest) {
    return next(new ApiError(400, "No such request exists!"));
  }

  // Step 4: Validate the settle expense request
  const receiverId = settleExpenseRequest.receiverId;
  if (receiverId.toString() !== currentUserId.toString()) {
    return next(
      new ApiError(400, "You are not authorized to perform this action!")
    );
  }

  // Step 5: Find the relationship between currentUser and receiver
  const isFriendshipExists = await Friend.findOne({
    $or: [
      { user1: currentUserId, user2: receiverId },
      { user1: receiverId, user2: currentUserId },
    ],
  });
  if (!isFriendshipExists) {
    return next(new ApiError(400, "No friendship exists between you!"));
  }

  // Step 6: Settle all or specific expenses
  if (settleExpenseRequest.isSettleAll) {
    // Settle all expenses between the two users
    await SplitExpense.updateMany(
      {
        $or: [
          { createdBy: currentUserId, createdFor: receiverId },
          { createdBy: receiverId, createdFor: currentUserId },
        ],
        isSplittedSettled: false, // Only update unsettled expenses
      },
      {
        $set: { isSplittedSettled: true },
      }
    );
  } else {
    // Settle individual expense (if specified)
    await SplitExpense.updateOne(
      {
        expenseId: expenseId,
        $or: [
          { createdBy: currentUserId, createdFor: receiverId },
          { createdBy: receiverId, createdFor: currentUserId },
        ],
        isSplittedSettled: false,
      },
      {
        $set: { isSplittedSettled: true },
      }
    );
  }

  // Step 7: Respond with success message
  res
    .status(200)
    .json({ success: true, message: "Expenses settled successfully." });
});

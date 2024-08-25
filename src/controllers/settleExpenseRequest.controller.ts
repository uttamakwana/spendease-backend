import { SettleExpenseRequest } from "../models/settleExpenseRequest.model.js";
import type { TSendSettleExpenseRequestAPIRequestBody } from "../types/settleExpenseRequest.type.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";

// 1. POST
// route: settleExpense/send
// PRIVATE
// does: send a settle all expense request
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

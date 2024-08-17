import mongoose from "mongoose";
import { Friend } from "../models/friend.model.js";
import { SplitExpense } from "../models/splitExpense.model.js";
import { User } from "../models/user.model.js";
import type {
  TFriendAggregation,
  TFriendAggregationAnalysis,
  TListIndividualFriendExpensesAPIRequestBody,
} from "../types/friend.type.js";
import { ApiResponse } from "../utils/apiResponse.util.js";
import { ApiError } from "../utils/errorHandling.util.js";
import { tryCatch } from "../utils/tryCatch.util.js";

// 1. GET
// route: friend/list
// PRIVATE
// does: get all friend with their analysis
export const listFriends = tryCatch(async (req, res, next) => {
  // 1. Get req body data
  const { _id: currentUserId } = req.user;
  // 2. Search all friend of user
  const expectedFriendIds = await Friend.find({
    $or: [{ user1: currentUserId }, { user2: currentUserId }],
  });
  const friendIds = expectedFriendIds.map((expectedFriendId) => {
    if (expectedFriendId.user1.toString() === currentUserId.toString()) {
      return expectedFriendId.user2;
    } else {
      return expectedFriendId.user1;
    }
  });
  // 3. Aggregate all your friends
  const aggregation: TFriendAggregation[] = await User.aggregate([
    {
      $match: {
        _id: { $in: friendIds },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        finalAmount: { $literal: 0 },
        expenseCount: {
          currentUser: { $literal: 0 },
          friend: { $literal: 0 },
        },
      },
    },
  ]);
  // 4. For every friend find expenses that are whether created by current user and individual friend
  for (const friend of aggregation) {
    const splitExpenses = await SplitExpense.find({
      $or: [
        { createdBy: currentUserId, createdFor: friend._id },
        { createdBy: friend._id, createdFor: currentUserId },
      ],
    });
    const analysis: TFriendAggregationAnalysis = splitExpenses.reduce(
      (acc, currentValue) => {
        if (currentValue.createdBy.toString() === currentUserId.toString()) {
          acc.finalAmount += currentValue.splittedAmount;
          acc.expenseCount.currentUser += 1;
        } else {
          acc.finalAmount -= currentValue.splittedAmount;
          acc.expenseCount.friend += 1;
        }
        return acc;
      },
      {
        finalAmount: 0,
        expenseCount: {
          currentUser: 0,
          friend: 0,
        },
      }
    );
    friend.finalAmount = analysis.finalAmount;
    friend.expenseCount = analysis.expenseCount;
  }
  // 4. Return a response
  return res.status(200).json(
    new ApiResponse(200, "Friend list retrieved successfully!", {
      aggregation,
    })
  );
});

// 2. GET
// route: friend/individual
// PRIVATE
// does: get all expenses of individual friend
export const listIndividualFriendExpenses = tryCatch(async (req, res, next) => {
  // Step 1. Get req body type
  const { friendId }: TListIndividualFriendExpensesAPIRequestBody = req.body;
  const { _id: currentUserId } = req.user;
  // Step 2. Check for required data
  if (!friendId) return next(new ApiError(400, "FriendId is required!"));
  // Step 3. Check if friendship exists or not
  const isFriendShipExist = await Friend.findOne({
    $or: [
      { user1: currentUserId, user2: friendId },
      { user1: friendId, user2: currentUserId },
    ],
  });
  if (!isFriendShipExist) {
    return next(new ApiError(400, "Friendship not exists!"));
  }

  const friendObjId = new mongoose.Types.ObjectId(friendId);
  // Step 4. Find all the split expenses created by and created for this friendship
  const splitExpenses = await SplitExpense.aggregate([
    {
      $match: {
        $or: [
          { createdBy: currentUserId, createdFor: friendObjId },
          { createdBy: friendObjId, createdFor: currentUserId },
        ],
      },
    },
    {
      $lookup: {
        from: "expenses",
        localField: "expenseId",
        foreignField: "_id",
        as: "expenseDetails",
      },
    },
    {
      $unwind: "$expenseDetails",
    },
    {
      $project: {
        _id: 1,
        createdBy: 1,
        createdFor: 1,
        splittedAmount: 1,
        splittedDescription: 1,
        isSplittedSettled: 1,
        expenseId: 1,
        amount: "$expenseDetails.amount",
        description: "$expenseDetails.description",
        category: "$expenseDetails.category",
        isCreatedByYou: {
          $cond: {
            if: { $eq: ["$createdBy", currentUserId] },
            then: true,
            else: false,
          },
        },
      },
    },
  ]);
  // Step 5. Aggregate all the necessary information
  // Step 6. Return a response
  return res.status(200).json(
    new ApiResponse(200, "Friend expenses retrieved successfully!", {
      expenses: splitExpenses,
    })
  );
});

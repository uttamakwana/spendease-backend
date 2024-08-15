import type { NextFunction } from "express";
import { Types, type ObjectId } from "mongoose";
import { ApiError } from "./errorHandling.util.js";
import { User } from "../models/user.model.js";
import { Expense } from "../models/expense.model.js";
import type { TGetAllExpensesOfFriendResponse } from "../types/expense.type.js";

type TGetFriendExpensesReturn = {
  expenses: TGetAllExpensesOfFriendResponse[];
  analysis: {
    amount: number;
    userExpenseCount: number;
    friendExpenseCount: number;
  };
} | void;

export const getFriendExpenses = async (
  _id: ObjectId,
  targetUserId: ObjectId,
  next: NextFunction
): Promise<TGetFriendExpensesReturn> => {
  try {
    if (!targetUserId) {
      return next(new ApiError(400, "TargetUserId is required!"));
    }

    // Find the friend user
    const user = await User.findById(_id);
    if (!user) {
      return next(new ApiError(400, "User not found!"));
    }
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return next(new ApiError(400, "User not found!"));
    }

    // -> 1. using map and filter
    // const expenses = await Expense.find({ targetUserId: _id });
    // const friendExpenses = expenses
    //   .map((expense) => {
    //     const splittedExpense = expense.splits.find(
    //       (e) => e.targetUserId.toString() === targetUserId.toString()
    //     );
    //     if (splittedExpense) {
    //       return splittedExpense;
    //     } else return null;
    //   })
    //   .filter((expense) => expense);

    // -> 2. using reduce
    // const expenses = await Expense.find({ targetUserId: _id, isPersonal: false });
    // const friendExpenses = expenses.reduce(
    //   (acc: TSplittedExpenseSchema[], currentValue) => {
    //     const friendExpense = currentValue.splits.find(
    //       (exp) => exp.targetUserId.toString() === targetUserId.toString()
    //     );
    //     if (friendExpense) {
    //       acc.push(friendExpense);
    //     }
    //     return acc;
    //   },
    //   []
    // );

    // -> 3. using aggregate
    const userFriendExpenses: TGetAllExpensesOfFriendResponse[] =
      await Expense.aggregate([
        {
          $match: {
            userId: user._id,
            isPersonal: false,
          },
        },
        {
          $unwind: "$splits",
        },
        {
          $match: {
            "splits.splittedFor": targetUser._id,
          },
        },
        {
          $project: {
            _id: 1,
            amount: "$amount",
            description: "$description",
            category: 1,
            splittedAmount: "$splits.splittedAmount",
            splittedDescription: "$splits.splittedDescription",
            isSettled: "$splits.isSplittedSettled",
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $addFields: {
            isCreatedByYou: true,
          },
        },
      ]);
    const targetUserFriendsExpenses: TGetAllExpensesOfFriendResponse[] =
      await Expense.aggregate([
        {
          $match: {
            userId: targetUser._id,
            isPersonal: false,
          },
        },
        {
          $unwind: "$splits",
        },
        {
          $match: {
            "splits.splittedFor": user._id,
          },
        },
        {
          $project: {
            _id: 1,
            amount: "$amount",
            description: "$description",
            category: 1,
            splittedAmount: "$splits.splittedAmount",
            splittedDescription: "$splits.splittedDescription",
            isSettled: "$splits.isSplittedSettled",
            createdAt: 1,
            updatedAt: 1,
          },
        },
        {
          $addFields: {
            isCreatedByYou: false,
          },
        },
      ]);

    const finalArray = [...userFriendExpenses, ...targetUserFriendsExpenses];

    const analysis = finalArray?.reduce(
      (acc, currentValue) => {
        if (currentValue.isCreatedByYou && !currentValue.isSettled) {
          acc.amount = acc.amount + currentValue.splittedAmount;
          acc.userExpenseCount += 1;
        } else {
          acc.amount = acc.amount - currentValue.splittedAmount;
          acc.friendExpenseCount += 1;
        }
        return acc;
      },
      { amount: 0, userExpenseCount: 0, friendExpenseCount: 0 }
    );

    console.log(finalArray);

    return { expenses: finalArray, analysis };
  } catch (error) {
    throw new ApiError(500, "Error fetching friend expenses");
  }
};

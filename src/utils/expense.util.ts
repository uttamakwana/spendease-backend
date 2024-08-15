import type { NextFunction } from "express";
import { Types, type ObjectId } from "mongoose";
import { ApiError } from "./errorHandling.util.js";
import { User } from "../models/user.model.js";
import { Expense } from "../models/expense.model.js";
import type { TGetAllExpensesOfFriendResponse } from "../types/expense.type.js";

type TGetFriendExpensesReturn = {
  expenses: TGetAllExpensesOfFriendResponse[];
  finalAmount: number;
} | void;

export const getFriendExpenses = async (
  _id: ObjectId,
  targetUserId: string,
  next: NextFunction
): Promise<TGetFriendExpensesReturn> => {
  try {
    const targetUserObjectId = new Types.ObjectId(targetUserId);

    if (!targetUserId) {
      return next(new ApiError(400, "TargetUserId is required!"));
    }

    // Find the friend user
    const user = await User.findById(_id);
    if (!user) {
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
            userId: _id,
            isPersonal: false,
          },
        },
        {
          $unwind: "$splits",
        },
        {
          $match: {
            "splits.userId": targetUserObjectId,
          },
        },
        {
          $project: {
            _id: 1,
            amount: "$amount",
            description: "$description",
            category: 1,
            splittedAmount: "$splits.amount",
            splittedDescription: "$splits.description",
            isSettled: "$splits.isSettled",
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
            userId: targetUserObjectId,
            isPersonal: false,
          },
        },
        {
          $unwind: "$splits",
        },
        {
          $match: {
            "splits.userId": _id,
          },
        },
        {
          $project: {
            _id: 1,
            amount: "$amount",
            description: "$description",
            category: 1,
            splittedAmount: "$splits.amount",
            splittedDescription: "$splits.description",
            isSettled: "$splits.isSettled",
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

    const finalAmount = finalArray?.reduce((acc, currentValue) => {
      if (currentValue.isCreatedByYou && !currentValue.isSettled) {
        acc = acc + currentValue.splittedAmount;
      } else {
        acc = acc - currentValue.splittedAmount;
      }
      return acc;
    }, 0);

    return { expenses: finalArray, finalAmount };
  } catch (error) {
    throw new ApiError(500, "Error fetching friend expenses");
  }
};

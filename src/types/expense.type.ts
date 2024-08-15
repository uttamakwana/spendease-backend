import type { ObjectId } from "mongoose";
import type { ExpenseCategory } from "../constants/expense.constant.js";
import type { TUserId } from "./user.type.js";

export type TExpenseId = ObjectId;

export type TExpenseSchema = {
  userId: TUserId;
  amount: number;
  description: string;
  isPersonal: boolean;
  category: ExpenseCategory;
  splits: Array<TSplittedExpenseSchema>;
  isSettled: boolean;
};

export type TSplittedExpenseSchema = {
  userId: TUserId;
  amount: number;
  description: string;
  isSettled: boolean;
};

export type TCreatePersonalExpenseRequestBody = Pick<
  TExpenseSchema,
  "amount" | "description" | "category"
>;

export type TCreateSplitExpenseRequestBody = Pick<
  TExpenseSchema,
  "amount" | "description" | "category" | "splits"
>;

export type TUpdatePersonalExpenseRequestBody =
  TCreatePersonalExpenseRequestBody & {
    expenseId: TExpenseId;
  };

export type TUpdateSplitExpenseRequestBody = TCreateSplitExpenseRequestBody & {
  expenseId: TExpenseId;
};

export type TDeleteExpenseRequestBody = { expenseId: TExpenseId };

export type TGetAllExpensesOfFriendRequestBody = { targetUserId: string };

export type TSettleAllExpensesOfFriendRequestBody = { targetUserId: string };

export type TGetAllExpensesOfFriendResponse = {
  _id: ObjectId;
  amount: TExpenseSchema["amount"];
  description: TExpenseSchema["description"];
  category: ExpenseCategory;
  splittedAmount: TSplittedExpenseSchema["amount"];
  splittedDescription: TSplittedExpenseSchema["description"];
  isSettled: TSplittedExpenseSchema["isSettled"];
  createdAt: Date;
  updatedAt: Date;
  isCreatedByYou: boolean;
};

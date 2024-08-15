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
  splittedFor: TUserId;
  splittedAmount: number;
  splittedDescription: string;
  isSplittedSettled: boolean;
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

export type TGetAllExpensesOfFriendRequestBody = { targetUserId: ObjectId };

export type TSettleAllExpensesOfFriendRequestBody = {
  targetUserId: ObjectId;
};

export type TSettleIndividualExpensesOfFriendRequestBody = {
  targetUserId: ObjectId;
  expenseId: ObjectId;
};

export type TSettleAllExpenseRejectRequestBody = {
  requestedBy: ObjectId;
};

export type TSettleIndividualExpenseRejectRequestBody = {
  requestedBy: ObjectId;
  expenseId: ObjectId;
};

export type TGetAllExpensesOfFriendResponse = {
  _id: ObjectId;
  amount: TExpenseSchema["amount"];
  description: TExpenseSchema["description"];
  category: ExpenseCategory;
  splittedAmount: TSplittedExpenseSchema["splittedAmount"];
  splittedDescription: TSplittedExpenseSchema["splittedDescription"];
  isSettled: TSplittedExpenseSchema["isSplittedSettled"];
  createdAt: Date;
  updatedAt: Date;
  isCreatedByYou: boolean;
};

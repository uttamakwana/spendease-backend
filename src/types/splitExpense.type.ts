import type { Document, ObjectId } from "mongoose";
import type { TExpenseSchema } from "./expense.type.js";

// SPLIT EXPENSE SCHEMA TYPES
export type TSplitExpenseSchema = {
  expenseId: ObjectId;
  createdBy: ObjectId;
  createdFor: ObjectId;
  splittedAmount: number;
  splittedDescription: string;
  isSplittedSettled: boolean;
} & Document;

export type TSplittedExpense = {
  splittedFor: TSplitExpenseSchema["createdFor"];
  splittedAmount: TSplitExpenseSchema["splittedAmount"];
  splittedDescription: TSplitExpenseSchema["splittedDescription"];
};

// SPLIT EXPENSE MODEL TYPES
export type TSplitExpenseModel = TSplitExpenseSchema;

// API REQUEST TYPES
// Create Split Expense
export type TCreateSplitExpenseAPIRequestBody = {
  amount: TExpenseSchema["amount"];
  description: TExpenseSchema["description"];
  category: TExpenseSchema["category"];
  splits: Array<TSplittedExpense>;
};

// Update Split Expense
export type TUpdateSplitExpenseAPIRequestBody = {
  expenseId: ObjectId;
  amount: TExpenseSchema["amount"];
  description: TExpenseSchema["description"];
  category: TExpenseSchema["category"];
  splits: Array<TSplittedExpense>;
};

// Delete Split Expense
export type TDeleteSplitExpenseAPIRequestBody = {
  expenseId: ObjectId;
};

import type { Document, ObjectId } from "mongoose";
import type { ExpenseCategory } from "../constants/expense.constant.js";

// EXPENSE SCHEMA TYPE
export type TExpenseSchema = {
  createdBy: ObjectId;
  amount: number;
  description: string;
  category: ExpenseCategory;
  isPersonal: boolean;
  isSettled: boolean;
  splits: Array<TSplitsSchema>;
  totalSplittedAmount: number;
} & Document;

// EXPENSE MODEL TYPE
export type TExpenseModel = TExpenseSchema;

// SPLITS SCHEMA TYPE
export type TSplitsSchema = {
  splittedFor: ObjectId;
};

// API REQUEST TYPES
// Create Expense
export type TCreateExpenseAPIRequestBody = Pick<
  TExpenseSchema,
  "amount" | "description" | "category"
>;

// Update Expense
export type TUpdateExpenseAPIRequestBody = TCreateExpenseAPIRequestBody & {
  expenseId: ObjectId;
};

// Delete Expense
export type TDeleteExpenseAPIRequestBody = { expenseId: ObjectId };

// List Expense Analysis
export type TListExpensesAnalysis = {
  count: {
    personal: number;
    split: number;
    total: number;
  };
  amount: {
    personal: number;
    split: number;
    total: number;
  };
};

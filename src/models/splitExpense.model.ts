import mongoose from "mongoose";
import type { TSplitExpenseSchema } from "../types/splitExpense.type.js";
import {
  ExpenseModel,
  SplitExpenseModel,
  UserModel,
} from "../constants/global.constant.js";

// SPLIT EXPENSE SCHEMA
const SplitExpenseSchema = new mongoose.Schema<TSplitExpenseSchema>(
  {
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: ExpenseModel,
      required: [true, "ExpenseId is required!"],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
      required: [true, "CreatedBy is required!"],
    },
    createdFor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
      required: [true, "CreatedFor is required!"],
    },
    splittedAmount: {
      type: Number,
      required: [true, "Splitted amount is required!"],
      min: [0, "Splitted amount cannot be negative!"],
    },
    splittedDescription: {
      type: String,
      minLength: [2, "Splitted description required at least 2 characters!"],
      maxLength: [200, "Splitted description can't more than 20 characters!"],
    },
    isSplittedSettled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// SPLIT EXPENSE MODEL
export const SplitExpense = mongoose.model<TSplitExpenseSchema>(
  SplitExpenseModel,
  SplitExpenseSchema
);

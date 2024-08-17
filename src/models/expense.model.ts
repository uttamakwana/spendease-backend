import mongoose from "mongoose";
import type { TExpenseModel, TExpenseSchema } from "../types/expense.type.js";
import { ExpenseCategory } from "../constants/expense.constant.js";
import { ExpenseModel, UserModel } from "../constants/global.constant.js";

// EXPENSE SCHEMA
const ExpenseSchema = new mongoose.Schema<TExpenseSchema>(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: UserModel,
      required: [true, "CreatedBy is required!"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required!"],
      min: [0, "Amount cannot be negative!"],
    },
    description: {
      type: String,
      required: [true, "Description is required!"],
      minlength: [2, "Description required at least 2 characters!"],
      maxlength: [200, "Description can't contain more than 200 characters!"],
      trim: true,
    },
    category: {
      type: String,
      enum: Object.values(ExpenseCategory),
      default: ExpenseCategory.MISCELLANEOUS,
    },
    isPersonal: {
      type: Boolean,
      required: [true, "IsPersonal is required!"],
      default: true,
    },
    isSettled: {
      type: Boolean,
      default: false,
    },
    splits: [
      {
        splittedFor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: UserModel,
        },
      },
    ],
    totalSplittedAmount: {
      type: Number,
      default: 0,
      min: [0, "TotalSplittedAmount cannot be negative!"],
    },
  },
  { timestamps: true }
);

// EXPENSE MODEL
export const Expense = mongoose.model<TExpenseModel>(
  ExpenseModel,
  ExpenseSchema
);

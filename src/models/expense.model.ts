import mongoose from "mongoose";
import type { TExpenseSchema } from "../types/expense.type.js";
import { ExpenseCategory } from "../constants/expense.constant.js";

const ExpenseSchema = new mongoose.Schema<TExpenseSchema>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "UserId is required!"],
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
      maxlength: [
        200,
        "Description doesn't required more than 200 characters!",
      ],
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
    splits: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: [true, "UserId is required!"],
        },
        amount: {
          type: Number,
          required: [true, "Splitted amount is required!"],
          min: [0, "Splitted amount cannot be negative!"],
        },
        description: {
          type: String,
          minLength: [
            2,
            "Splitted description required at least 2 characters!",
          ],
          maxLength: [
            200,
            "Splitted description doesn't required more than 20 characters!",
          ],
        },
        isSettled: {
          type: Boolean,
          default: false,
        },
      },
    ],
    isSettled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export const Expense = mongoose.model("Expense", ExpenseSchema);

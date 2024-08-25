import mongoose from "mongoose";
import type {
  TSettleExpenseRequestSchema,
  TSettleExpenseRequestSchemaModel,
} from "../types/settleExpenseRequest.type.js";
import {
  ExpenseModel,
  SettleExpenseRequestModel,
  UserModel,
} from "../constants/global.constant.js";

// SETTLE EXPENSE REQUEST SCHEMA
const SettleExpenseRequestSchema =
  new mongoose.Schema<TSettleExpenseRequestSchema>(
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: UserModel,
      },
      receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: UserModel,
      },
      expenseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: ExpenseModel,
      },
      isSettleAll: {
        type: Boolean,
        required: [true, "isSettleAll is required!"],
      },
    },
    { timestamps: true }
  );

// SETTLE EXPENSE REQUEST MODEL
export const SettleExpenseRequest =
  mongoose.model<TSettleExpenseRequestSchemaModel>(
    SettleExpenseRequestModel,
    SettleExpenseRequestSchema
  );

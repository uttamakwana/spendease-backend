import type { Document, ObjectId } from "mongoose";

// SETTLE EXPENSE REQUEST TYPE
export type TSettleExpenseRequestSchema = {
  senderId: ObjectId;
  receiverId: ObjectId;
  expenseId?: ObjectId;
  isSettleAll: boolean;
} & Document;

// SETTLE EXPENSE REQUEST MODEL
export type TSettleExpenseRequestSchemaModel = TSettleExpenseRequestSchema;

// API REQUEST TYPE
export type TSendSettleExpenseRequestAPIRequestBody = {
  receiverId: ObjectId;
  expenseId?: ObjectId;
  isSettleAll: boolean;
};

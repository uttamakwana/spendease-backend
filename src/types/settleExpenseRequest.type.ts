import type { Document, ObjectId } from "mongoose";

export type TSettleExpenseRequestSchema = {
  senderId: ObjectId;
  receiverId: ObjectId;
  expenseId?: ObjectId;
  isSettleAll: boolean;
} & Document;

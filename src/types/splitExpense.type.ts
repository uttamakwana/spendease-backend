import type { Document, ObjectId } from "mongoose";

export type TSplitExpenseSchema = {
  expenseId: ObjectId;
  createdBy: ObjectId;
  createdFor: ObjectId;
  splittedAmount: number;
  splittedDescription: string;
  isSplittedSettled: boolean;
} & Document;

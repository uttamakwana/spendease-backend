import type { Document, ObjectId } from "mongoose";
import type { TUserSchema } from "./user.type.js";

// FRIEND SCHEMA TYPE
export type TFriendSchema = {
  user1: ObjectId;
  user2: ObjectId;
} & Document;

// FRIEND MODEL TYPE
export type TFriendModel = TFriendSchema;

// Friend Aggregation
export type TFriendAggregation = {
  _id: ObjectId;
  name: TUserSchema["name"];
  email: TUserSchema["email"];
  finalAmount: number;
  expenseCount: {
    currentUser: number;
    friend: number;
  };
};

// Friend Aggregation Analysis
export type TFriendAggregationAnalysis = {
  finalAmount: TFriendAggregation["finalAmount"];
  expenseCount: {
    currentUser: TFriendAggregation["expenseCount"]["currentUser"];
    friend: TFriendAggregation["expenseCount"]["friend"];
  };
};

// API REQUEST TYPE
export type TListIndividualFriendExpensesAPIRequestBody = {
  friendId: string;
};

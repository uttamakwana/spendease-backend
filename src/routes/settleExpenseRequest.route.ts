import { Router } from "express";
import { isAuth } from "../middlewares/auth.middleware.js";
import { sendSettleExpenseRequest } from "../controllers/settleExpenseRequest.controller.js";

// CONSTANT
export const settleExpenseRequestRouter = Router();

// ROUTES
// 1. Send Settle All Expense Request
settleExpenseRequestRouter
  .route("/send")
  .post(isAuth, sendSettleExpenseRequest);

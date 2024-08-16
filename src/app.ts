import express from "express";
import { errorHandler } from "./utils/errorHandling.util.js";
import cors from "cors";
import cookieParser from "cookie-parser";

// CONSTANTS
export const app = express();

//? CONFIGURATIONS
// does: allow cors origin to access our backend services
app.use(cors({ origin: process.env.CORS_ORIGIN }));
// does: don't allow more than 16kb data in a single request
app.use(express.json({ limit: "16kb" }));
// does: allow extended urls in the request
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
// does: make public folder statically accessible
app.use(express.static("public"));
// does: store and retrieve cookies from the client browser
app.use(cookieParser());

// ROUTES
// 1. User Routes
import { userRouter } from "./routes/user.route.js";
app.use("/api/v1/user", userRouter);
// 2. Friend Request Routes
import { friendRequestRouter } from "./routes/friendRequest.route.js";
app.use("/api/v1/friendRequest", friendRequestRouter);
// 2. Expense Routes
import { expenseRouter } from "./routes/expense.route.js";
app.use("/api/v1/expense", expenseRouter);

// error middleware
app.use(errorHandler);

import type { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";

// Extend Error to create a custom error class
export class ApiError extends Error {
  statusCode: number;
  success: boolean;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.success = statusCode < 400;

    Error.captureStackTrace(this, this.constructor);
  }
}

// does: Handle Mongoose CastError (invalid ObjectId)
const handleCastErrorDB = (err: mongoose.Error.CastError): ApiError => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new ApiError(400, message);
};

// does: Handle Mongoose duplicate field error
const handleDuplicateFieldsDB = (err: any): ApiError => {
  const value = err.keyValue?.email || "";
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return new ApiError(400, message);
};

// does: Handle Mongoose validation error
const handleValidationErrorDB = (
  err: mongoose.Error.ValidationError
): ApiError => {
  const errors = Object.values(err.errors).map((el: any) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new ApiError(400, message);
};

export const errorHandler = (
  err: ApiError | mongoose.Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err } as ApiError;
  error.message = err.message;

  if (err instanceof mongoose.Error.CastError) {
    error = handleCastErrorDB(err);
  }

  if ((err as any).code === 11000) {
    error = handleDuplicateFieldsDB(err);
  }

  if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationErrorDB(err);
  }

  res.status(error.statusCode || 500).json({
    success: error.success,
    message: error.message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
};

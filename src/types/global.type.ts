import type { Request } from "express";
import type { TUserSchema } from "./user.type.js";

// Extend Request type to include user property
export type AuthenticatedRequest = Request & {
  user: TUserSchema;
};

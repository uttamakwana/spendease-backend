import { Request } from "express";
import type { TUserSchema } from "./user.type.ts";

declare global {
  namespace Express {
    interface Request {
      user: TUserSchema; // Add user property to Request type
    }
  }
}

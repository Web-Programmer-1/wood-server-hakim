import { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/ApiError";
import { Prisma } from "@prisma/client";

export const globalErrorHandler = (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      errorCode: err.errorCode,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const code = err.code;
    if (code === "P2028") {
      return res.status(504).json({
        success: false,
        message: "The request took too long to process. Please try again.",
      });
    }
    if (code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "The requested resource was not found.",
      });
    }
    return res.status(500).json({
      success: false,
      message: "A database error occurred. Please try again.",
    });
  }

  if (err instanceof Prisma.PrismaClientInitializationError) {
    return res.status(503).json({
      success: false,
      message: "Service temporarily unavailable. Please try again in a moment.",
    });
  }

  const message =
    err?.message && err.message.length < 200 && !err.message.includes("prisma")
      ? err.message
      : "Internal Server Error";

  return res.status(err?.statusCode || 500).json({
    success: false,
    message,
  });
};

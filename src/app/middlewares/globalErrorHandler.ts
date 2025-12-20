import { Request, Response, NextFunction } from "express";
import { ApiError } from "../errors/ApiError";


export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
      errorCode: err.errorCode,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
};

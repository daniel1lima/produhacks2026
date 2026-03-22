import { Request, Response, NextFunction } from "express";
import { ApiResponse } from "../types";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response<ApiResponse<null>>,
  _next: NextFunction
): void {
  console.error(`[Error] ${err.name}: ${err.message}`);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      data: null,
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    success: false,
    data: null,
    error: "Internal server error",
  });
}

import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      next(
        Object.assign(new Error(`Validation failed: ${JSON.stringify(errors)}`), {
          statusCode: 400,
          name: "AppError",
        })
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

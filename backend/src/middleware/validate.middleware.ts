import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

interface ValidationSchemas {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    req.validated = {
      body: schemas.body?.parse(req.body),
      params: schemas.params?.parse(req.params),
      query: schemas.query?.parse(req.query)
    };

    next();
  };
}


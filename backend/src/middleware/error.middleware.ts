import type { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error.js";
import { env } from "../config/env.js";

export const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      data: null,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed.",
        details: error.flatten()
      },
      meta: {}
    });
    return;
  }

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      data: null,
      error: {
        code: error.code,
        message: error.message,
        details: error.details
      },
      meta: {}
    });
    return;
  }

  if (env.NODE_ENV !== "test") {
    console.error(error);
  }

  res.status(500).json({
    data: null,
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong."
    },
    meta: {}
  });
};


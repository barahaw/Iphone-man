import type { Response } from "express";

export interface ApiMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
  [key: string]: unknown;
}

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta: ApiMeta = {}): void {
  res.status(statusCode).json({
    data,
    error: null,
    meta
  });
}


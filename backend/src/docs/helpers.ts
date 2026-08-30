import type { ResponseConfig, ZodContentObject, ZodRequestBody } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import type { ZodTypeAny } from "zod";

export type ExampleMap = Record<string, { value: unknown }>;
export type SchemaRef = ZodTypeAny | { $ref: string };

export const metaSchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().optional(),
  total: z.number().int().nonnegative().optional(),
  hasMore: z.boolean().optional()
});

export function successEnvelope(data: ZodTypeAny) {
  return z.object({
    data,
    error: z.null(),
    meta: metaSchema
  });
}

export function jsonContent(schema: SchemaRef, examples?: ExampleMap): ZodContentObject {
  return {
    "application/json": {
      schema,
      ...(examples ? { examples } : {})
    }
  };
}

export function jsonResponse(description: string, schema: ZodTypeAny, examples?: ExampleMap): ResponseConfig {
  return {
    description,
    content: jsonContent(schema, examples)
  };
}

export function jsonBody(schema: ZodTypeAny, description?: string): ZodRequestBody {
  return {
    description,
    content: { "application/json": { schema } },
    required: true
  };
}

export function errorResponse(description: string, examples?: ExampleMap): ResponseConfig {
  return {
    description,
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ApiErrorEnvelope" },
        ...(examples ? { examples } : {})
      }
    }
  };
}

export function rateLimitResponse(): ResponseConfig {
  return {
    description:
      "Too many requests. The rate limiter responds with a plain-text body, not the standard { data, error, meta } envelope.",
    content: {
      "text/plain": {
        schema: { type: "string", example: "Too many requests, please try again later." }
      }
    }
  };
}

export function binaryResponse(description: string): ResponseConfig {
  return {
    description,
    headers: {
      "Content-Type": {
        description: "Excel 2007+ workbook content type",
        schema: { type: "string" }
      },
      "Content-Disposition": {
        description: 'Attachment, e.g. attachment; filename="maintenance-jobs-2026-07.xlsx"',
        schema: { type: "string" }
      }
    },
    content: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
        schema: { type: "string", format: "binary" }
      }
    }
  };
}

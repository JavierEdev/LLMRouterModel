import type { ProblemDetails } from "./ProblemDetails.ts";
import { ValidationError } from "../../application/errors/ValidationError.ts";
import { NotFoundError } from "../../application/errors/NotFoundError.ts";

export function toProblemDetails(err: unknown, instance?: string): ProblemDetails {
  if (err instanceof ValidationError) {
    return {
      type: "validation_error",
      title: err.message,
      status: 400,
      ...(instance && { instance }),
      errors: { flow: err.details },
    };
  }

  if (err instanceof NotFoundError) {
    return {
      type: "not_found",
      title: err.message,
      status: 404,
      ...(instance && { instance }),
    };
  }

  return {
    type: "internal_error",
    title: "Error interno",
    status: 500,
    ...(instance && { instance }),
  };
}
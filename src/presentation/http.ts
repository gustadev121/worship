import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/core/domain/errors";

/** Map domain errors to HTTP responses. Falls back to 500. */
export function errorResponse(err: unknown): Response {
  if (err instanceof ValidationError) {
    return Response.json({ error: err.message }, { status: 400 });
  }
  if (err instanceof UnauthorizedError) {
    return Response.json({ error: err.message }, { status: 401 });
  }
  if (err instanceof ForbiddenError) {
    return Response.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return Response.json({ error: err.message }, { status: 404 });
  }
  if (err instanceof ConflictError) {
    return Response.json({ error: err.message }, { status: 409 });
  }
  console.error("[api-error]", err);
  return Response.json(
    { error: "Error interno del servidor" },
    { status: 500 },
  );
}

export function unauthorized(): Response {
  return Response.json({ error: "No autorizado" }, { status: 401 });
}

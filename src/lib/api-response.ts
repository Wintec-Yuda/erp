import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { UnauthorizedError, ForbiddenError } from "@/lib/api-auth";

export function apiSuccess<T>(data: T, init?: number) {
  return NextResponse.json({ data }, { status: init ?? 200 });
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Centralized error handler for API route handlers. */
export function handleApiError(error: unknown) {
  if (error instanceof ZodError) {
    return apiError(error.issues.map((i) => i.message).join(", "), 422);
  }
  if (error instanceof UnauthorizedError) {
    return apiError(error.message, 401);
  }
  if (error instanceof ForbiddenError) {
    return apiError(error.message, 403);
  }
  if (error instanceof Error) {
    return apiError(error.message, 400);
  }
  return apiError("Internal server error", 500);
}

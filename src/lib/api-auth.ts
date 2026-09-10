import { auth } from "@/lib/auth";
import type { Role } from "@prisma/client";
import { hasMinimumRole } from "@/lib/rbac";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Ensures the current request is authenticated, optionally requiring a
 * minimum role. Throws UnauthorizedError/ForbiddenError which should be
 * caught by handleApiError in the calling route handler.
 */
export async function requireSession(minimumRole?: Role) {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  if (minimumRole && !hasMinimumRole(session.user.role, minimumRole)) {
    throw new ForbiddenError();
  }
  return session;
}

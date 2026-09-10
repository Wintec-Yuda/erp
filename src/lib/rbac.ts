import type { Role } from "@prisma/client";

/** Ordered permission levels used for simple hierarchical role checks. */
export const ROLE_LEVELS: Record<Role, number> = {
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function hasMinimumRole(role: Role, minimum: Role): boolean {
  return ROLE_LEVELS[role] >= ROLE_LEVELS[minimum];
}

export const ALL_ROLES: Role[] = ["ADMIN", "MANAGER", "STAFF"];

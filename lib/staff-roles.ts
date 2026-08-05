export const USER_ROLES = [
  "CEO",
  "OPERATIONS",
  "FINANCE",
  "STAFF_ASSISTANT",
  "HUMAN_RESOURCES",
  "PROGRAMME_MANAGER",
  "PROJECT_OFFICER",
  "STAFF",
  "CONSULTANT",
  "IT_ADMIN",
] as const;

export type UserRole = (typeof USER_ROLES)[number];

/** Only IT Admin may assign these (leadership + admin). */
export const IT_ADMIN_ASSIGNABLE_PRIVILEGED_ROLES = [
  "CEO",
  "OPERATIONS",
  "FINANCE",
  "IT_ADMIN",
] as const;

export function isItAdmin(role: string | undefined | null): boolean {
  return role === "IT_ADMIN";
}

export function getRolesAssignableBy(actorRole: string | undefined | null): UserRole[] {
  if (isItAdmin(actorRole)) {
    return [...USER_ROLES];
  }
  return USER_ROLES.filter(
    (r) =>
      !(IT_ADMIN_ASSIGNABLE_PRIVILEGED_ROLES as readonly string[]).includes(r)
  );
}

export function canAssignRole(
  actorRole: string | undefined | null,
  targetRole: string
): boolean {
  return getRolesAssignableBy(actorRole).includes(targetRole as UserRole);
}

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

export const IT_ADMIN_PRIVILEGED_ROLES = [
  "CEO",
  "OPERATIONS",
  "FINANCE",
  "IT_ADMIN",
] as const;

export function getRolesAssignableBy(actorRole: string | undefined | null): UserRole[] {
  if (actorRole === "IT_ADMIN") {
    return [...USER_ROLES];
  }
  return USER_ROLES.filter(
    (r) => !(IT_ADMIN_PRIVILEGED_ROLES as readonly string[]).includes(r)
  );
}

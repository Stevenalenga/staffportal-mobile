/** Who can open Settings → User management */
export const SETTINGS_USERS_ROLES = ["IT_ADMIN", "CEO", "OPERATIONS"] as const;

/** Who can open Settings → Expense workflow roles */
export const SETTINGS_EXPENSE_ROLES_ROLES = ["IT_ADMIN", "CEO"] as const;

export function canManageSettingsUsers(role: string | undefined | null): boolean {
  return (
    !!role &&
    SETTINGS_USERS_ROLES.includes(role as (typeof SETTINGS_USERS_ROLES)[number])
  );
}

export function canManageExpenseWorkflowRoles(
  role: string | undefined | null
): boolean {
  return (
    !!role &&
    SETTINGS_EXPENSE_ROLES_ROLES.includes(
      role as (typeof SETTINGS_EXPENSE_ROLES_ROLES)[number]
    )
  );
}

export function canDeactivateUsers(role: string | undefined | null): boolean {
  return role === "IT_ADMIN";
}

/** Portal roles involved in expense / refund approval */
export const EXPENSE_WORKFLOW_ROLES = [
  "FINANCE",
  "CEO",
  "OPERATIONS",
  "IT_ADMIN",
] as const;

/** Matches web settings hub admin sections (CEO, IT Admin, Operations). */
export function canAccessSettingsAdminHub(
  role: string | undefined | null
): boolean {
  return canManageSettingsUsers(role);
}

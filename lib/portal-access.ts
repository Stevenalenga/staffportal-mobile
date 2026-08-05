/** Roles that can view the full staff directory (matches web portal). */
export const STAFF_MANAGER_ROLES = [
  "IT_ADMIN",
  "CEO",
  "HUMAN_RESOURCES",
  "OPERATIONS",
] as const;

export const ASSET_MANAGER_ROLES = ["IT_ADMIN", "CEO", "OPERATIONS"] as const;

export function canViewStaffDirectory(role: string | undefined | null): boolean {
  return (
    !!role &&
    (STAFF_MANAGER_ROLES as readonly string[]).includes(role)
  );
}

export function canManageAssets(role: string | undefined | null): boolean {
  return (
    !!role &&
    (ASSET_MANAGER_ROLES as readonly string[]).includes(role)
  );
}

export { isItAdmin } from "@/lib/staff-roles";

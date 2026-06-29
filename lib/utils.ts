export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatCurrency(amount: number, currency = "KES"): string {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    CEO: "CEO",
    OPERATIONS: "Operations",
    FINANCE: "Finance",
    HUMAN_RESOURCES: "Human Resources",
    PROGRAMME_MANAGER: "Programme Manager",
    PROJECT_OFFICER: "Project Officer",
    STAFF: "Staff",
    CONSULTANT: "Consultant",
    IT_ADMIN: "IT Administrator",
  };
  return labels[role] ?? role;
}

export function getRoleColor(role: string): string {
  const colors: Record<string, string> = {
    CEO: "#7c3aed",
    OPERATIONS: "#2563eb",
    FINANCE: "#16a34a",
    HUMAN_RESOURCES: "#db2777",
    PROGRAMME_MANAGER: "#ea580c",
    PROJECT_OFFICER: "#ca8a04",
    STAFF: "#6b7280",
    CONSULTANT: "#0d9488",
    IT_ADMIN: "#dc2626",
  };
  return colors[role] ?? "#6b7280";
}

export function getAssetStatusStyle(status: string): {
  label: string;
  color: string;
  bg: string;
} {
  const styles: Record<string, { label: string; color: string; bg: string }> = {
    AVAILABLE: { label: "Available", color: "#047857", bg: "#ecfdf5" },
    ASSIGNED: { label: "Assigned", color: "#2563eb", bg: "#eff6ff" },
    IN_MAINTENANCE: { label: "Maintenance", color: "#d97706", bg: "#fffbeb" },
    RETIRED: { label: "Retired", color: "#dc2626", bg: "#fef2f2" },
    LOST: { label: "Lost", color: "#6b7280", bg: "#f9fafb" },
  };
  return styles[status] ?? { label: status, color: "#6b7280", bg: "#f9fafb" };
}

export const ASSET_CATEGORY_LABELS: Record<string, string> = {
  LAPTOP: "Laptop",
  DESKTOP: "Desktop",
  MOBILE_PHONE: "Mobile Phone",
  FURNITURE: "Furniture",
  PRINTER: "Printer",
  PROJECTOR: "Projector",
  NETWORK_EQUIPMENT: "Network Equipment",
  SOFTWARE_LICENCE: "Software Licence",
  OTHER: "Other",
};

export function formatAssetCategory(category: string): string {
  return ASSET_CATEGORY_LABELS[category] ?? category;
}

export const MAINTENANCE_TYPE_LABELS: Record<string, string> = {
  DAMAGE: "Damage Report",
  REPAIR: "Repair",
  SERVICING: "Servicing",
  INSPECTION: "Inspection",
  OTHER: "Other",
};

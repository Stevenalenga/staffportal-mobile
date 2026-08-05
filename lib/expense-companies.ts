/** Uthabiti group companies — aligned with staff portal web */
export const EXPENSE_COMPANY_OPTIONS = [
  { value: "Mamaplus", label: "Mamaplus" },
  { value: "Uthabiti Africa", label: "Uthabiti Africa" },
  { value: "CAC - Collaborative", label: "CAC - Collaborative" },
  { value: "Shima", label: "Shima" },
  { value: "Collaborative SACCO", label: "Collaborative SACCO" },
  { value: "WIC Forum", label: "WIC Forum" },
] as const;

export type ExpenseCompany = (typeof EXPENSE_COMPANY_OPTIONS)[number]["value"];

export const EXPENSE_COMPANY_VALUES: ExpenseCompany[] =
  EXPENSE_COMPANY_OPTIONS.map((o) => o.value);

export const DEFAULT_ALLOWED_EMAIL_DOMAINS = [
  "uthabitiafrica.org",
  "mamaplus.co.ke",
];

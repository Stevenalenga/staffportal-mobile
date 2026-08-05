import { z } from "zod";
import { DEFAULT_ALLOWED_EMAIL_DOMAINS } from "./expense-companies";

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export function createRegisterSchema(allowedDomains: string[]) {
  const domainsLabel = allowedDomains.join(", ");

  return z
    .object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Please enter a valid email address"),
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match",
      path: ["confirmPassword"],
    })
    .refine(
      (data) => {
        const domain = data.email.trim().toLowerCase().split("@")[1];
        return Boolean(domain && allowedDomains.includes(domain));
      },
      {
        message: `Registration is only available for company emails (@${domainsLabel})`,
        path: ["email"],
      }
    );
}

export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;

export const fallbackRegisterDomains = DEFAULT_ALLOWED_EMAIL_DOMAINS;

import { z } from "zod";

/**
 * Auth input schemas.
 *
 * Single source of truth for both client (react-hook-form via
 * zodResolver, gives instant UX feedback) and server (RR7 action,
 * security/server boundary).
 */

export const loginSchema = z.object({
  email: z.string().trim().email("Use a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters.")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        "Password must contain at least one lowercase letter, one uppercase letter and one number.",
    }),
});

export type LoginValues = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Your name is required."),
    email: z.string().trim().email("Use a valid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(128, "Password is too long.")
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
        message:
          "Password must contain at least one lowercase letter, one uppercase letter and one number.",
      }),
    confirmPassword: z.string(),
    displayName: z.string().trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don’t match.",
  });

export type RegisterValues = z.infer<typeof registerSchema>;

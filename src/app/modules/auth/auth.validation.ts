import { z } from "zod";

export const registerSchema = z.object({
  name: z
    .string({
      error: "Name is required",
    })
    .min(2, "Name must be at least 2 characters"),

  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .nullable(),

  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Phone must contain only digits")
    .min(8, "Phone must be at least 8 digits")
    .max(15, "Phone must be at most 15 digits")
    .optional()
    .nullable(),

  password: z
    .string({
      error: "Password is required",
    })
    .min(6, "Password must be at least 8 characters")
    .regex(/[a-zA-Z]/, "Password must contain letters")
    .regex(/[0-9]/, "Password must contain numbers"),
})
.refine(
  (data) => data.email || data.phone,
  {
    message: "Email or phone is required",
    path: ["email"], // Error email field এ দেখাবে
  }
);

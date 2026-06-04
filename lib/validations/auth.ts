import { z } from "zod";

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name must be less than 100 characters"),
  email: z.string().email("Invalid email address"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be less than 30 characters")
    .regex(
      /^[a-zA-Z0-9._]+$/,
      "Username can only contain letters, numbers, dots, and underscores"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters"),
  gender: z.string().optional(),
  height: z.number().min(50).max(300).optional(),
  weight: z.number().min(20).max(500).optional(),
  bodyMeasurements: z.any().optional(),
  profilePhoto: z.string().optional(),
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  login: z.string().min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required"),
});

export const onboardingSchema = z.object({
  height: z.coerce
    .number()
    .min(50, "Height must be at least 50 cm")
    .max(300, "Height must be less than 300 cm")
    .optional(),
  weight: z.coerce
    .number()
    .min(20, "Weight must be at least 20 kg")
    .max(500, "Weight must be less than 500 kg")
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;

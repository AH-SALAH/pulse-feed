import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "auth.errors.emailRequired")
    .email("auth.errors.emailInvalid"),
  password: z
    .string()
    .min(1, "auth.errors.passwordRequired")
    .min(8, "auth.errors.passwordMin"),
});

export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "auth.errors.nameRequired")
    .max(50, "auth.errors.nameTooLong"),
  email: z
    .string()
    .trim()
    .min(1, "auth.errors.emailRequired")
    .email("auth.errors.emailInvalid"),
  password: z
    .string()
    .min(1, "auth.errors.passwordRequired")
    .min(8, "auth.errors.passwordMin"),
});

export type SignUpValues = z.infer<typeof signUpSchema>;

export const addWidgetSchema = z.object({
  symbol: z.string().trim().min(1, "board.errors.symbolRequired"),
});

export type AddWidgetValues = z.infer<typeof addWidgetSchema>;
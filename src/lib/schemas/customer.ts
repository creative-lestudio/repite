import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(1, "nameRequired").max(80, "nameTooLong"),
    phone: z.string().trim().min(6, "phoneInvalid").max(25, "phoneInvalid"),
    birthDay: z.coerce
      .number()
      .int()
      .min(1)
      .max(31)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    birthMonth: z.coerce
      .number()
      .int()
      .min(1)
      .max(12)
      .optional()
      .or(z.literal("").transform(() => undefined)),
    consent: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
  })
  .refine((v) => (v.birthDay === undefined) === (v.birthMonth === undefined), {
    message: "birthdayIncomplete",
    path: ["birthDay"],
  })
  .refine(
    (v) => {
      if (v.birthDay === undefined || v.birthMonth === undefined) return true;
      const d = new Date(Date.UTC(2000, v.birthMonth - 1, v.birthDay));
      return d.getUTCMonth() === v.birthMonth - 1;
    },
    { message: "birthdayInvalid", path: ["birthDay"] },
  );

export type SignupInput = z.infer<typeof signupSchema>;

/** El cumpleaños se guarda sin año real: 2000 (bisiesto) como año convencional. */
export function birthdayToDate(day?: number, month?: number): string | null {
  if (!day || !month) return null;
  return `2000-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export const bonusSchema = z.object({
  type: z.enum(["bonus_story", "bonus_review"]),
  handle: z.string().trim().max(80).optional(),
});

export const preferencesSchema = z.object({
  locale: z.enum(["es-ES", "es-VE"]).optional(),
  marketingConsent: z.boolean().optional(),
});

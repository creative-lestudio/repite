import { z } from "zod";

export const uuid = z.string().uuid();
export const pinSchema = z.object({ staffId: uuid, pin: z.string().regex(/^\d{4,6}$/) });
export const noteSchema = z.object({
  customerId: uuid,
  text: z.string().trim().min(1).max(1000),
  pinned: z.boolean().default(false),
});
export const usualOrderSchema = z.object({
  customerId: uuid,
  usualOrder: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
});

import { z } from "zod";

export const staffSchema = z.object({
  name: z.string().trim().min(1, "staffNameRequired").max(60),
  role: z.enum(["manager", "staff"]),
  pin: z.string().regex(/^\d{4,6}$/, "pinInvalid"),
});
export const pinOnlySchema = z.object({ pin: z.string().regex(/^\d{4,6}$/, "pinInvalid") });
export const deviceSchema = z.object({ name: z.string().trim().min(1).max(60) });
export const idSchema = z.string().uuid();

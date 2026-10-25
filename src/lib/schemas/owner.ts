import { BUSINESS_TYPES } from "@/domain/business-types";
import { z } from "zod";

export const businessSchema = z.object({
  businessType: z.enum(BUSINESS_TYPES).default("otro"),
  businessName: z.string().trim().min(2, "businessNameRequired").max(120),
  country: z.enum(["ES", "VE"]),
  locationName: z.string().trim().min(2, "locationNameRequired").max(120),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$/, "slugInvalid"),
  stamps: z.coerce.number().int().min(3, "stampsRange").max(30, "stampsRange"),
  rewardName: z.string().trim().min(2, "rewardRequired").max(80),
});

export const programSchema = z.object({
  stamps: z.coerce.number().int().min(3, "stampsRange").max(30, "stampsRange"),
  rewardName: z.string().trim().min(2, "rewardRequired").max(80),
  rewardDescription: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || null),
  expiryDays: z
    .union([z.literal(""), z.coerce.number().int().min(1, "expiryRange").max(730, "expiryRange")])
    .transform((v) => (v === "" ? null : v)),
  bonusStory: z.preprocess((v) => v === "on", z.boolean()),
  level1Name: z.string().trim().max(24).default(""),
  level1Visits: z.string().trim().max(5).default(""),
  level1Perk: z.string().trim().max(80).default(""),
  level2Name: z.string().trim().max(24).default(""),
  level2Visits: z.string().trim().max(5).default(""),
  level2Perk: z.string().trim().max(80).default(""),
  level3Name: z.string().trim().max(24).default(""),
  level3Visits: z.string().trim().max(5).default(""),
  level3Perk: z.string().trim().max(80).default(""),
});

const optionalUrl = z
  .string()
  .trim()
  .max(300)
  .transform((v) => v || null)
  .refine((v) => v === null || /^https:\/\/.+\..+/i.test(v), "urlInvalid");

export const settingsSchema = z.object({
  businessType: z.enum(BUSINESS_TYPES).default("otro"),
  name: z.string().trim().min(2, "locationNameRequired").max(120),
  address: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
  openingHours: z
    .string()
    .trim()
    .max(200)
    .transform((v) => v || null),
  locale: z.enum(["es-ES", "es-VE"]),
  timezone: z.enum(["Europe/Madrid", "Atlantic/Canary", "America/Caracas"]),
  cooldownHours: z.coerce.number().min(0, "hoursRange").max(72, "hoursRange"),
  messageGapDays: z.coerce.number().int().min(1, "daysRange").max(90, "daysRange"),
  latitude: z.string().trim().max(20).default(""),
  longitude: z.string().trim().max(20).default(""),
  averageTicket: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().replace(",", ".") : v),
    z
      .union([z.literal("").transform(() => null), z.coerce.number().min(0, "ticketRange").max(1000, "ticketRange")])
      .transform((n) => (n ? n : null)),
  ),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .transform((v) => v || null),
  instagram: z
    .string()
    .trim()
    .max(60)
    .transform((v) => (v ? (v.startsWith("@") ? v : `@${v}`) : null)),
  reviewUrl: optionalUrl,
});

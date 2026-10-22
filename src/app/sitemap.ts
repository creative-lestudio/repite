import type { MetadataRoute } from "next";
import { LANDING_SECTORS, SECTOR_SLUGS } from "@/domain/business-types";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return [
    { url: base, changeFrequency: "monthly", priority: 1 },
    ...LANDING_SECTORS.map((s) => ({
      url: `${base}/para/${SECTOR_SLUGS[s]}`,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${base}/registro`, changeFrequency: "yearly", priority: 0.8 },
    { url: `${base}/entrar`, changeFrequency: "yearly", priority: 0.3 },
  ];
}

import "server-only";
import sharp from "sharp";
import { createServiceClient } from "@/lib/supabase/server";

export type BrandImageKind = "logo" | "stamp" | "card";

const MAX_BYTES = 4 * 1024 * 1024;
const ALLOWED = new Set(["png", "jpeg", "webp"]);

// Tamaños pensados para móvil con pantalla retina; todo se reescala y se recodifica en el servidor
const SPEC = {
  logo: { width: 512, height: 512, fit: "inside", format: "png" },
  stamp: { width: 256, height: 256, fit: "cover", format: "png" },
  card: { width: 1200, height: 750, fit: "cover", format: "webp" },
} as const;

export class BrandImageError extends Error {
  constructor(public code: "imageInvalid" | "imageTooBig") {
    super(code);
  }
}

/** Valida, reescala y sube una imagen de marca. Devuelve la ruta dentro del bucket «brand». */
export async function saveBrandImage(
  organizationId: string,
  locationId: string,
  kind: BrandImageKind,
  file: File,
): Promise<string> {
  if (file.size > MAX_BYTES) throw new BrandImageError("imageTooBig");
  const input = Buffer.from(await file.arrayBuffer());
  const spec = SPEC[kind];

  let output: Buffer;
  try {
    const meta = await sharp(input, { failOn: "error" }).metadata();
    if (!meta.format || !ALLOWED.has(meta.format)) throw new BrandImageError("imageInvalid");
    const pipeline = sharp(input)
      .rotate()
      .resize(spec.width, spec.height, {
        fit: spec.fit,
        withoutEnlargement: spec.fit === "inside",
      });
    output = await (spec.format === "png" ? pipeline.png() : pipeline.webp({ quality: 86 })).toBuffer();
  } catch (e) {
    if (e instanceof BrandImageError) throw e;
    throw new BrandImageError("imageInvalid");
  }

  const path = `${organizationId}/${locationId}/${kind}-${Date.now()}.${spec.format}`;
  const { error } = await createServiceClient()
    .storage.from("brand")
    .upload(path, output, { contentType: `image/${spec.format}`, cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return path;
}

/** Borra una imagen anterior (mejor esfuerzo) solo si pertenece a este local. */
export async function deleteBrandImage(organizationId: string, locationId: string, path: string | null) {
  if (!path || !path.startsWith(`${organizationId}/${locationId}/`)) return;
  await createServiceClient().storage.from("brand").remove([path]);
}

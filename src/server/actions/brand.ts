"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { CARD_STYLES, FONT_KEYS, STAMP_MODES, STAMP_SHAPES } from "@/domain/brand";
import { createUserClient } from "@/lib/supabase/server";
import { requireManager } from "../auth/owner";
import { BrandImageError, deleteBrandImage, saveBrandImage, type BrandImageKind } from "../brand-images";

type Result = { ok: true } | { ok: false; error: string };

const brandSchema = z.object({
  primary: z.string().regex(/^#[0-9a-fA-F]{6}$/, "colorInvalid"),
  font: z.enum(FONT_KEYS as [string, ...string[]]),
  stampShape: z.enum(STAMP_SHAPES),
  stampMode: z.enum(STAMP_MODES),
  cardStyle: z.enum(CARD_STYLES),
});

function refresh(slug: string) {
  revalidatePath("/app", "layout");
  revalidatePath(`/c/${slug}`, "layout");
  revalidatePath("/equipo", "layout");
}

/** Guarda color, tipografía, forma de sello y estilo de tarjeta. */
export async function saveBrandAction(input: z.input<typeof brandSchema>): Promise<Result> {
  const ctx = await requireManager();
  const parsed = brandSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "form" };
  const v = parsed.data;
  const b = ctx.location.brand;
  const { error } = await (
    await createUserClient()
  )
    .from("locations")
    .update({
      brand_color: v.primary.toUpperCase(),
      brand: {
        font: v.font,
        stampShape: v.stampShape,
        stampMode: v.stampMode,
        cardStyle: v.cardStyle,
        stampImage: b.stampImage,
        cardBg: b.cardBg,
      },
    })
    .eq("id", ctx.location.id);
  if (error) throw error;
  refresh(ctx.location.slug);
  return { ok: true };
}

const kindSchema = z.enum(["logo", "stamp", "card"]);

async function setImage(
  ctx: Awaited<ReturnType<typeof requireManager>>,
  kind: BrandImageKind,
  path: string | null,
): Promise<string | null> {
  const b = ctx.location.brand;
  const supabase = await createUserClient();
  const previous = kind === "logo" ? b.logo : kind === "stamp" ? b.stampImage : b.cardBg;
  const patch =
    kind === "logo"
      ? { logo_path: path }
      : { brand: { ...rawBrand(b), ...(kind === "stamp" ? { stampImage: path } : { cardBg: path }) } };
  const { error } = await supabase.from("locations").update(patch).eq("id", ctx.location.id);
  if (error) throw error;
  return previous;
}

const rawBrand = (b: Awaited<ReturnType<typeof requireManager>>["location"]["brand"]) => ({
  font: b.font,
  stampShape: b.stampShape,
  stampMode: b.stampMode,
  cardStyle: b.cardStyle,
  stampImage: b.stampImage,
  cardBg: b.cardBg,
});

/** Sube el logotipo, la imagen del sello o el fondo de la tarjeta. */
export async function uploadBrandImageAction(kind: string, formData: FormData): Promise<Result> {
  const ctx = await requireManager();
  const k = kindSchema.safeParse(kind);
  const file = formData.get("file");
  if (!k.success || !(file instanceof File) || file.size === 0) return { ok: false, error: "imageInvalid" };
  try {
    const path = await saveBrandImage(ctx.organization.id, ctx.location.id, k.data, file);
    const previous = await setImage(ctx, k.data, path);
    await deleteBrandImage(ctx.organization.id, ctx.location.id, previous);
  } catch (e) {
    if (e instanceof BrandImageError) return { ok: false, error: e.code };
    throw e;
  }
  refresh(ctx.location.slug);
  return { ok: true };
}

export async function removeBrandImageAction(kind: string): Promise<Result> {
  const ctx = await requireManager();
  const k = kindSchema.safeParse(kind);
  if (!k.success) return { ok: false, error: "form" };
  const previous = await setImage(ctx, k.data, null);
  await deleteBrandImage(ctx.organization.id, ctx.location.id, previous);
  refresh(ctx.location.slug);
  return { ok: true };
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui";
import { RecoverForm } from "@/components/customer/recover-form";
import { getLocationBySlug } from "@/server/repositories/locations";

export default async function RecoverPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) notFound();
  const t = await getTranslations("customer.recover");
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-5 pt-2">
      <div>
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-2">{t("body")}</p>
      </div>
      {error === "enlace" && <Alert tone="warning">{t("invalidLink")}</Alert>}
      <RecoverForm slug={slug} locationName={location.name} />
      <Link
        href={`/c/${slug}`}
        className="text-primary min-h-11 self-center py-3 text-sm font-semibold underline-offset-4 hover:underline"
      >
        {t("newAccount")}
      </Link>
    </div>
  );
}

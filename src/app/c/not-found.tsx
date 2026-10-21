import { getTranslations } from "next-intl/server";
import { MapPinOff } from "lucide-react";
import { EmptyState } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("customer.notFound");
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <EmptyState icon={<MapPinOff />} title={t("title")} description={t("body")} />
    </main>
  );
}

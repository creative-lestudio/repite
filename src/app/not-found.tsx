import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { Button, EmptyState } from "@/components/ui";

export default async function NotFound() {
  const t = await getTranslations("common");
  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <EmptyState
        icon={<SearchX />}
        title={t("notFoundTitle")}
        description={t("notFoundBody")}
        action={
          <Button asChild variant="secondary">
            <Link href="/">{t("goHome")}</Link>
          </Button>
        }
      />
    </main>
  );
}

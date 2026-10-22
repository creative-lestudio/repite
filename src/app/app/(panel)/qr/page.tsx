import { Download, FileText } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Alert, Button, Card } from "@/components/ui";
import { env } from "@/lib/env";
import { requireOwner } from "@/server/auth/owner";
import { qrSvg } from "@/server/qr";

export default async function QrPage() {
  const ctx = await requireOwner();
  const url = `${env().NEXT_PUBLIC_APP_URL}/c/${ctx.location.slug}`;
  const [t, svg] = await Promise.all([getTranslations("owner.qr"), qrSvg(url)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1">{t("intro")}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[18rem_1fr] md:items-start">
        <Card className="flex flex-col items-center gap-3">
          <div
            role="img"
            aria-label={t("qrAlt", { location: ctx.location.name })}
            className="w-full max-w-64 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="text-muted text-center text-xs break-all">{url}</p>
          <Button asChild variant="secondary" block>
            <a href="/app/qr/svg" download>
              <Download aria-hidden />
              {t("downloadSvg")}
            </a>
          </Button>
        </Card>

        <div className="flex flex-col gap-4">
          {[
            { title: t("posterTitle"), body: t("posterBody"), href: "/app/qr/pdf?formato=a4" },
            { title: t("tentTitle"), body: t("tentBody"), href: "/app/qr/pdf?formato=a6" },
          ].map((m) => (
            <Card key={m.href} className="flex flex-wrap items-center gap-4">
              <span className="bg-primary-soft text-primary flex size-12 shrink-0 items-center justify-center rounded-lg">
                <FileText className="size-6" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">{m.title}</h2>
                <p className="text-muted text-sm">{m.body}</p>
              </div>
              <Button asChild>
                <a href={m.href} download>
                  <Download aria-hidden />
                  {t("downloadPdf")}
                </a>
              </Button>
            </Card>
          ))}
          <Alert tone="info">{t("tip")}</Alert>
        </div>
      </div>
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardDescription,
  CardTitle,
  Checkbox,
  EmptyState,
  Field,
  Input,
} from "@/components/ui";
import { Inbox } from "lucide-react";
import { StampCardDemo } from "./stamp-card-demo";

export const metadata = { title: "Sistema de diseño", robots: { index: false } };

const swatches = [
  ["ink-950", "#111111"],
  ["wine-800", "#7A0D12"],
  ["red-600 (acción)", "#C9281B"],
  ["red-500 (marca)", "#FF3B2E"],
  ["cream-200", "#E6D8CC"],
  ["cream-100", "#F6EDE6"],
  ["cream-50", "#FBF7F3"],
  ["stone-600", "#6B655E"],
  ["success", "#136B42"],
  ["danger", "#B3261E"],
  ["warning", "#9A5B00"],
] as const;

export default async function DesignPage() {
  const t = await getTranslations("design");
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-10">
      <header>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-2">{t("intro")}</p>
      </header>

      <section aria-labelledby="colores" className="flex flex-col gap-3">
        <h2 id="colores" className="text-xl font-bold">
          Colores
        </h2>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map(([name, hex]) => (
            <li key={name} className="bg-surface border-cream-100 overflow-hidden rounded-lg border">
              <div className="h-14" style={{ background: hex }} />
              <p className="px-2 pt-1.5 text-xs font-semibold">{name}</p>
              <p className="text-muted px-2 pb-1.5 text-xs">{hex}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tarjeta" className="flex flex-col gap-3">
        <h2 id="tarjeta" className="text-xl font-bold">
          Tarjeta de sellos
        </h2>
        <StampCardDemo />
      </section>

      <section aria-labelledby="botones" className="flex flex-col gap-3">
        <h2 id="botones" className="text-xl font-bold">
          Botones
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button>Registrar visita</Button>
          <Button variant="secondary">Añadir nota</Button>
          <Button variant="soft">Programar</Button>
          <Button variant="ghost">Descartar</Button>
          <Button variant="danger">Dar de baja</Button>
          <Button loading>Guardando</Button>
        </div>
      </section>

      <section aria-labelledby="formularios" className="flex flex-col gap-3">
        <h2 id="formularios" className="text-xl font-bold">
          Formularios
        </h2>
        <Card className="flex flex-col gap-4">
          <Field id="d-name" label="Tu nombre">
            <Input placeholder="María" autoComplete="given-name" />
          </Field>
          <Field
            id="d-phone"
            label="Tu WhatsApp"
            hint="Solo para tu tarjeta y, si quieres, avisos del local."
            error="Revisa el número: le faltan dígitos."
          >
            <Input inputMode="tel" defaultValue="+34 6" />
          </Field>
          <Checkbox
            id="d-consent"
            label="Quiero recibir mensajes de este local por WhatsApp"
            description="Puedes darte de baja cuando quieras."
          />
        </Card>
      </section>

      <section aria-labelledby="estados" className="flex flex-col gap-3">
        <h2 id="estados" className="text-xl font-bold">
          Estados
        </h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Cumpleaños</Badge>
          <Badge tone="solid">Premio listo</Badge>
          <Badge tone="success">Enviado</Badge>
          <Badge tone="warning">Pendiente</Badge>
          <Badge tone="danger">Fallido</Badge>
          <Badge tone="neutral">Descartado</Badge>
        </div>
        <Alert tone="success" title="Visita registrada">
          María ya tiene 4 de 8 sellos.
        </Alert>
        <Alert tone="danger" title="No se pudo registrar">
          Este cliente ya sumó un sello hace poco. Podrá sumar otro a partir de las 13:40.
        </Alert>
        <Card>
          <CardTitle>Tarjeta</CardTitle>
          <CardDescription>Superficie blanca sobre el fondo azul muy suave.</CardDescription>
        </Card>
        <EmptyState
          icon={<Inbox />}
          title="No hay oportunidades por ahora"
          description="Cada mañana revisamos a tus clientes y te avisamos aquí cuando alguien merece un mensaje."
        />
      </section>
    </main>
  );
}

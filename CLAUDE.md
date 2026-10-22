# Repite · guía para Claude Code

SaaS de fidelización para cafeterías (España y Venezuela). Tres interfaces: Cliente (`/c/[slug]`), Equipo (`/equipo`), Dueño (`/app`). Reservado: `/admin` (`platform_admin`).

## Comandos

| Acción                            | Comando                                        |
| --------------------------------- | ---------------------------------------------- |
| Arrancar Supabase local (Docker)  | `pnpm db:start`                                |
| Reiniciar BD (migraciones + seed) | `pnpm db:reset`                                |
| Desarrollo                        | `pnpm dev`                                     |
| Lint / tipos / formato            | `pnpm lint` · `pnpm typecheck` · `pnpm format` |
| Unitarias (Vitest)                | `pnpm test`                                    |
| BD: RLS y libro (pgTAP)           | `pnpm test:db`                                 |
| E2E (Playwright, 360 px)          | `pnpm test:e2e`                                |
| Tipos de la BD                    | `pnpm db:types`                                |

Guía de publicación para no programadores: `docs/PUBLICAR.md`.

**Producción (Supabase)**: proyecto `Repite`, ID `keaabqhptkgduynvbhtt` (eu-west-1). Las migraciones se aplican por la API de gestión de Supabase con un secreto de red (`Authorization: Bearer …` hacia `api.supabase.com`); el historial se registra en `supabase_migrations.schema_migrations` con las mismas versiones que los archivos. **Nunca aplicar `seed.sql` en producción** (tiene cuentas demo con contraseña conocida). Las plantillas globales de mensajes viven en la migración `…000008`, no en el seed.

`messages/es-ES.d.json.ts` tipa claves y argumentos de los textos; lo regenera `pnpm i18n:types` (incluido en `pnpm typecheck`) y también next-intl al arrancar. Se versiona. Los argumentos numéricos de ICU se escriben `{n, number}`; los `{x}` sin formato son `string`.

En el contenedor de Claude Code: `dockerd` puede no estar arrancado; lánzalo antes de `pnpm db:start`. Playwright está fijado a 1.56.1 para usar el Chromium preinstalado.

## Stack

Next.js 15 (App Router, Server Actions) · TypeScript estricto · Supabase (Postgres 17, Auth, RLS, Storage) · Tailwind CSS 4 con tokens en `src/app/globals.css` · componentes propios estilo shadcn en `src/components/ui` · next-intl · Zod · Vitest · Playwright · pnpm.

## Arquitectura (decisiones)

1. **Multi-tenant por `organization_id`** con RLS activada y forzada en todas las tablas (`supabase/migrations/*_rls.sql`). Jerarquía: organización → locales; clientes compartidos a nivel organización.
2. **Dos caminos de acceso a datos:**
   - Dueño/manager: `createUserClient()` (JWT de Supabase), todo pasa por RLS.
   - Cliente final y equipo por PIN **no son usuarios de Supabase Auth**. Sus sesiones son cookies firmadas (`SESSION_SECRET`) validadas en el servidor; los datos se leen con `createServiceClient()` **solo desde `src/server/repositories`**, siempre filtrando por la organización de la sesión.
3. **Libro de sellos append-only (`stamp_events`)**: saldo = suma de `quantity` aprobada. Tipos: `visit` (+1), `bonus_story`/`bonus_review` (+1, pendientes de validar), `reward_issued` (−sellos necesarios; la tarjeta se llena, se emite `rewards` y se reinicia), `redeem` (0, marca canje), `adjust` (±n, correcciones y deshacer con `reverses_event_id`). Trigger impide borrar o editar salvo validar un pendiente.
4. **Toda mutación del libro va por funciones Postgres** (`register_visit`, `undo_visit`, `request_bonus`, `validate_bonus`, `redeem_reward`): transaccionales, idempotentes por `idempotency_key` y serializadas por cliente con `pg_advisory_xact_lock`. Solo `service_role` puede ejecutarlas. Los errores de negocio salen como `P0001` con un código (`cooldown`, `already_undone`…) que se traduce en `messages/*.json > errors`.
5. **Intervalo mínimo entre sellos**: `locations.settings.stamp_cooldown_hours` (por defecto 4). Ventana de deshacer: 10 minutos.
6. **PIN del equipo**: la tablet se vincula abriendo `/equipo/vincular?t=<token del dispositivo>` (el dueño lo mostrará como QR; cookie `rd` de 400 días, hash en `staff_devices`, revocable). Después cada empleado toca su nombre y teclea su PIN (bcrypt con pgcrypto, bloqueo 15 min tras 5 fallos) → cookie firmada `rs` de 8 h, revalidada contra la BD en cada petición. «Cambiar de persona» cierra solo la sesión del empleado.
7. **Configuración por datos**: `locations.settings` (jsonb), `opportunity_rules.params`, `message_templates` (globales con `organization_id = null` + propias del local), `feature_flags`.
8. **Proveedores externos detrás de interfaces** en `src/server/providers` (`MessagingProvider`, `AIProvider`, `PaymentsProvider`, `ReviewsProvider`) y se eligen por variables de entorno. Por defecto: mensajería `mock`, IA `template`.
9. **i18n sin prefijo en la URL** (los QR deben ser cortos y estables). Idioma: cookie `repite_locale` → idioma del local → `Accept-Language` → `es-ES`. `messages/es-VE.json` contiene solo las diferencias respecto a `es-ES.json`.
10. **Tareas programadas**: un único endpoint `/api/cron/tick` (Vercel Cron, cada hora) que procesa los locales cuya hora local ya pasó `settings.opportunity_hour`; `job_runs` (único por job+local+día) garantiza idempotencia.
11. **Rate limiting** en Postgres (`rate_limit_hit`), sin Redis en fase 1.
12. **Cliente final**: cookie `rc_<org>` httpOnly de 400 días por organización. Si alguien se registra con un teléfono que ya existe, **no** se inicia sesión: se envía un enlace mágico (30 min, un solo uso) a ese WhatsApp. Recuperación en `/c/[slug]/recuperar`, consumo en `/c/[slug]/acceso`.
13. **Tarjeta en vivo**: la PWA consulta el estado cada 5 s mientras está visible (Server Action `getCardStateAction`) y guarda en `localStorage` el último saldo visto para animar los sellos sumados mientras estaba cerrada. Sin Realtime: el cliente no es usuario de Supabase Auth.
14. **Cumpleaños** sin año real: se guarda como `2000-MM-DD` (año bisiesto convencional); el motor compara mes y día.
15. QR personal del cliente: `${APP_URL}/equipo/q/<qr_token>`; al escanearlo con la cámara normal abre la ficha en el panel del equipo.
16. **Panel del equipo**: «Registrar visita» envía una clave de idempotencia nueva por toque; deshacer durante 10 min desde «Visitas de hoy»; el día se calcula en la zona horaria del local (`src/domain/time.ts`). Toda acción comprueba que el evento/premio pertenece al local u organización de la tablet.
17. Escáner QR: `BarcodeDetector` nativo y, si no existe, `jsqr` cargado bajo demanda.
18. **Panel del dueño** (`/app`): Supabase Auth con correo + contraseña o enlace mágico; `src/middleware.ts` refresca la sesión y manda a `/entrar`. Todo el panel usa `createUserClient()` (RLS). `requireOwner()` / `requireManager()` (`src/server/auth/owner.ts`) dan organización, local y rol. Las páginas del panel viven en `src/app/app/(panel)/`; el asistente de alta `/app/empezar` está fuera del grupo (el usuario aún no tiene organización).
19. **Alta de cuenta**: `create_organization_with_owner` (RPC con el JWT del usuario) crea organización + local + reglas de oportunidad y membresía `owner`; un usuario solo puede tener una organización en la fase 1. País → moneda, zona horaria e idioma por defecto (`COUNTRY_DEFAULTS`). El enlace `/c/<slug>` sale del nombre del local (`slugify`) y se valida con `slug_available`.
20. **Equipo desde el panel**: los PIN y los tokens de tablet no se pueden escribir con el JWT; `src/server/repositories/team.ts` usa `service_role` tras `requireManager()` y comprueba siempre `organization_id`. El enlace de vinculación de una tablet se muestra una sola vez (solo se guarda el hash).
21. **Material imprimible**: `/app/qr/pdf?formato=a4|a6` (pdf-lib, fuentes estándar → se filtran emojis) y `/app/qr/svg`. Descargar un PDF marca el paso «QR» del asistente.
22. **CSV de clientes**: separador `;`, BOM UTF-8 y protección contra fórmulas de Excel (`src/domain/csv.ts`). Cada exportación queda en `audit_log`. El dueño puede insertar en `audit_log` solo como sí mismo (política `audit_log_insert`).
23. **Planes**: todas las cuentas empiezan en `trial` (30 días con todo incluido) y al caducar pasan solas a **Gratis** (hasta 50 clientes, para siempre); `pro` = clientes sin límite (precio 19 €/19 USD **provisional** en `src/config/plan.ts`). El plan efectivo se calcula en la BD (`app.effective_plan`) y en `src/domain/plan.ts`. El límite lo impone un trigger en `customers` (`customer_limit_reached`): los clientes existentes nunca se borran, solo se bloquean altas nuevas. Si cambias 50, cámbialo en `app.customer_limit` y en `PLAN.freeCustomerLimit`. No hay cobro real: la pantalla de plan solo informa. Pendiente de decidir: qué funciones del motor de oportunidades son de pago.
24. **Web pública** (`/`): portada, cómo funciona, ventajas, vista previa con capturas reales (`public/landing/*.webp`, se regeneran con `scripts/dev/landing-shots.mjs`), precio, preguntas, `/legal/*` (borradores sin revisión legal), `robots`, `sitemap`, imagen Open Graph y JSON-LD. Los textos con listas se guardan como objetos `i1, i2…` (las listas rompen el tipado de next-intl) y se leen con `getMessages()`.
25. Enumeraciones como `text` + `check` (más fáciles de evolucionar que los `enum` de Postgres).

## Estructura

```
src/app/            rutas (c/, equipo/, app/, admin/, api/, design/)
src/components/ui   sistema de diseño · src/components/stamp-card
src/domain/         lógica pura y testeable (sin imports de servidor)
src/server/         actions/, repositories/, auth/, jobs/, providers/
src/lib/            env (Zod), supabase/, utils
supabase/           migrations/, seed.sql, tests/ (pgTAP)
messages/           es-ES.json (base), es-VE.json (diferencias)
tests/unit, tests/e2e
```

## Convenciones

- Textos de interfaz siempre en `messages/*.json`, tono cálido, frases en minúscula salvo la primera letra. La misma acción se llama igual en toda la app: «Registrar visita», «Canjear premio», «Validar sellos extra», «Añadir nota», «Aprobar y enviar», «Programar», «Descartar».
- Mobile-first desde 360 px; objetivos táctiles ≥ 44 px (`min-h-11`); foco visible; `Field` conecta etiqueta, ayuda y error.
- Colores solo vía tokens (`bg-primary`, `text-muted`, `bg-brand`…), nunca hex sueltos en componentes.
- Validación con Zod en todo borde (Server Actions, Route Handlers).
- Cada corte vertical: migración + lógica + UI + pruebas, en un commit. Antes de commitear: `pnpm format && pnpm lint && pnpm typecheck && pnpm test`.
- Las E2E crean sus propios clientes (`seedCustomer` en `tests/e2e/helpers.ts`) para poder repetirse sin reiniciar la BD.
- No incluir identificadores de modelo de IA en commits ni código salvo en configuración (`ANTHROPIC_MODEL`).

## Datos de demostración (seed)

- Dueño: `demo@repite.app` / `repite-demo` (entra en `/entrar`) → Café Aurora (`/c/cafe-aurora`), Madrid, EUR, 8 sellos = «Un café gratis».
- Segunda cuenta para probar aislamiento: `sol@repite.app` / `repite-demo` → Panadería Sol (Caracas, USD).
- Equipo Café Aurora: Lucía (PIN 1234, manager), Mateo (PIN 5678). Vincula la tablet en local abriendo `/equipo/vincular?t=dev-device-cafe-aurora`.
- Clientes con casos para el motor: María (cumpleaños hoy), Javier (le falta 1 sello), Lucía F. (ausente 21 días), Daniel (premio listo, sin consentimiento), Andreína (es-VE, historia pendiente de validar).

## Estado

- [x] Corte 0: base y diseño
- [x] Corte 1: registro y tarjeta del cliente
- [x] Corte 2: panel del equipo
- [x] Corte 3: panel del dueño y web pública
- [ ] Corte 4: motor de oportunidades
- [ ] Corte 5: métricas
- [ ] Corte 6: pulido y pruebas

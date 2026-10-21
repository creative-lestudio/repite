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
6. **PIN del equipo**: la tablet se vincula primero al local (`staff_devices`, token hasheado) y luego cada empleado elige su nombre y teclea su PIN (bcrypt con pgcrypto, bloqueo 15 min tras 5 fallos).
7. **Configuración por datos**: `locations.settings` (jsonb), `opportunity_rules.params`, `message_templates` (globales con `organization_id = null` + propias del local), `feature_flags`.
8. **Proveedores externos detrás de interfaces** en `src/server/providers` (`MessagingProvider`, `AIProvider`, `PaymentsProvider`, `ReviewsProvider`) y se eligen por variables de entorno. Por defecto: mensajería `mock`, IA `template`.
9. **i18n sin prefijo en la URL** (los QR deben ser cortos y estables). Idioma: cookie `repite_locale` → idioma del local → `Accept-Language` → `es-ES`. `messages/es-VE.json` contiene solo las diferencias respecto a `es-ES.json`.
10. **Tareas programadas**: un único endpoint `/api/cron/tick` (Vercel Cron, cada hora) que procesa los locales cuya hora local ya pasó `settings.opportunity_hour`; `job_runs` (único por job+local+día) garantiza idempotencia.
11. **Rate limiting** en Postgres (`rate_limit_hit`), sin Redis en fase 1.
12. Enumeraciones como `text` + `check` (más fáciles de evolucionar que los `enum` de Postgres).

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
- Cada corte vertical: migración + lógica + UI + pruebas, en un commit.
- No incluir identificadores de modelo de IA en commits ni código salvo en configuración (`ANTHROPIC_MODEL`).

## Datos de demostración (seed)

- Dueño: `demo@repite.app` / `repite-demo` → Café Aurora (`/c/cafe-aurora`), Madrid, EUR, 8 sellos = «Un café gratis».
- Segunda cuenta para probar aislamiento: `sol@repite.app` / `repite-demo` → Panadería Sol (Caracas, USD).
- Equipo Café Aurora: Lucía (PIN 1234, manager), Mateo (PIN 5678). Token de tablet de desarrollo: `dev-device-cafe-aurora`.
- Clientes con casos para el motor: María (cumpleaños hoy), Javier (le falta 1 sello), Lucía F. (ausente 21 días), Daniel (premio listo, sin consentimiento), Andreína (es-VE, historia pendiente de validar).

## Estado

- [x] Corte 0: base y diseño
- [ ] Corte 1: registro y tarjeta del cliente
- [ ] Corte 2: panel del equipo
- [ ] Corte 3: panel del dueño
- [ ] Corte 4: motor de oportunidades
- [ ] Corte 5: métricas
- [ ] Corte 6: pulido y pruebas

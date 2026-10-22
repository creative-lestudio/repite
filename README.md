# Repite

Fidelización y relación con clientes para cafeterías y pequeños locales: tarjeta de sellos por QR sin apps, memoria de cada cliente y mensajes listos para que vuelvan. El dueño aprueba cada mensaje.

## Puesta en marcha (≈ 10 minutos)

Requisitos: Node 20+, pnpm 9 (`corepack enable`), Docker en marcha.

```bash
pnpm install
pnpm db:start            # levanta Supabase local y aplica migraciones + seed
cp .env.example .env.local
```

Copia en `.env.local` los valores que imprime `pnpm exec supabase status`:

- `API URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon key` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key` → `SUPABASE_SERVICE_ROLE_KEY`

Genera los secretos con `openssl rand -hex 32` (`SESSION_SECRET`) y `openssl rand -hex 16` (`CRON_SECRET`). Después:

```bash
pnpm dev                 # http://localhost:3000
```

## Datos de demostración

| Qué                 | Dónde                                                             | Acceso                            |
| ------------------- | ----------------------------------------------------------------- | --------------------------------- |
| Tarjeta del cliente | `/c/cafe-aurora`                                                  | regístrate con cualquier móvil    |
| Panel del equipo    | `/equipo/vincular?t=dev-device-cafe-aurora` y después `/equipo`   | Lucía · PIN `1234`                |
| Web pública         | `/`, `/para/cafeterias`, `/para/restaurantes`, `/para/heladerias` | —                                 |
| Panel del dueño     | `/app`                                                            | `demo@repite.app` / `repite-demo` |
| Sistema de diseño   | `/design`                                                         | —                                 |

Hay una segunda cuenta (`sol@repite.app` / `repite-demo`) para comprobar que una cuenta no ve los datos de otra.

## Pruebas

```bash
pnpm test        # lógica de negocio (Vitest)
pnpm test:db     # seguridad RLS y libro de sellos (pgTAP)
pnpm test:e2e    # flujos completos en móvil de 360 px (Playwright)
```

## Despliegue

Guía paso a paso para no programadores: [`docs/PUBLICAR.md`](./docs/PUBLICAR.md).

1. Crea un proyecto en Supabase y aplica las migraciones: `pnpm exec supabase link --project-ref <ref>` y después `pnpm exec supabase db push`.
2. Importa el repositorio en Vercel y define las variables de `.env.example` con los valores del proyecto.
3. Las tareas programadas (corte 4) se añadirán a `vercel.json`; en el plan Hobby de Vercel solo se permiten tareas diarias.

Más detalles de arquitectura y convenciones en [`CLAUDE.md`](./CLAUDE.md).

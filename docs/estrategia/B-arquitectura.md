# B · Arquitectura

## B.1 Sistema actual

```
 Cliente final (móvil)         Equipo (tablet/móvil)         Dueño (web)
  /c/<local>  PWA               /equipo  PIN + dispositivo     /app  Supabase Auth
        │                              │                            │
        └──────────────┬───────────────┴────────────┬───────────────┘
                       ▼                            ▼
              Next.js 15 en Vercel (región dub1) — Server Actions, Route Handlers
              ├─ src/domain      lógica pura (planes, marca, niveles, métricas, notificaciones…)
              ├─ src/server      acciones, repositorios, wallet, notificaciones, auth
              └─ Cookies firmadas (cliente, tablet, empleado) + JWT de Supabase (dueño)
                       │  service_role (solo repositorios)      │  JWT del usuario (RLS)
                       ▼                                         ▼
              Supabase eu-west-1 · Postgres 17 (RLS forzada, funciones transaccionales), Auth, Storage
                       │
              Servicios opcionales (por variables de entorno): Apple/Google Wallet, Web Push (VAPID),
              Nominatim, [WhatsApp mock]
```

Principios vigentes: multi-tenant por `organization_id`; el libro de sellos es append-only y solo se modifica por funciones Postgres idempotentes; los derechos del plan se calculan en la base de datos (`app.effective_plan`) y se aplican en servidor.

## B.2 Arquitectura objetivo (sin microservicios)

| Área                   | Hoy                                                               | Objetivo                                                                                                                               | Cuándo               |
| ---------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------- |
| Entornos               | Un proyecto Supabase = producción                                 | `staging` (proyecto y despliegue de vista previa) + `production`; migraciones con el mismo script                                      | P0                   |
| Planes y derechos      | Tabla `organizations.plan` + funciones SQL + `src/config/plan.ts` | Igual, más tabla `subscriptions` sincronizada por webhook de Stripe; **la BD sigue siendo la fuente de verdad**                        | P1                   |
| Facturación            | Manual por correo                                                 | Stripe Billing + portal de cliente; IVA gestionado por Stripe Tax o por el titular                                                     | P1                   |
| Tareas programadas     | No hay                                                            | Un endpoint `/api/cron/tick` (Vercel Cron diario en Hobby; GitHub Actions/`pg_cron` si se necesita horario) con `job_runs` idempotente | P1                   |
| Eventos de dominio     | No                                                                | Tabla `domain_events` (outbox) escrita por las funciones del libro; la usarán TPV/analítica/webhooks                                   | P1 (solo el esquema) |
| Mensajería             | Interfaz `MessagingProvider` con `mock`                           | Un adaptador por canal (correo, WhatsApp oficial, Wallet) con cuotas y costes por canal                                                | P2                   |
| Consentimientos        | Marca en `customers`                                              | `consent_events` append-only (finalidad, origen, versión, retirada) + marca derivada                                                   | **P0**               |
| Observabilidad         | Logs de Vercel                                                    | Sentry (errores), registro de latencias, alertas de disponibilidad                                                                     | P1                   |
| Seguridad HTTP         | Cabeceras básicas                                                 | + CSP, `Permissions-Policy` ajustada, HSTS (Vercel)                                                                                    | P1                   |
| Multilocal («Red»)     | Modelo preparado; UI limitada a 1 local                           | Roles por local, panel consolidado, facturación consolidada                                                                            | P2                   |
| API pública / partners | No                                                                | Solo si hay demanda; basada en los mismos casos de uso                                                                                 | P3                   |

## B.3 Decisiones técnicas justificadas

1. **Mantener Next.js + Supabase.** Funciona, está probado y es barato de operar; reescribir retrasaría la primera prueba comercial.
2. **Seguir sin Redis ni colas.** El límite de solicitudes en Postgres y `after()` cubren el volumen de los pilotos. Revisar al superar ~50 comercios activos.
3. **Derechos del plan en la BD y en el servidor, nunca solo en la interfaz.** Ya aplicado a clientes, equipo, tablets, cupones, notificaciones y marca.
4. **Wallet detrás de una interfaz y de variables de entorno.** La tarjeta web es siempre la alternativa funcional.
5. **Demo sin base de datos.** La demostración de la web usa datos ficticios en memoria (no se pueden mezclar con producción ni dar 404).
6. **Supresión por anonimización**, no por borrado físico: el libro de sellos no se puede alterar, así que se elimina la identificación personal y se conserva el agregado.

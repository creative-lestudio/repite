# Cómo publicar Repite en internet (guía para no programadores)

Repite funciona hoy dentro del espacio de trabajo de Claude Code. Para verlo en tu móvil o enseñárselo a clientes hay que **publicarlo**. Se hace con dos servicios gratuitos para empezar:

- **Supabase**: guarda los datos (clientes, sellos, cuentas).
- **Vercel**: muestra la web y la aplicación en una dirección de internet.

Tiempo estimado: 30–45 minutos la primera vez. Nunca copies contraseñas o claves en el chat: se guardan solo en las pantallas de configuración que se indican abajo.

## Paso 1 · Supabase (la base de datos)

1. Entra en https://supabase.com y abre tu organización.
2. Pulsa **New project**. Nombre: `repite`. Región: **West EU (Ireland)** (la más cercana a España).
3. Inventa una **contraseña de base de datos** larga y guárdala en tu gestor de contraseñas. No la compartas.
4. Espera a que termine de crearse (1–2 minutos).
5. Apunta estos tres datos (están en **Project Settings → API**):
   - **Project URL**
   - **anon public key**
   - **service_role key** (es secreta: solo para Vercel)
6. En **Project Settings → General** apunta también el **Project ID** (una cadena de letras).

## Paso 2 · Crear las tablas (lo hace Claude)

Claude Code aplica las migraciones del proyecto a tu base de datos. Para eso necesita dos valores guardados **como variables del entorno**, nunca en el chat:

1. En Claude Code, abre el menú del entorno en la barra del título → **Edit** → **Environment variables** (o _Network secrets_).
2. Añade `SUPABASE_ACCESS_TOKEN` (créalo en Supabase → tu avatar → **Account → Access Tokens**) y `SUPABASE_DB_PASSWORD` (la contraseña del paso 1).
3. Abre una sesión nueva y pide: «Aplica las migraciones a mi proyecto de Supabase con ID …».

## Paso 3 · Vercel (la web)

1. Entra en https://vercel.com con **Continue with GitHub**.
2. **Add New → Project** → elige el repositorio `repite` → **Import**.
3. Antes de pulsar Deploy, despliega **Environment Variables** y añade (nombre → valor):

| Nombre                          | Valor                                                                                               |
| ------------------------------- | --------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_URL`           | la dirección que te dará Vercel (al principio, `https://repite.vercel.app`; puedes cambiarla luego) |
| `NEXT_PUBLIC_SUPABASE_URL`      | Project URL del paso 1                                                                              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key                                                                                     |
| `SUPABASE_SERVICE_ROLE_KEY`     | service_role key                                                                                    |
| `SESSION_SECRET`                | una cadena aleatoria de 64 caracteres (Claude te genera una)                                        |
| `CRON_SECRET`                   | otra cadena aleatoria de 32 caracteres                                                              |

4. Pulsa **Deploy**. En 2–3 minutos tendrás tu dirección.

## Paso 4 · Ajustes de acceso en Supabase

En Supabase → **Authentication → URL Configuration**:

- **Site URL**: la dirección de Vercel.
- **Redirect URLs**: añade `https://tu-direccion.vercel.app/**`.

En **Authentication → Providers → Email**: deja activada la confirmación de correo (así nadie crea cuentas con correos ajenos).

## Paso 5 · Tu dominio `repite.app`

En Vercel → tu proyecto → **Settings → Domains** → añade `repite.app` y sigue las instrucciones para apuntarlo desde donde lo compraste. Después actualiza `NEXT_PUBLIC_APP_URL` y las URLs de Supabase del paso 4.

## Antes de abrirlo al público

- Revisar con un profesional las páginas de **Privacidad** y **Términos** (ahora son un borrador).
- Decidir el **precio** final (está en `src/config/plan.ts`).
- Probar el recorrido completo con tu propio móvil: crear cuenta, descargar el QR, escanearlo, sumar un sello.

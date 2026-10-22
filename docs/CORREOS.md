# Correos de acceso de Repite (Supabase)

Repite entra **sin contraseña**: la persona escribe su correo, recibe un enlace y lo toca. Estos dos pasos se hacen una vez en Supabase.

## 1. Direcciones permitidas

Supabase → **Authentication → URL Configuration**

- **Site URL**: `https://repite-silk.vercel.app` (luego `https://repite.app`)
- **Redirect URLs**: `https://repite-silk.vercel.app/**` (y `http://localhost:3000/**` si pruebas en local)

Si esto falta, el enlace del correo te manda a la portada. Repite lo reenvía a tiempo, pero conviene dejarlo bien.

## 2. Plantillas propias (el enlace funciona desde cualquier dispositivo)

Supabase → **Authentication → Emails → Templates**. En **Confirm signup** y en **Magic Link** usa el mismo texto, cambiando solo `type=signup` por `type=magiclink` en la segunda.

**Asunto:** `Tu enlace para entrar en Repite`

**Contenido (HTML):**

```html
<div style="font-family:Arial,sans-serif;max-width:420px;margin:0 auto;padding:24px;color:#111111">
  <h1 style="font-size:24px;margin:0 0 12px">Entra en Repite</h1>
  <p style="font-size:16px;line-height:1.5">
    Toca el botón y entrarás directo, sin contraseña. El enlace vale una hora.
  </p>
  <p style="margin:24px 0">
    <a
      href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&siguiente=/app/empezar"
      style="background:#c9281b;color:#ffffff;padding:14px 24px;border-radius:10px;text-decoration:none;font-weight:bold;display:inline-block"
      >Entrar en Repite</a
    >
  </p>
  <p style="font-size:13px;color:#6b655e">Si no lo has pedido tú, ignora este correo. Buena comida, más veces.</p>
</div>
```

## 3. Remitente «Repite» (pendiente del dominio)

Con el correo gratuito de Supabase el remitente siempre es «Supabase Auth». Para que salga «Repite <hola@repite.app>» hace falta conectar `repite.app` y un servicio de envío (Resend): **Authentication → Emails → SMTP Settings**.

## 4. Entrar con Google

1. Google Cloud Console → _APIs y servicios → Credenciales → ID de cliente de OAuth_ (aplicación web). En «URI de redirección» pega la dirección `…/auth/v1/callback` que muestra Supabase.
2. Supabase → **Authentication → Providers → Google**: activa, pega el ID y el secreto.

# Tarjeta de sellos en Apple Wallet y Google Wallet

Con esto, el cliente toca «Añadir a Apple Wallet» (iPhone) o «Añadir a Google Wallet» (Android) y la tarjeta queda en su móvil, con el QR para enseñar. Cuando el equipo suma un sello, la tarjeta se actualiza sola.

El código ya está hecho. **Los botones solo aparecen cuando rellenas las claves de abajo** (si no, la app funciona igual que hasta ahora). Puedes activar una plataforma sin la otra.

> Las claves van en Vercel → _Settings → Environment Variables_, marcadas como **Sensitive**. Nunca en el chat ni en el repositorio.

## Google Wallet (gratis, ~20 min)

1. Entra en <https://pay.google.com/business/console> con tu cuenta de Google y crea el perfil de empresa (nombre: Repite). Anota el **Issuer ID** (un número largo).
2. En <https://console.cloud.google.com> crea un proyecto → _APIs y servicios_ → activa **Google Wallet API**.
3. _IAM y administración → Cuentas de servicio_ → crea una (nombre «repite-wallet») → _Claves_ → **Crear clave nueva → JSON**. Se descarga un archivo.
4. De vuelta en la consola de Google Wallet → _Usuarios_ → invita el correo de esa cuenta de servicio (`…@…iam.gserviceaccount.com`) con permiso de **Desarrollador**.
5. Convierte el JSON a una sola línea en base64. En el Terminal del Mac: `base64 -i ruta/al/archivo.json | tr -d '\n' | pbcopy` (queda copiado).
6. En Vercel añade:
   - `GOOGLE_WALLET_ISSUER_ID` = el número del paso 1
   - `GOOGLE_WALLET_SERVICE_ACCOUNT` = lo copiado en el paso 5
7. Redespliega. En modo «demo» Google solo deja guardar tarjetas a los correos que añadas como _Probadores_ en la consola; para abrirlo a todo el mundo pide la **aprobación** (formulario en la misma consola, suele tardar unos días).

## Apple Wallet (necesita cuenta de pago de Apple: 99 USD/año)

1. Apúntate al **Apple Developer Program** en <https://developer.apple.com/programs/>.
2. En _Certificates, Identifiers & Profiles → Identifiers_ crea un **Pass Type ID**, por ejemplo `pass.app.repite`.
3. Crea su certificado (_Create Certificate_). Apple te pide un archivo CSR: en el Mac, _Acceso a Llaveros → Asistente de certificados → Solicitar un certificado a una autoridad_ y guárdalo en disco. Sube el CSR, descarga el `.cer` e instálalo (doble clic).
4. En Acceso a Llaveros, exporta ese certificado como `.p12` (con una contraseña que elijas).
5. Convierte a PEM en el Terminal (cambia las rutas y la contraseña):
   ```
   openssl pkcs12 -in pass.p12 -clcerts -nokeys -out cert.pem
   openssl pkcs12 -in pass.p12 -nocerts -out key.pem
   ```
   La segunda pide una contraseña para proteger la clave: es `APPLE_WALLET_KEY_PASSPHRASE`.
6. Descarga el certificado intermedio **WWDR G4** de <https://www.apple.com/certificateauthority/> y conviértelo: `openssl x509 -inform der -in AppleWWDRCAG4.cer -out wwdr.pem`.
7. En Vercel añade (cada archivo en base64: `base64 -i cert.pem | tr -d '\n' | pbcopy`):
   - `APPLE_WALLET_PASS_TYPE_ID` = `pass.app.repite`
   - `APPLE_WALLET_TEAM_ID` = tu Team ID (en la cuenta de Apple Developer → _Membership_)
   - `APPLE_WALLET_CERT_PEM` = `cert.pem` en base64
   - `APPLE_WALLET_KEY_PEM` = `key.pem` en base64
   - `APPLE_WALLET_KEY_PASSPHRASE` = la contraseña del paso 5
   - `APPLE_WALLET_WWDR_PEM` = `wwdr.pem` en base64
8. Redespliega.

## Qué lleva la tarjeta

- Sellos, premio y QR personal; el **nivel VIP** y el **cupón** disponibles (si los hay).
- Con **Plus** y las coordenadas del local (Ajustes → «Aviso al pasar cerca del local»), la tarjeta aparece en la pantalla de bloqueo al pasar cerca. Apple y Google deciden el momento exacto y pueden limitar la frecuencia.

## Cómo funciona

- El cliente (con su sesión iniciada) toca el botón: `/c/<local>/wallet/apple` descarga el `.pkpass`; `/c/<local>/wallet/google` abre el guardado de Google.
- La tarjeta muestra el local, los sellos (`●●●○○○○○`), el premio y el **QR personal** del cliente, el mismo que lee el equipo.
- Cada vez que el equipo registra una visita, deshace, valida sellos extra o canjea un premio, Repite avisa a Apple (aviso push al dispositivo, que recoge la versión nueva) y actualiza el objeto en Google por API. Los fallos de Wallet nunca bloquean el registro de la visita.
- Apple: dispositivos guardados en `wallet_registrations` (solo accesible por el servidor). El `webServiceURL` es `<APP_URL>/api/wallet/apple`.

## Probar sin esperar a la aprobación

- Google: añade tu correo como _Probador_ y prueba con una cuenta de Google en un Android.
- Apple: con el certificado ya funciona en tu iPhone real. En el simulador de iOS no se pueden añadir tarjetas.

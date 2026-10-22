# Notificaciones al móvil

El dueño las gestiona en el panel → **Notificaciones**: elige una plantilla (o escribe la suya), un segmento de clientes y envía. Solo reciben el aviso los clientes que dieron permiso para comunicaciones, y nunca más de uno cada «Días mínimos entre dos mensajes» (Ajustes).

## Por dónde llega el aviso

| Canal               | Quién lo recibe                            | Qué necesitas                       |
| ------------------- | ------------------------------------------ | ----------------------------------- |
| Aviso en la tarjeta | Todos los del segmento al abrir su tarjeta | Nada                                |
| Apple Wallet        | Quien guardó la tarjeta en Apple Wallet    | Claves de Apple (`docs/WALLET.md`)  |
| Google Wallet       | Quien guardó la tarjeta en Google Wallet   | Claves de Google (`docs/WALLET.md`) |
| Avisos web          | Quien pulsó «Activar avisos» en su tarjeta | Claves VAPID (abajo)                |

En iPhone los avisos web solo funcionan si la web está añadida a la pantalla de inicio; por eso el canal recomendado es Wallet.

## Avisos web: claves VAPID (5 minutos)

1. En el Terminal del Mac: `npx web-push generate-vapid-keys` (te imprime dos claves).
2. En Vercel → _Settings → Environment Variables_ añade:
   - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = la clave pública
   - `VAPID_PRIVATE_KEY` = la clave privada (márcala como **Sensitive**)
   - `VAPID_SUBJECT` = `mailto:` + tu correo de contacto
3. Redespliega.

## Qué incluye cada plan

- **Starter**: no incluye notificaciones.
- **Basic**: 4 envíos al mes, plantillas de Repite y segmentos básicos (todos, nuevos, sin venir, cumpleaños).
- **Plus**: sin límite, todos los segmentos (a pocos sellos del premio, con premio por canjear, frecuentes, por nivel VIP, con cupón) y plantillas propias.

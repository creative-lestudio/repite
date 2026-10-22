# Repite · dónde estamos y hacia dónde vamos

Última revisión: 23 de octubre de 2026.

## 1. Dónde estamos

| Bloque                                                                                              | Estado                                                |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Cliente: registro por QR, tarjeta de sellos animada, premios, sellos extra, historial, PWA          | ✅ Hecho                                              |
| Equipo: tablet vinculada, PIN, buscar/escanear, registrar visita, canjear, validar extras, deshacer | ✅ Hecho                                              |
| Dueño: cuenta, asistente de alta, clientes + CSV, programa, equipo y tablets, QR + PDF, ajustes     | ✅ Hecho                                              |
| Plan Gratis (50 clientes) + prueba de 30 días                                                       | ✅ Hecho                                              |
| Web pública con precios, preguntas y alta                                                           | ✅ Hecho (primera versión)                            |
| Seguridad entre cuentas (RLS) y libro de sellos a prueba de duplicados                              | ✅ Hecho y probado                                    |
| Base de datos de producción (Supabase)                                                              | ✅ Creada y verificada                                |
| Publicación en Vercel                                                                               | ✅ Desplegada, **falta comprobarla de punta a punta** |
| Correo de confirmación, dominio `repite.app`, textos legales, precio final                          | ⏳ Pendiente                                          |
| Motor de oportunidades (cumpleaños, ausencias, premio cercano) + mensajes                           | ⏳ Corte 4                                            |
| Métricas del dueño                                                                                  | ⏳ Corte 5                                            |
| Pulido, accesibilidad (Lighthouse ≥ 90) y pruebas finales                                           | ⏳ Corte 6                                            |
| WhatsApp real, IA real, cobros                                                                      | ⏳ Fase 2                                             |

Avance de la fase 1: cuatro de siete bloques grandes terminados (cortes 0–3 y publicación inicial).

## 2. Revisión del diseño de la web

**Lo que funciona:** limpia, rápida, accesible, sin desbordes a 360 px, con capturas reales del producto y precios claros.

**Lo que hay que mejorar para que destaque:**

1. Parece una plantilla correcta pero genérica: todas las secciones usan el mismo tipo de tarjeta blanca sobre fondo claro. Falta un momento memorable.
2. No hay logotipo: solo la palabra «Repite». Hace falta una marca (el sello estampado es la idea natural).
3. Las capturas del panel son densas y el texto es ilegible. Mejor recortes grandes de una sola cosa, con una frase al lado.
4. Las seis ventajas se ven iguales. Falta jerarquía: una principal y las demás de apoyo.
5. No hay prueba social todavía (no hay clientes reales). No se inventa: se sustituye por una demostración interactiva y, cuando existan, testimonios reales.
6. En móvil no se ve la captura del teléfono ni hay un botón fijo de «Empezar gratis».
7. Todo está pensado para cafeterías (ver sección 3).

## 3. Que sirva para cualquier local

Hoy el producto es neutro en el fondo, pero **la ropa es de cafetería**: el icono del sello es una taza, el ejemplo es «Café Aurora», el titular habla de cafeterías, el cierre dice «tomando café» y el mensaje de respaldo dice «un café».

Plan:

- **Tipo de negocio** (cafetería, restaurante, panadería, peluquería, barbería, estética/uñas, tienda, gimnasio/estudio, lavandería, otro). Se pregunta en el alta y cambia: icono del sello, ejemplos de premio, vocabulario («visita», «cita», «compra»; «lo de siempre» en vez de «pedido habitual») y plantillas de mensaje.
- **Web**: titular universal («Que tus clientes vuelvan» ya lo es), selector de sector en la portada que cambia el móvil de ejemplo, sección «Para qué negocios» y, más adelante, una página por sector para buscadores (`/para/peluquerias`, `/para/restaurantes`…).
- **Producto**: el cliente final puede ver el icono y el color del local; el dueño puede subir su logotipo.

## 4. Roadmap

### Fase A · Salir al mundo (lo primero; hay cosas que dependen de ti)

1. Comprobar la web publicada de punta a punta: crear cuenta, descargar QR, escanear, sumar sello.
2. Supabase → Authentication → **URL Configuration** (dirección de Vercel).
3. **Correo propio** (Resend o Brevo) para los correos de confirmación: el integrado de Supabase solo envía unos pocos por hora y solo a tu equipo.
4. **Dominio `repite.app`** conectado a Vercel.
5. Textos legales revisados por un profesional, con los datos de tu empresa.
6. Decidir el precio final.
7. Avisos de errores y estadísticas de visitas sin cookies (para saber si algo falla).

### Fase B · Generalizar y elevar el diseño — ✅ hecha (23 oct)

1. Tipo de negocio en el alta y en la base de datos, con presets por sector.
2. Sello con icono configurable y logotipo del local en la tarjeta del cliente.
3. Rediseño de la web: marca, selector de sector, demostración interactiva, recortes del producto, animaciones suaves (respetando «reducir movimiento»), botón fijo en móvil.
4. Páginas por sector (SEO).

### Fase C · Terminar la fase 1 (cortes 4, 5 y 6)

1. **Corte 4 · Motor de oportunidades**: cumpleaños, ausencia, premio cercano y premio listo; mensaje redactado, editable; «Aprobar y enviar», «Programar», «Descartar»; límite de un mensaje cada N días. Mensajería simulada.
2. **Corte 5 · Métricas**: clientes nuevos, visitas, clientes que vuelven, premios canjeados, mensajes enviados.
3. **Corte 6 · Pulido**: Lighthouse de accesibilidad ≥ 90, pruebas de seguridad ampliadas, estados vacíos, rendimiento.

### Fase D · Mundo real (fase 2 del documento original)

1. **WhatsApp real** (API de Meta con plantillas aprobadas). Requiere una cuenta de empresa verificada en Meta, que **tarda semanas**: conviene iniciarla ya.
2. Redacción de mensajes con la IA de Claude.
3. **Cobros**: Stripe para Europa. Venezuela necesita otra vía (Stripe no opera allí): pago móvil, Zinli, Binance Pay u otra; decidir.
4. Notificaciones de la PWA y verificación semiautomática de reseñas de Google.

### Fase E · Crecimiento (fase 3)

Varios locales por cuenta, Apple/Google Wallet, niveles de cliente y referidos, campañas segmentadas, analítica avanzada, integración con cajas, API pública, marca blanca para agencias y panel de administración de Repite.

## 5. Decisiones que necesito de ti

1. ~~Sectores prioritarios~~: decididos — **cafeterías, restaurantes y heladerías** (peluquerías, panaderías, tiendas… entran como «otro»).
2. **Precio final** y qué incluye el plan de pago (ahora: clientes sin límite + oportunidades y mensajes).
3. **Datos de tu empresa** para los textos legales y las facturas.
4. **Cuenta de empresa de Meta** para WhatsApp (empezar cuanto antes por los plazos).
5. **Plan de Vercel**: el gratuito (Hobby) no permite uso comercial; al cobrar hará falta el plan Pro.

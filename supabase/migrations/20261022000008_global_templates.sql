-- Repite · plantillas globales de mensajes (respaldo para todos los locales)
-- Van en una migración y no en el seed porque también las necesita producción.

insert into public.message_templates (organization_id, type, locale, body) values
  (null, 'birthday', 'es-ES', '¡Feliz cumpleaños, {{nombre}}! 🎉 En {{local}} queremos celebrarlo contigo: pásate hoy y te invitamos a tu {{pedido}}.'),
  (null, 'birthday', 'es-VE', '¡Feliz cumpleaños, {{nombre}}! 🎉 En {{local}} queremos celebrarlo contigo: pásate hoy y te consentimos con tu {{pedido}}.'),
  (null, 'inactive', 'es-ES', 'Hola, {{nombre}}. Hace tiempo que no te vemos por {{local}} y te echamos de menos. ¿Te apetece un {{pedido}} esta semana?'),
  (null, 'inactive', 'es-VE', 'Hola, {{nombre}}. Hace rato que no te vemos por {{local}} y te extrañamos. ¿Te provoca un {{pedido}} esta semana?'),
  (null, 'near_reward', 'es-ES', '{{nombre}}, ¡solo te falta un sello para {{premio}}! Te esperamos en {{local}}.'),
  (null, 'near_reward', 'es-VE', '{{nombre}}, ¡te falta un solo sello para {{premio}}! Te esperamos en {{local}}.'),
  (null, 'reward_ready', 'es-ES', '{{nombre}}, tienes {{premio}} esperándote en {{local}}. Pásate cuando quieras a recogerlo.'),
  (null, 'reward_ready', 'es-VE', '{{nombre}}, tienes {{premio}} esperándote en {{local}}. Pásate cuando quieras a buscarlo.'),
  (null, 'magic_link', 'es-ES', 'Hola, {{nombre}}. Abre este enlace para recuperar tu tarjeta de {{local}}: {{enlace}}'),
  (null, 'magic_link', 'es-VE', 'Hola, {{nombre}}. Abre este enlace para recuperar tu tarjeta de {{local}}: {{enlace}}')
on conflict (coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), type, locale) where deleted_at is null
do nothing;

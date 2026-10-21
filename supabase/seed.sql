-- Repite · datos de demostración
-- Dueño demo:  demo@repite.app / repite-demo   → Café Aurora (Madrid, EUR)
-- Segunda cuenta (para probar aislamiento): sol@repite.app / repite-demo → Panadería Sol (Caracas, USD)
-- Equipo Café Aurora: Lucía (PIN 1234), Mateo (PIN 5678)
-- Tablet de desarrollo: token "dev-device-cafe-aurora" (ver /equipo en local)

-- Usuarios de Auth
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'demo@repite.app', extensions.crypt('repite-demo', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Ana Demo"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'sol@repite.app', extensions.crypt('repite-demo', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"name":"Carlos Sol"}', now(), now(), '', '', '', '');

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
values
  (gen_random_uuid(), '11111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@repite.app"}', 'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-4222-8222-222222222222', '22222222-2222-4222-8222-222222222222',
   '{"sub":"22222222-2222-4222-8222-222222222222","email":"sol@repite.app"}', 'email', now(), now(), now());

-- Organizaciones y locales
insert into public.organizations (id, name, country, currency, onboarding) values
  ('a0000000-0000-4000-8000-000000000001', 'Café Aurora', 'ES', 'EUR',
   '{"account":true,"location":true,"program":true,"qr":true}'),
  ('b0000000-0000-4000-8000-000000000001', 'Panadería Sol', 'VE', 'USD',
   '{"account":true,"location":true,"program":true}');

insert into public.locations (id, organization_id, name, slug, address, timezone, locale, settings) values
  ('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-000000000001', 'Café Aurora', 'cafe-aurora',
   'Calle de la Luna 12, Madrid', 'Europe/Madrid', 'es-ES',
   '{"stamp_cooldown_hours":4,"message_min_days":7,"opportunity_hour":9,"tone":"cercano y alegre","contact_whatsapp":"+34600000000"}'),
  ('b0000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-000000000001', 'Panadería Sol', 'panaderia-sol',
   'Av. Francisco de Miranda, Caracas', 'America/Caracas', 'es-VE',
   '{"stamp_cooldown_hours":4,"message_min_days":7,"opportunity_hour":9,"tone":"cálido"}');

insert into public.memberships (user_id, organization_id, role) values
  ('11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'owner'),
  ('22222222-2222-4222-8222-222222222222', 'b0000000-0000-4000-8000-000000000001', 'owner');

-- Programas
insert into public.loyalty_programs (id, organization_id, stamps_required, reward_name, reward_description, reward_expiry_days) values
  ('a0000000-0000-4000-8000-0000000000c1', 'a0000000-0000-4000-8000-000000000001', 8, 'Un café gratis',
   'Cualquier café de la carta, del tamaño que quieras.', 60),
  ('b0000000-0000-4000-8000-0000000000c1', 'b0000000-0000-4000-8000-000000000001', 10, 'Un cachito gratis', null, null);

-- Reglas de oportunidad
insert into public.opportunity_rules (organization_id, type, params)
select o.id, r.type, r.params::jsonb
from public.organizations o
cross join (values ('birthday', '{}'), ('inactive', '{"days":14}'), ('near_reward', '{"missing":1}'),
                   ('reward_ready', '{"remind_after_days":3}')) as r(type, params);

-- Equipo y tablet
insert into public.staff_members (id, organization_id, display_name, role) values
  ('a0000000-0000-4000-8000-0000000000d1', 'a0000000-0000-4000-8000-000000000001', 'Lucía', 'manager'),
  ('a0000000-0000-4000-8000-0000000000d2', 'a0000000-0000-4000-8000-000000000001', 'Mateo', 'staff'),
  ('b0000000-0000-4000-8000-0000000000d1', 'b0000000-0000-4000-8000-000000000001', 'Rosa', 'manager');

select public.set_staff_pin('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d1', '1234');
select public.set_staff_pin('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d2', '5678');
select public.set_staff_pin('b0000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-0000000000d1', '1234');

insert into public.staff_devices (organization_id, location_id, name, token_hash) values
  ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000a1', 'Tablet de la barra',
   encode(extensions.digest('dev-device-cafe-aurora', 'sha256'), 'hex')),
  ('b0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-0000000000b1', 'Tablet',
   encode(extensions.digest('dev-device-panaderia-sol', 'sha256'), 'hex'));

-- Plantillas globales de respaldo
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
  (null, 'magic_link', 'es-VE', 'Hola, {{nombre}}. Abre este enlace para recuperar tu tarjeta de {{local}}: {{enlace}}');

-- Clientes de Café Aurora con historial variado
insert into public.customers (id, organization_id, name, phone_e164, birthday, locale, marketing_consent, consent_at,
  consent_source, usual_order, first_location_id, created_at) values
  ('a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-000000000001', 'María López', '+34611111111',
   current_date - interval '29 years', 'es-ES', true, now() - interval '60 days', 'qr_signup', 'flat white con avena',
   'a0000000-0000-4000-8000-0000000000a1', now() - interval '60 days'),
  ('a0000000-0000-4000-8000-0000000000e2', 'a0000000-0000-4000-8000-000000000001', 'Javier Ruiz', '+34622222222',
   '1988-03-14', 'es-ES', true, now() - interval '50 days', 'qr_signup', 'cortado',
   'a0000000-0000-4000-8000-0000000000a1', now() - interval '50 days'),
  ('a0000000-0000-4000-8000-0000000000e3', 'a0000000-0000-4000-8000-000000000001', 'Lucía Fernández', '+34633333333',
   null, 'es-ES', true, now() - interval '40 days', 'qr_signup', 'té chai',
   'a0000000-0000-4000-8000-0000000000a1', now() - interval '40 days'),
  ('a0000000-0000-4000-8000-0000000000e4', 'a0000000-0000-4000-8000-000000000001', 'Daniel Pérez', '+34644444444',
   '1995-11-02', 'es-ES', false, null, null, 'americano y croissant',
   'a0000000-0000-4000-8000-0000000000a1', now() - interval '35 days'),
  ('a0000000-0000-4000-8000-0000000000e5', 'a0000000-0000-4000-8000-000000000001', 'Andreína Torres', '+584121234567',
   '1992-07-21', 'es-VE', true, now() - interval '30 days', 'qr_signup', 'capuchino',
   'a0000000-0000-4000-8000-0000000000a1', now() - interval '30 days'),
  ('a0000000-0000-4000-8000-0000000000e6', 'a0000000-0000-4000-8000-000000000001', 'Pablo Martín', '+34655555555',
   null, 'es-ES', true, now() - interval '5 days', 'qr_signup', null,
   'a0000000-0000-4000-8000-0000000000a1', now() - interval '5 days');

-- Cliente de la otra cuenta (no debe verse nunca desde Café Aurora)
insert into public.customers (organization_id, name, phone_e164, locale, marketing_consent, first_location_id) values
  ('b0000000-0000-4000-8000-000000000001', 'Cliente de Sol', '+584149999999', 'es-VE', true, 'b0000000-0000-4000-8000-0000000000b1');

-- Visitas: (cliente, nº de visitas, días desde la primera, días desde la última)
do $$
declare
  r record;
  i int;
  ts timestamptz;
  ev uuid;
begin
  for r in select * from (values
    ('a0000000-0000-4000-8000-0000000000e1'::uuid, 11, 58, 1),   -- premio emitido y 3 sellos
    ('a0000000-0000-4000-8000-0000000000e2'::uuid, 7, 48, 2),    -- le falta 1 sello
    ('a0000000-0000-4000-8000-0000000000e3'::uuid, 4, 40, 21),   -- ausente 21 días
    ('a0000000-0000-4000-8000-0000000000e4'::uuid, 8, 34, 3),    -- premio listo
    ('a0000000-0000-4000-8000-0000000000e5'::uuid, 3, 28, 0),    -- vino hoy
    ('a0000000-0000-4000-8000-0000000000e6'::uuid, 1, 5, 5)
  ) as t(cid, n, first_days, last_days) loop
    for i in 1..r.n loop
      ts := now() - make_interval(days => r.first_days)
            + (make_interval(days => r.first_days - r.last_days) * ((i - 1)::numeric / greatest(r.n - 1, 1)));
      insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity,
        created_by_staff, idempotency_key, created_at)
      values ('a0000000-0000-4000-8000-000000000001', r.cid, 'a0000000-0000-4000-8000-0000000000a1',
        'a0000000-0000-4000-8000-0000000000c1', 'visit', 1,
        case when i % 2 = 0 then 'a0000000-0000-4000-8000-0000000000d1'::uuid else 'a0000000-0000-4000-8000-0000000000d2'::uuid end,
        'seed:' || r.cid || ':' || i, ts)
      returning id into ev;
      perform app.issue_rewards_if_full(r.cid, 'a0000000-0000-4000-8000-0000000000c1', 'a0000000-0000-4000-8000-0000000000a1', ev);
    end loop;
    update public.customers set last_visit_at = ts where id = r.cid;
  end loop;
end $$;

-- María ya canjeó su primer premio
do $$
declare rw uuid;
begin
  select id into rw from public.rewards where customer_id = 'a0000000-0000-4000-8000-0000000000e1' limit 1;
  perform public.redeem_reward(rw, 'a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d1', 'seed:redeem:maria');
end $$;

-- Un sello extra pendiente de validar (historia de Andreína)
select public.request_bonus('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000e5', 'bonus_story',
  '{"note":"Subió una historia con la latte art"}', 'seed:bonus:andreina');

insert into public.customer_notes (organization_id, customer_id, author_staff_id, text, pinned) values
  ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-0000000000d1',
   'Intolerante a la lactosa: siempre bebida vegetal.', true),
  ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000e2', 'a0000000-0000-4000-8000-0000000000d2',
   'Viene con su perro, Toby. Le encanta la terraza.', false);

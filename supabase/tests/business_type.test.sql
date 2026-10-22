-- Tipo de negocio: valores válidos, valor por defecto y alta con tipo desconocido.
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select is((select business_type from public.locations where slug = 'cafe-aurora'), 'cafeteria', 'la demo es una cafetería');
select is((select business_type from public.locations where slug = 'panaderia-sol'), 'otro', 'otro por defecto');

select throws_ok(
  $$update public.locations set business_type = 'peluqueria' where slug = 'cafe-aurora'$$,
  '23514', null, 'un tipo fuera de la lista se rechaza');

-- Alta de cuenta con tipo válido y con tipo desconocido (se normaliza a «otro»)
insert into auth.users (id, aud, role, email) values
  ('c0000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'helado@example.com'),
  ('c0000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'raro@example.com');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select public.create_organization_with_owner('Polo Norte', 'ES', 'EUR', 'Polo Norte', 'polo-norte-test', 'Europe/Madrid', 'es-ES', 'heladeria');
reset role;
select is((select business_type from public.locations where slug = 'polo-norte-test'), 'heladeria', 'el alta guarda el tipo de negocio');

select set_config('request.jwt.claims', '{"sub":"c0000000-0000-4000-8000-000000000002","role":"authenticated"}', true);
set local role authenticated;
select public.create_organization_with_owner('Raro', 'ES', 'EUR', 'Raro', 'raro-test', 'Europe/Madrid', 'es-ES', 'nave-espacial');
reset role;
select is((select business_type from public.locations where slug = 'raro-test'), 'otro', 'un tipo desconocido se guarda como otro');

select is((select count(*)::int from public.opportunity_rules where organization_id = (select organization_id from public.locations where slug = 'polo-norte-test')), 4, 'el alta crea las 4 reglas de oportunidad');

select * from finish();
rollback;

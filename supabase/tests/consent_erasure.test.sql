-- Consentimientos (historial append-only) y derechos del cliente (exportar y borrar por anonimización).
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

insert into public.customers (id, organization_id, name, phone_e164, marketing_consent, consent_source)
values ('d0000000-0000-4000-8000-0000000000c1', 'a0000000-0000-4000-8000-000000000001', 'Ana Prueba', '+34677000001', true, 'qr_signup');
select is((select count(*)::int from public.consent_events where customer_id = 'd0000000-0000-4000-8000-0000000000c1' and granted), 1, 'el alta con permiso queda registrada');
update public.customers set marketing_consent = false, consent_source = 'customer_opt_out' where id = 'd0000000-0000-4000-8000-0000000000c1';
select is((select count(*)::int from public.consent_events where customer_id = 'd0000000-0000-4000-8000-0000000000c1' and not granted and origin = 'customer_opt_out'), 1, 'la retirada queda registrada con su origen');
select throws_ok($$delete from public.consent_events$$, 'P0001', null, 'el historial no se borra');
select throws_ok($$update public.consent_events set granted = true$$, 'P0001', null, 'el historial no se edita');

-- El dueño de Aurora exporta y borra; el de Sol no puede
select set_config('request.jwt.claims', '{"sub":"22222222-2222-4222-8222-222222222222","role":"authenticated"}', true);
set local role authenticated;
select throws_ok($$select public.export_customer_data('d0000000-0000-4000-8000-0000000000c1')$$, '42501', null, 'otro negocio no puede exportar');
select throws_ok($$select public.erase_customer('d0000000-0000-4000-8000-0000000000c1')$$, '42501', null, 'otro negocio no puede borrar');
reset role;

select set_config('request.jwt.claims', '{"sub":"11111111-1111-4111-8111-111111111111","role":"authenticated"}', true);
set local role authenticated;
select is((public.export_customer_data('d0000000-0000-4000-8000-0000000000c1')->'cliente'->>'nombre'), 'Ana Prueba', 'el dueño exporta los datos del cliente');
select is(jsonb_array_length(public.export_customer_data('d0000000-0000-4000-8000-0000000000c1')->'consentimientos'), 2, 'la exportación incluye el historial de consentimientos');
select lives_ok($$select public.erase_customer('d0000000-0000-4000-8000-0000000000c1')$$, 'el dueño borra al cliente');
reset role;
select is((select name from public.customers where id = 'd0000000-0000-4000-8000-0000000000c1'), 'Cliente eliminado', 'queda anonimizado');
select ok((select deleted_at is not null and not marketing_consent and phone_e164 <> '+34677000001' from public.customers where id = 'd0000000-0000-4000-8000-0000000000c1'), 'sin teléfono ni permiso y marcado como eliminado');

select * from finish();
rollback;

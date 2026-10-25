-- Consentimientos con historial y derechos del cliente (acceso/portabilidad y supresión).
-- consent_events es append-only: cada alta o retirada del permiso de comunicaciones queda registrada
-- por un trigger sobre customers, así ningún camino de la aplicación puede olvidarla.

create table public.consent_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  purpose text not null check (purpose in ('marketing')),
  granted boolean not null,
  origin text not null,
  text_version text not null default 'v1',
  created_at timestamptz not null default now()
);
create index on public.consent_events (customer_id, created_at);
create index on public.consent_events (organization_id, created_at desc);

alter table public.consent_events enable row level security;
alter table public.consent_events force row level security;
create policy consent_events_select on public.consent_events for select to authenticated
  using (app.is_member(organization_id));
revoke all on public.consent_events from anon, authenticated;
grant select on public.consent_events to authenticated;

create or replace function app.consent_events_immutable() returns trigger
language plpgsql as $$
begin
  raise exception 'consent_events es de solo añadir' using errcode = 'P0001';
end $$;
create trigger consent_events_no_update before update or delete on public.consent_events
  for each row execute function app.consent_events_immutable();

create or replace function app.log_consent() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if new.marketing_consent then
      insert into public.consent_events (organization_id, customer_id, purpose, granted, origin)
      values (new.organization_id, new.id, 'marketing', true, coalesce(new.consent_source, 'unknown'));
    end if;
  elsif new.marketing_consent is distinct from old.marketing_consent then
    insert into public.consent_events (organization_id, customer_id, purpose, granted, origin)
    values (new.organization_id, new.id, 'marketing', new.marketing_consent,
            coalesce(new.consent_source, case when new.marketing_consent then 'unknown' else 'opt_out' end));
  end if;
  return null;
end $$;
create trigger customers_log_consent after insert or update of marketing_consent on public.customers
  for each row execute function app.log_consent();

-- Histórico de los consentimientos que ya existían
insert into public.consent_events (organization_id, customer_id, purpose, granted, origin, created_at)
select organization_id, id, 'marketing', true, coalesce(consent_source, 'unknown'), coalesce(consent_at, created_at)
from public.customers where marketing_consent;

-- Datos de un cliente para entregárselos (acceso y portabilidad). Solo owner/manager de su organización.
create or replace function public.export_customer_data(p_customer uuid) returns jsonb
language plpgsql security definer set search_path = public, app as $$
declare c public.customers;
begin
  select * into c from public.customers where id = p_customer;
  if not found or not coalesce(app.can_manage(c.organization_id), false) then raise exception 'forbidden' using errcode = '42501'; end if;
  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id)
    values (c.organization_id, 'user', auth.uid(), 'customer.export', 'customer', c.id);
  return jsonb_build_object(
    'generado', now(),
    'cliente', jsonb_build_object('nombre', c.name, 'telefono', c.phone_e164, 'cumpleanos', c.birthday,
      'idioma', c.locale, 'pedido_habitual', c.usual_order, 'alta', c.created_at, 'ultima_visita', c.last_visit_at,
      'comunicaciones_aceptadas', c.marketing_consent),
    'consentimientos', coalesce((select jsonb_agg(jsonb_build_object('finalidad', e.purpose, 'concedido', e.granted,
        'origen', e.origin, 'version_texto', e.text_version, 'fecha', e.created_at) order by e.created_at)
      from public.consent_events e where e.customer_id = c.id), '[]'::jsonb),
    'sellos', coalesce((select jsonb_agg(jsonb_build_object('tipo', s.type, 'cantidad', s.quantity,
        'estado', s.validation_status, 'fecha', s.created_at) order by s.created_at)
      from public.stamp_events s where s.customer_id = c.id), '[]'::jsonb),
    'notas', coalesce((select jsonb_agg(jsonb_build_object('texto', n.text, 'fecha', n.created_at) order by n.created_at)
      from public.customer_notes n where n.customer_id = c.id), '[]'::jsonb)
  );
end $$;

-- Supresión por anonimización: se quitan los datos personales y se conserva el libro (cifras sin identidad).
create or replace function public.erase_customer(p_customer uuid) returns void
language plpgsql security definer set search_path = public, app, extensions as $$
declare c public.customers;
begin
  select * into c from public.customers where id = p_customer;
  if not found or not coalesce(app.can_manage(c.organization_id), false) then raise exception 'forbidden' using errcode = '42501'; end if;
  if c.deleted_at is not null then return; end if;

  delete from public.customer_sessions where customer_id = c.id;
  delete from public.magic_links where customer_id = c.id;
  delete from public.customer_notes where customer_id = c.id;
  delete from public.opportunities where customer_id = c.id;
  delete from public.messages where customer_id = c.id;
  delete from public.push_subscriptions where customer_id = c.id;
  delete from public.wallet_registrations where customer_id = c.id;

  update public.customers set
    name = 'Cliente eliminado',
    phone_e164 = '+9' || lpad((floor(random() * 1e12))::bigint::text, 12, '0'),
    birthday = null, usual_order = null, notes_summary = null,
    marketing_consent = false, consent_source = 'erasure',
    qr_token = encode(extensions.gen_random_bytes(16), 'hex'),
    deleted_at = now()
  where id = c.id;

  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id)
    values (c.organization_id, 'user', auth.uid(), 'customer.erase', 'customer', c.id);
end $$;

revoke execute on function public.export_customer_data(uuid), public.erase_customer(uuid) from public, anon;
grant execute on function public.export_customer_data(uuid), public.erase_customer(uuid) to authenticated;

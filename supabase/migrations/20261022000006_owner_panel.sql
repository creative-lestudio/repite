-- Repite · panel del dueño: alta de cuenta, estadísticas de clientes y vistas para el dueño

-- ¿Está libre este enlace /c/<slug>? (los locales de otras cuentas no son visibles por RLS)
create or replace function public.slug_available(p_slug text) returns boolean
language sql stable security definer set search_path = public as $$
  select p_slug ~ '^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$'
    and p_slug not in ('app', 'equipo', 'admin', 'api', 'entrar', 'registro', 'legal', 'precios', 'design', 'auth')
    and not exists (select 1 from public.locations where slug = p_slug);
$$;
grant execute on function public.slug_available to anon, authenticated;

-- Alta de cuenta: un usuario solo puede ser dueño de una organización (fase 1)
create or replace function public.create_organization_with_owner(
  p_name text, p_country text, p_currency text, p_location_name text, p_slug text,
  p_timezone text, p_locale text
) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
  loc_id uuid;
begin
  if uid is null then perform app.fail('not_authenticated'); end if;
  if exists (select 1 from public.memberships where user_id = uid and deleted_at is null) then
    perform app.fail('already_has_organization');
  end if;
  if not public.slug_available(p_slug) then perform app.fail('slug_taken'); end if;

  insert into public.organizations (name, country, currency, onboarding)
  values (p_name, p_country, p_currency, '{"account": true, "location": true}')
  returning id into org_id;
  insert into public.locations (organization_id, name, slug, timezone, locale, settings)
  values (org_id, p_location_name, p_slug, p_timezone, p_locale,
    '{"stamp_cooldown_hours": 4, "message_min_days": 7, "opportunity_hour": 9}')
  returning id into loc_id;
  insert into public.memberships (user_id, organization_id, role) values (uid, org_id, 'owner');
  insert into public.opportunity_rules (organization_id, type, params) values
    (org_id, 'birthday', '{}'), (org_id, 'inactive', '{"days": 14}'),
    (org_id, 'near_reward', '{"missing": 1}'), (org_id, 'reward_ready', '{"remind_after_days": 3}');
  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id)
  values (org_id, 'user', uid, 'organization.create', 'organization', org_id);
  return jsonb_build_object('organization_id', org_id, 'location_id', loc_id);
end $$;

-- Estadísticas por cliente (respeta RLS del que consulta)
create or replace view public.customer_stats with (security_invoker = true) as
select
  c.id as customer_id,
  c.organization_id,
  coalesce(sum(e.quantity) filter (where e.validation_status = 'approved'), 0)::int as balance,
  count(*) filter (where e.type = 'visit'
    and not exists (select 1 from public.stamp_events r where r.reverses_event_id = e.id))::int as visits,
  (select count(*) from public.rewards r where r.customer_id = c.id and r.status = 'available'
     and (r.expires_at is null or r.expires_at > now()))::int as rewards_available,
  (select count(*) from public.rewards r where r.customer_id = c.id and r.status = 'redeemed')::int as rewards_redeemed
from public.customers c
left join public.stamp_events e on e.customer_id = c.id
where c.deleted_at is null
group by c.id;

grant select on public.customer_stats to authenticated;

-- Tarjeta del cliente para el dueño: misma salida que customer_card, pero comprobando la membresía
create or replace function public.owner_customer_card(p_customer uuid, p_location uuid) returns jsonb
language plpgsql stable security definer set search_path = public, app as $$
declare org uuid;
begin
  select organization_id into org from public.customers where id = p_customer;
  if org is null or not app.is_member(org) then perform app.fail('customer_not_found'); end if;
  if not exists (select 1 from public.locations where id = p_location and organization_id = org) then
    perform app.fail('location_not_found');
  end if;
  return public.customer_card(p_customer, p_location);
end $$;
revoke execute on function public.owner_customer_card from public, anon;
grant execute on function public.owner_customer_card to authenticated;

-- El dueño también puede añadir notas desde el panel (customer_notes ya tiene políticas por organización)

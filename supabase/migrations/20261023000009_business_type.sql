-- Repite · tipo de negocio del local (cambia icono del sello, ejemplos y vocabulario; no cambia la lógica)

alter table public.locations
  add column business_type text not null default 'otro'
  check (business_type in ('cafeteria', 'restaurante', 'heladeria', 'otro'));

-- El alta recibe el tipo de negocio. Se sustituye la función anterior (mismos permisos).
drop function public.create_organization_with_owner(text, text, text, text, text, text, text);

create or replace function public.create_organization_with_owner(
  p_name text, p_country text, p_currency text, p_location_name text, p_slug text,
  p_timezone text, p_locale text, p_business_type text default 'otro'
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
  insert into public.locations (organization_id, name, slug, timezone, locale, business_type, settings)
  values (org_id, p_location_name, p_slug, p_timezone, p_locale,
    case when p_business_type in ('cafeteria', 'restaurante', 'heladeria') then p_business_type else 'otro' end,
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

revoke execute on function public.create_organization_with_owner from public, anon;
grant execute on function public.create_organization_with_owner to authenticated;

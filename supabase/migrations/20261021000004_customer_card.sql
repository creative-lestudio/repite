-- Repite · estado de la tarjeta del cliente para un local (lo usan la PWA y la ficha del equipo)

create or replace function public.customer_card(p_customer uuid, p_location uuid) returns jsonb
language plpgsql stable security definer set search_path = public, app, extensions as $$
declare
  prog public.loyalty_programs;
  cust public.customers;
begin
  select c.* into cust from public.customers c
  join public.locations l on l.id = p_location and l.organization_id = c.organization_id
  where c.id = p_customer and c.deleted_at is null;
  if not found then perform app.fail('customer_not_found'); end if;

  prog := app.active_program(p_location);
  if prog.id is null then
    return jsonb_build_object('program', null);
  end if;

  return jsonb_build_object(
    'program', jsonb_build_object(
      'id', prog.id, 'stamps_required', prog.stamps_required, 'reward_name', prog.reward_name,
      'reward_description', prog.reward_description, 'reward_expiry_days', prog.reward_expiry_days,
      'bonus_story_enabled', prog.bonus_story_enabled, 'bonus_review_enabled', prog.bonus_review_enabled),
    'balance', app.card_balance(p_customer, prog.id),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'reward_name', r.reward_name, 'expires_at', r.expires_at,
        'created_at', r.created_at) order by r.created_at)
      from public.rewards r
      where r.customer_id = p_customer and r.status = 'available' and (r.expires_at is null or r.expires_at > now())
    ), '[]'::jsonb),
    'pending_bonuses', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'type', e.type, 'created_at', e.created_at))
      from public.stamp_events e
      where e.customer_id = p_customer and e.validation_status = 'pending'
    ), '[]'::jsonb),
    'review_bonus_given', exists (
      select 1 from public.stamp_events e where e.customer_id = p_customer and e.program_id = prog.id
        and e.type = 'bonus_review' and e.validation_status = 'approved'),
    'last_visit_at', cust.last_visit_at
  );
end $$;

revoke execute on function public.customer_card from public, anon, authenticated;
grant execute on function public.customer_card to service_role;

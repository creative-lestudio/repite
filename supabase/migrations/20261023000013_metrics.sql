-- Resultados para el dueño: visitas, clientes que vuelven, premios y reparto por día y hora.
-- SECURITY INVOKER: la RLS decide qué filas ve cada usuario, así que nunca se mezclan cuentas.
create or replace function public.owner_metrics(p_org uuid, p_location uuid, p_days int, p_tz text)
returns jsonb
language sql stable security invoker set search_path = public as $$
  with params as (
    select
      now() as t_end,
      now() - make_interval(days => greatest(1, least(p_days, 365))) as t_start,
      now() - make_interval(days => 2 * greatest(1, least(p_days, 365))) as t_prev
  ),
  -- Visitas válidas (aprobadas y no deshechas) con su número de orden por cliente
  visits as (
    select e.customer_id, e.created_at,
           (e.created_at at time zone p_tz)::date as local_day,
           extract(hour from e.created_at at time zone p_tz)::int as local_hour,
           row_number() over (partition by e.customer_id order by e.created_at) as nth
    from public.stamp_events e
    where e.organization_id = p_org and e.location_id = p_location
      and e.type = 'visit' and e.validation_status = 'approved'
      and not exists (select 1 from public.stamp_events r where r.reverses_event_id = e.id)
  ),
  cur as (select v.* from visits v, params p where v.created_at >= p.t_start and v.created_at < p.t_end),
  prev as (select v.* from visits v, params p where v.created_at >= p.t_prev and v.created_at < p.t_start)
  select jsonb_build_object(
    'days', greatest(1, least(p_days, 365)),
    'visits', (select count(*) from cur),
    'visits_prev', (select count(*) from prev),
    'active_customers', (select count(distinct customer_id) from cur),
    'active_customers_prev', (select count(distinct customer_id) from prev),
    'returning_customers', (select count(distinct customer_id) from cur where nth > 1),
    'repeat_visits', (select count(*) from cur where nth > 1),
    'repeat_visits_prev', (select count(*) from prev where nth > 1),
    'new_customers', (select count(*) from public.customers c, params p
                      where c.organization_id = p_org and c.deleted_at is null and c.created_at >= p.t_start),
    'new_customers_prev', (select count(*) from public.customers c, params p
                      where c.organization_id = p_org and c.deleted_at is null
                        and c.created_at >= p.t_prev and c.created_at < p.t_start),
    'rewards_issued', (select count(*) from public.rewards r, params p
                       where r.organization_id = p_org and r.created_at >= p.t_start),
    'rewards_redeemed', (select count(*) from public.rewards r, params p
                         where r.organization_id = p_org and r.status = 'redeemed' and r.redeemed_at >= p.t_start),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('day', g.d, 'visits', coalesce(c.n, 0)) order by g.d), '[]'::jsonb)
              from generate_series(
                     (now() at time zone p_tz)::date - (greatest(1, least(p_days, 365)) - 1),
                     (now() at time zone p_tz)::date, interval '1 day') as g(d)
              left join (select local_day, count(*) n from cur group by local_day) c on c.local_day = g.d::date),
    'by_hour', (select coalesce(jsonb_agg(jsonb_build_object('hour', h.h, 'visits', coalesce(c.n, 0)) order by h.h), '[]'::jsonb)
                from generate_series(0, 23) as h(h)
                left join (select local_hour, count(*) n from cur group by local_hour) c on c.local_hour = h.h)
  );
$$;
revoke execute on function public.owner_metrics from public, anon;
grant execute on function public.owner_metrics to authenticated;

-- 1) Sectores: panadería y takeaway (restaurante se conserva para los locales que ya lo usan).
-- 2) Sin incentivos por reseñas: los sellos por reseña quedan desactivados y no se pueden volver a activar.
--    Los eventos antiguos del libro no se tocan (es append-only).

alter table public.locations drop constraint locations_business_type_check;
alter table public.locations add constraint locations_business_type_check
  check (business_type in ('cafeteria', 'panaderia', 'takeaway', 'restaurante', 'heladeria', 'otro'));

do $$
declare def text;
begin
  def := pg_get_functiondef('public.create_organization_with_owner(text,text,text,text,text,text,text,text)'::regprocedure);
  def := replace(def, E'p_business_type in (''cafeteria'', ''restaurante'', ''heladeria'')',
                      E'p_business_type in (''cafeteria'', ''panaderia'', ''takeaway'', ''restaurante'', ''heladeria'')');
  if def not like '%''panaderia''%' then raise exception 'create_organization_with_owner no se pudo actualizar'; end if;
  execute def;
end $$;

alter table public.loyalty_programs alter column bonus_review_enabled set default false;
update public.loyalty_programs set bonus_review_enabled = false where bonus_review_enabled;
alter table public.loyalty_programs
  add constraint loyalty_programs_no_review_incentive check (not bonus_review_enabled);

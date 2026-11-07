begin;
-- Keep the previous work area as historical metadata, not as a department.
alter table public.synthetic_people add column work_area_code text;
update public.synthetic_people p set work_area_code=d.code from public.departments d where d.id=p.department_id;
insert into public.departments(code,name_ca,name_es,name_en,collective,site_type,synthetic_headcount) values
  ('fabrica','Fàbrica','Fábrica','Factory','fabriques','factory',0),
  ('logistica','Logística','Logística','Logistics','logistica','warehouse',0),
  ('comercial','Comercial','Comercial','Commercial','comercial','field',0),
  ('oficina','Oficina','Oficina','Office','oficines','office',0)
on conflict(code) do update set name_ca=excluded.name_ca,name_es=excluded.name_es,name_en=excluded.name_en,site_type=excluded.site_type,active=true;
create temporary table department_mapping on commit drop as
select old.id old_id,old.code old_code,target.id new_id from public.departments old
join public.departments target on target.collective=old.collective and target.code=case old.collective
  when 'fabriques' then 'fabrica' when 'logistica' then 'logistica' when 'comercial' then 'comercial' when 'oficines' then 'oficina' end;
-- Preserve historical segments separately instead of incorrectly adding averages or
-- losing rows that become identical under the new department grouping.
update public.analytics_segments a set segment_key=a.segment_key||jsonb_build_object('legacy_department_id',m.old_id::text)
from department_mapping m where a.department_id=m.old_id;
do $$ declare r record; begin
  for r in select c.conrelid::regclass relation,a.attname col
    from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
    where c.contype='f' and c.confrelid='public.departments'::regclass and c.conrelid<>'public.departments'::regclass
  loop
    execute format('update %s t set %I=m.new_id from department_mapping m where t.%I=m.old_id and m.old_id<>m.new_id',r.relation,r.col,r.col);
  end loop;
end $$;
update public.departments set parent_id=null;
delete from public.departments where code not in ('fabrica','logistica','comercial','oficina');
update public.departments d set synthetic_headcount=(select count(*) from public.synthetic_people p where p.department_id=d.id);
alter table public.departments add constraint four_department_codes check(code in ('fabrica','logistica','comercial','oficina'));
alter table public.departments add constraint one_department_per_collective unique(collective);
alter table public.departments add constraint department_collective_consistent check(
  (code='fabrica' and collective='fabriques') or (code='logistica' and collective='logistica') or
  (code='comercial' and collective='comercial') or (code='oficina' and collective='oficines'));
insert into app_private.schema_migrations(version) values('20261108140000_four_departments');
commit;

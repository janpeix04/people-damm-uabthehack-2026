begin;
alter table public.departments drop constraint four_department_codes;
alter table public.departments drop constraint department_collective_consistent;
alter table public.departments drop constraint departments_collective_check;
alter table public.departments add constraint departments_collective_check check (collective in ('fabriques','logistica','comercial','oficines','others'));
alter table public.survey_responses drop constraint survey_responses_collective_check;
alter table public.survey_responses add constraint survey_responses_collective_check check (collective in ('fabriques','logistica','comercial','oficines','others'));
alter table public.departments add constraint department_codes check(code in ('fabrica','logistica','comercial','oficina','others'));
alter table public.departments add constraint department_collective_consistent check(
 (code='fabrica' and collective='fabriques') or (code='logistica' and collective='logistica') or
 (code='comercial' and collective='comercial') or (code='oficina' and collective='oficines') or
 (code='others' and collective='others'));
insert into public.departments(code,name_ca,name_es,name_en,collective,site_type,synthetic_headcount)
values('others','Others','Others','Others','others','office',0);
insert into app_private.schema_migrations(version) values('20261108170000_others_department');
commit;

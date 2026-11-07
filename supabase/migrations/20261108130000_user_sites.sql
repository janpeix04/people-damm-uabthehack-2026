begin;
alter table public.user_profiles add column home_site_id uuid references public.sites(id) on delete restrict;
comment on column public.user_profiles.home_site_id is 'Assigned HR workplace; NULL means corporate scope. Worker workplace comes from the linked synthetic person, not client input.';
insert into app_private.schema_migrations(version) values('20261108130000_user_sites');
commit;

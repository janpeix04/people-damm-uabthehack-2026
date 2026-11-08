begin;
alter table public.plaza_ideas add column site_id uuid references public.sites(id);
create index plaza_ideas_site_status on public.plaza_ideas(site_id,status,submitted_on);
comment on column public.plaza_ideas.site_id is 'Workplace assigned server-side when submitted. Historical unassigned ideas remain visible only in the corporate HR view.';
insert into app_private.schema_migrations(version) values('20261108210000_plaza_sites');
commit;

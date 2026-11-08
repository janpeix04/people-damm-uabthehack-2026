begin;
create table app_private.directory_links (
  user_id uuid primary key references auth.users(id) on delete cascade,
  connection_id uuid not null references public.integration_connections(id) on delete restrict,
  tenant_id text not null check(length(btrim(tenant_id))>0),
  external_id text not null check(length(btrim(external_id))>0),
  synced_at timestamptz not null default now(),
  unique(tenant_id,external_id)
);
create table app_private.directory_sync_runs (
  id uuid primary key default extensions.gen_random_uuid(),
  connection_id uuid not null references public.integration_connections(id) on delete restrict,
  status text not null check(status in ('running','succeeded','failed')),
  imported_count integer not null default 0 check(imported_count>=0),
  updated_count integer not null default 0 check(updated_count>=0),
  disabled_count integer not null default 0 check(disabled_count>=0),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_summary text,
  check((status='running' and finished_at is null) or (status<>'running' and finished_at is not null)),
  check(finished_at is null or finished_at>=started_at)
);
create index directory_sync_history on app_private.directory_sync_runs(connection_id,started_at desc);
alter table app_private.directory_links enable row level security;
alter table app_private.directory_sync_runs enable row level security;
revoke all on app_private.directory_links,app_private.directory_sync_runs from public,anon,authenticated;
grant all on app_private.directory_links,app_private.directory_sync_runs to service_role;
comment on table app_private.directory_links is 'Operational Microsoft directory identity; never linked to anonymous survey content. Does not grant login by itself.';
insert into app_private.schema_migrations(version) values('20261108150000_directory_integrations');
commit;

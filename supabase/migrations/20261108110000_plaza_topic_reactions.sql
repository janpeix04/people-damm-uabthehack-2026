begin;
create table app_private.plaza_topic_reactions (
  week_start date not null check(extract(isodow from week_start)=1),
  wallet_digest bytea not null references app_private.app_wallets(token_digest) on delete cascade,
  topic_index smallint not null check(topic_index between 0 and 5),
  primary key(week_start,wallet_digest,topic_index)
);
alter table app_private.plaza_topic_reactions enable row level security;
grant all on app_private.plaza_topic_reactions to service_role;
comment on table app_private.plaza_topic_reactions is 'Private demo preferences for the six fixed topic slots; no survey response or idea link.';
insert into app_private.schema_migrations(version) values('20261108110000_plaza_topic_reactions');
commit;

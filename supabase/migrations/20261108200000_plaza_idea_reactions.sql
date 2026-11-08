begin;
create table app_private.plaza_idea_reactions (
 idea_id uuid not null references public.plaza_ideas(id) on delete cascade,
 wallet_digest bytea not null,
 primary key(idea_id,wallet_digest)
);
alter table app_private.plaza_idea_reactions enable row level security;
comment on table app_private.plaza_idea_reactions is 'One reaction per published idea and private wallet. Legacy demo-slot reactions are not attributed to real opinions.';
insert into app_private.schema_migrations(version) values('20261108200000_plaza_idea_reactions');
commit;

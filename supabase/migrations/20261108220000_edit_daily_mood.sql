begin;
alter table app_private.daily_mood_receipts add column mood_id uuid unique references public.daily_moods(id) on delete set null;
comment on column app_private.daily_mood_receipts.mood_id is 'Private edit reference, never returned to HR. Historical receipts cannot be linked retrospectively.';
insert into app_private.schema_migrations(version) values('20261108220000_edit_daily_mood');
commit;

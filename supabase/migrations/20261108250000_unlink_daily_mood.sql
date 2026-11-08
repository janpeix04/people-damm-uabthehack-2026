begin;
-- Participation receipt remains separate from the anonymous answer.
alter table app_private.daily_mood_receipts drop column mood_id;
comment on table app_private.daily_mood_receipts is 'Only records account/day participation to prevent duplicates. No answer ID, mood or chosen department.';
insert into app_private.schema_migrations(version) values('20261108250000_unlink_daily_mood');
commit;

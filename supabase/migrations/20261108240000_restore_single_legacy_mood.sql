begin;
-- Recover only an unambiguous legacy pair. Never guess from a shared cohort.
lock table app_private.daily_mood_receipts,public.daily_moods in share row exclusive mode;
with candidates as (
 select r.user_id,r.day,m.id
 from app_private.daily_mood_receipts r join app_private.worker_accounts a on a.user_id=r.user_id
 join public.synthetic_people p on p.id=a.synthetic_person_id
 join public.daily_moods m on m.day=r.day and m.site_id=p.site_id
 join public.departments d on d.id=m.department_id
 where r.mood_id is null and (m.department_id=p.department_id or d.code='others')
 and not exists(select 1 from app_private.daily_mood_receipts linked where linked.mood_id=m.id)
 and (select count(*) from app_private.daily_mood_receipts other where other.day=r.day and other.mood_id is null)=1
 and (select count(*) from public.daily_moods other where other.day=r.day
   and not exists(select 1 from app_private.daily_mood_receipts linked where linked.mood_id=other.id))=1
)
update app_private.daily_mood_receipts r set mood_id=c.id from candidates c where r.user_id=c.user_id and r.day=c.day;
insert into app_private.schema_migrations(version) values('20261108240000_restore_single_legacy_mood');
commit;

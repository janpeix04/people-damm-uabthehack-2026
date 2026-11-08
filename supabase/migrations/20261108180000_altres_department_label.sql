begin;
update public.departments set name_ca='Altres',name_es='Otros',name_en='Others',updated_at=now() where code='others';
insert into app_private.schema_migrations(version) values('20261108180000_altres_department_label');
commit;

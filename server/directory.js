export async function directoryOverview(db){
 const users=(await db.query(`select u.id,u.email,p.display_label name,p.app_role role,p.active,
   c.user_id is not null has_password,
   case when l.user_id is null then 'local' else 'microsoft365' end source,
   d.code department_code,d.name_ca department,
   s.name site,s.location,
   u.created_at,l.synced_at
   from auth.users u join user_profiles p on p.user_id=u.id
   left join app_private.auth_credentials c on c.user_id=u.id
   left join app_private.directory_links l on l.user_id=u.id
   left join app_private.worker_accounts a on a.user_id=u.id
   left join synthetic_people person on person.id=a.synthetic_person_id
   left join departments d on d.id=case when p.app_role='worker' then person.department_id else p.department_id end
   left join sites s on s.id=case when p.app_role='worker' then person.site_id else p.home_site_id end
   where c.user_id is not null or l.user_id is not null
   order by p.display_label,u.email`)).rows;
 const connections=(await db.query(`select id,name,status,updated_at from integration_connections where provider='microsoft_graph' order by updated_at desc`)).rows;
 const history=(await db.query(`select r.id,r.status,r.imported_count,r.updated_count,r.disabled_count,r.started_at,r.finished_at,
   case when r.status='failed' then 'La sincronització ha fallat. Revisa la configuració i els permisos de la connexió.' end error
   from app_private.directory_sync_runs r join integration_connections c on c.id=r.connection_id
   where c.provider='microsoft_graph' order by r.started_at desc limit 20`)).rows;
 const connection=connections.find(c=>c.status==='connected')||connections[0]||null;
 const sync=connection?(await db.query(`select max(started_at) last_sync,max(finished_at) filter(where status='succeeded') last_success from app_private.directory_sync_runs where connection_id=$1`,[connection.id])).rows[0]:null;
 const state=!connection||connection.status==='demo'?'not_connected':connection.status==='connected'?(sync?.last_success?'registered':'pending_verification'):connection.status;
 return {users:users.map(u=>({...u,access:u.active&&u.has_password&&['worker','hr_admin','hr_analyst'].includes(u.role)?'active':!u.active?'inactive':'pending'})),
   integration:{provider:'microsoft365',state,lastSync:sync?.last_sync||null,lastSuccess:sync?.last_success||null,importedUsers:users.filter(u=>u.source==='microsoft365').length,history}};
}

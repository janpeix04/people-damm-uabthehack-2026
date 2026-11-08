import {InputError} from './surveys.js';

export async function moodState(db,user){
 const row=(await db.query(`select (now() at time zone 'Europe/Madrid')::date::text as "day",
   d.code department,d.name_ca department_name,m.mood current_mood,m.department_id<>p.department_id unspecified,
   r.mood_id is not null editable,
   exists(select 1 from app_private.daily_mood_receipts r where r.user_id=$1 and r.day=(now() at time zone 'Europe/Madrid')::date) answered
   from app_private.worker_accounts a join synthetic_people p on p.id=a.synthetic_person_id
   left join app_private.daily_mood_receipts r on r.user_id=a.user_id and r.day=(now() at time zone 'Europe/Madrid')::date
   left join daily_moods m on m.id=r.mood_id
   join departments d on d.id=p.department_id where a.user_id=$1`,[user.id])).rows[0];
 if(!row)throw new InputError('No hi ha cap centre i departament assignats.',403);
 return row;
}

// Caller wraps receipt and anonymous answer in the same transaction.
export async function submitMood(db,user,body){
 if(body.edit!==undefined&&typeof body.edit!=='boolean')throw new InputError('Petició no vàlida.');
 if(body.unspecified!==undefined&&typeof body.unspecified!=='boolean')throw new InputError('Departament no vàlid.');
 if(!Number.isInteger(body.mood)||body.mood<1||body.mood>5)throw new InputError('Tria una de les cinc caretes.');
 const state=await moodState(db,user);
 if(body.day!==state.day)throw new InputError('El dia ha canviat. Torna a obrir l’avís.',409);
 const person=(await db.query(`select p.site_id,p.department_id from app_private.worker_accounts a
   join synthetic_people p on p.id=a.synthetic_person_id where a.user_id=$1`,[user.id])).rows[0];
 const dept=body.unspecified?(await db.query("select id from departments where code='others' and active")).rows[0]?.id:person.department_id;
 if(!dept)throw new InputError('Departament no disponible.');
 const receipt=await db.query(`insert into app_private.daily_mood_receipts(user_id,day) values($1,$2) on conflict do nothing returning day`,[user.id,state.day]);
 if(receipt.rowCount){
  const mood=(await db.query('insert into daily_moods(day,site_id,department_id,mood) values($1,$2,$3,$4) returning id',[state.day,person.site_id,dept,body.mood])).rows[0];
  await db.query('update app_private.daily_mood_receipts set mood_id=$3 where user_id=$1 and day=$2',[user.id,state.day,mood.id]);
 }else if(body.edit){
  const r=(await db.query('select mood_id from app_private.daily_mood_receipts where user_id=$1 and day=$2 for update',[user.id,state.day])).rows[0];
  if(!r?.mood_id)throw new InputError('Aquesta resposta antiga no es pot editar. Podràs editar la de demà.',409);
  await db.query('update daily_moods set mood=$2,department_id=$3 where id=$1',[r.mood_id,body.mood,dept]);
 }
 return moodState(db,user);
}

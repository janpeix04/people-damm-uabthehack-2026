import {InputError} from './surveys.js';

export async function moodState(db,user){
 const row=(await db.query(`select (now() at time zone 'Europe/Madrid')::date::text as "day",
   d.code department,d.name_ca department_name,
   exists(select 1 from app_private.daily_mood_receipts r where r.user_id=$1 and r.day=(now() at time zone 'Europe/Madrid')::date) answered
   from app_private.worker_accounts a join synthetic_people p on p.id=a.synthetic_person_id
   join departments d on d.id=p.department_id where a.user_id=$1`,[user.id])).rows[0];
 if(!row)throw new InputError('No hi ha cap centre i departament assignats.',403);
 return row;
}

// Caller wraps receipt and anonymous answer in the same transaction.
export async function submitMood(db,user,body){
 if(body.edit)throw new InputError('La resposta no es pot consultar ni editar per protegir-ne la separació del compte.',409);
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
  await db.query('insert into daily_moods(day,site_id,department_id,mood) values($1,$2,$3,$4)',[state.day,person.site_id,dept,body.mood]);
 }
 return moodState(db,user);
}

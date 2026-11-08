import {InputError} from './surveys.js';

// Resum per departament. Amb `siteCode`, només compta les persones i les respostes d'aquell centre;
// la nota es manté oculta si el departament no arriba al llindar de privacitat en aquell centre.
// Tot el grup mostra el dia d'avui; un centre agafa els darrers 7 dies, perquè en un sol dia gairebé
// cap departament d'un centre arriba a les 10 respostes. `days` indica la finestra utilitzada.
export async function departmentOverview(db,siteCode=null){
  if(siteCode!==null&&!(await db.query('select 1 from sites where code=$1 and active',[siteCode])).rowCount)throw new InputError('Centre no trobat.',404);
  const rows=(await db.query(`with people as (
    select p.id,p.department_id from synthetic_people p join sites s on s.id=p.site_id
    where p.active and ($1::text is null or s.code=$1)
  ), metrics as (
    select m.department_id,count(*)::int responses,avg((m.mood-1)*2.5) score
    from daily_moods m join sites s on s.id=m.site_id
    where m.day>(now() at time zone 'Europe/Madrid')::date-$2::int and m.day<=(now() at time zone 'Europe/Madrid')::date and ($1::text is null or s.code=$1)
    group by m.department_id
  ) select d.code,d.name_ca name,
    (select count(*)::int from people p where p.department_id=d.id) headcount,
    coalesce(m.responses,0) responses,10 threshold,
    case when m.responses>=10 then round(m.score,1)::float end score,
    coalesce(m.responses,0) participants,
    (now() at time zone 'Europe/Madrid')::date::text period,$2::int days
    from departments d left join metrics m on m.department_id=d.id where d.active
    order by case d.code when 'fabrica' then 1 when 'logistica' then 2 when 'comercial' then 3 when 'oficina' then 4 else 5 end`,[siteCode,siteCode===null?1:7])).rows;
  return rows.map(r=>({...r,// participació mitjana diària dins la finestra
    participation:r.headcount?Math.min(100,Math.round(100*r.participants/(r.headcount*r.days))):0,
    mood:r.score===null?'nodata':r.score>=7?'happy':r.score>=5?'uneasy':'stressed'}));
}

// Centres actius amb persones assignades, per al selector de RRHH.
export async function siteList(db){
  return (await db.query(`select s.code,s.name,s.location,s.site_type_ca type,s.site_category category,count(p.id)::int headcount
    from sites s join synthetic_people p on p.site_id=s.id and p.active
    where s.active group by s.id order by count(p.id) desc,s.name`)).rows;
}

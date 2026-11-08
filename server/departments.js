import {InputError} from './surveys.js';

// Resum per departament. Amb `siteCode`, només compta les persones i les respostes d'aquell centre;
// la nota es manté oculta si el departament no arriba al llindar de privacitat en aquell centre.
export async function departmentOverview(db,siteCode=null){
  if(siteCode!==null&&!(await db.query('select 1 from sites where code=$1 and active',[siteCode])).rowCount)throw new InputError('Centre no trobat.',404);
  const rows=(await db.query(`with site as (select id from sites where code=$1::text),
    period as (select max(period_start) value from survey_responses),
    per_response as (
      select r.id,r.department_id,c.privacy_threshold,
        avg(10.0*(a.numeric_value-q.scale_min)/nullif(q.scale_max-q.scale_min,0)) score
      from survey_responses r join campaigns c on c.id=r.campaign_id
      left join response_answers a on a.response_id=r.id
      left join questions q on q.id=a.question_id and q.question_type='scale'
      where r.period_start=(select value from period) and ($1::text is null or r.site_id=(select id from site))
      group by r.id,r.department_id,c.privacy_threshold
    ), metrics as (
      select department_id,count(*)::int responses,count(score)::int scored,
      greatest(10,max(privacy_threshold)) threshold,avg(score) score from per_response group by department_id
    ), people as (
      select p.id,p.department_id from synthetic_people p where p.active and ($1::text is null or p.site_id=(select id from site))
    ) select d.code,d.name_ca name,
      (select count(*)::int from people p where p.department_id=d.id) headcount,
      coalesce(m.responses,0) responses,coalesce(m.threshold,10) threshold,
      case when m.scored>=m.threshold then round(m.score,1)::float end score,
      (select count(distinct aa.synthetic_person_id)::int from audience_assignments aa where aa.status='responded'
        and aa.synthetic_person_id in(select p.id from people p where p.department_id=d.id)
        and aa.campaign_id in(select campaign_id from survey_responses where period_start=(select value from period))) participants,
      (select value from period) period
    from departments d left join metrics m on m.department_id=d.id where d.active order by case d.code when 'fabrica' then 1 when 'logistica' then 2 when 'comercial' then 3 else 4 end`,[siteCode])).rows;
  return rows.map(r=>({...r,participation:r.headcount?Math.round(100*r.participants/r.headcount):0,
    mood:r.score===null?'nodata':r.score>=7?'happy':r.score>=5?'uneasy':'stressed'}));
}

// Centres actius amb persones assignades, per al selector de RRHH.
export async function siteList(db){
  return (await db.query(`select s.code,s.name,s.location,s.site_type_ca type,s.site_category category,count(p.id)::int headcount
    from sites s join synthetic_people p on p.site_id=s.id and p.active
    where s.active group by s.id order by count(p.id) desc,s.name`)).rows;
}

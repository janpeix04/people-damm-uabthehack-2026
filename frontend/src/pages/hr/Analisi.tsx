import RepresentationPanel from '../../components/analytics/RepresentationPanel'
import {useState} from 'react'
import {Link,useSearchParams} from 'react-router-dom'
import {AlertTriangle,Download,RefreshCw,Printer} from 'lucide-react'
import {PageHead} from '../../components/HRLayout'
import {DonutChart,GroupedBarChart,HorizontalBarChart} from '../../components/analytics/AnalyticsCharts'
import {downloadAnalytics,useSurveyAnalytics,type AnalyticsGroup,type AnalyticsQuestion} from '../../api/analytics'

const COLORS=['#C8102E','#2D5C9E','#2F7A4E','#B08A45','#7A0C1E']
const value=(n:number|null|undefined,suffix='')=>n==null?'Sense dades':`${n}${suffix}`
const hidden='Desglossament ocult: hi ha grups amb menys respostes que el llindar de privacitat.'

function Breakdown({title,rows}:{title:string;rows:AnalyticsGroup[]}){
 return <section className="card p-5 flex flex-col gap-4"><h2 className="serif text-xl">{title}</h2>{rows.length?<HorizontalBarChart items={rows.map((r,i)=>({key:r.code,label:r.label,value:r.count,pct:r.pct,color:COLORS[i%COLORS.length],sublabel:r.score===null?undefined:`Mitjana: ${r.score} /10`}))}/>:<p className="text-sm text-ink-muted">{hidden}</p>}</section>
}
function QuestionResult({q,threshold}:{q:AnalyticsQuestion;threshold:number}){
 const [view,setView]=useState<'bar'|'donut'|'shift'>('bar')
 return <article className="card p-5 flex flex-col gap-4">
  <div className="flex flex-wrap justify-between items-start gap-3"><div className="flex-1 min-w-0"><p className="eyebrow">Versió {q.version}{q.dimension?` · ${q.dimension}`:''}</p><h3 className="serif text-xl mt-1">{q.text}</h3><p className="text-xs text-ink-muted mt-2">{q.totalAnswers} respostes{q.avgScore!==null?` · Mitjana normalitzada: ${q.avgScore} /10`:''}</p></div>
   {!q.isSuppressed&&q.type!=='open_text'&&<div className="flex gap-1 flex-wrap">{(['bar','donut','shift'] as const).map(mode=><button key={mode} aria-pressed={view===mode} onClick={()=>setView(mode)} className={view===mode?'btn-ink !h-9 !text-xs':'btn-line !h-9 !text-xs'}>{mode==='bar'?'Barres':mode==='donut'?'Donut':'Per torn'}</button>)}</div>}
  </div>
  {q.isSuppressed?<p className="text-sm text-ink-muted">Resultat protegit: calen {threshold} respostes a aquesta pregunta.</p>:q.type==='open_text'?<p className="text-sm text-ink-muted">S’ha registrat text obert a la BD. No s’exposen comentaris individuals. L’agrupació temàtica i l’anàlisi de sentiment encara no estan connectades.</p>:view==='shift'?q.shifts.length?<div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{q.shifts.map(s=><div key={s.code} className="rounded-xl bg-cream p-3"><strong>{s.label}</strong><p className="text-sm mt-1">{s.count} respostes</p><p className="text-sm">{value(s.score,' /10')}</p></div>)}</div>:<p className="text-sm text-ink-muted">{hidden}</p>:!q.distribution.length?<p className="text-sm text-ink-muted">Distribució protegida: una o més opcions tenen menys de {threshold} respostes.</p>:view==='donut'?<div className="flex justify-center"><DonutChart data={q.distribution.map((d,i)=>({key:d.label,label:d.label,value:d.count,color:COLORS[i%COLORS.length]}))} centerLabel="Respostes" centerValue={q.totalAnswers}/></div>:<HorizontalBarChart items={q.distribution.map((d,i)=>({key:d.label,label:d.label,value:d.count,pct:d.pct,color:COLORS[i%COLORS.length]}))} maxVal={q.totalAnswers}/>}
 </article>
}

export default function Analisi(){
 const [params,setParams]=useSearchParams()
 const filters={survey:params.get('form')||'',site:params.get('centre')||'',department:params.get('departament')||'',shift:params.get('torn')||'',channel:params.get('canal')||'',dateRange:params.get('periode')||'all'}
 const {data,error,loading,refresh}=useSurveyAnalytics(filters)
 const [exportError,setExportError]=useState(''),[exporting,setExporting]=useState(false)
 const stats=data?.stats
 const update=(key:string,v:string)=>setParams(prev=>{const next=new URLSearchParams(prev);if(v)next.set(key,v);else next.delete(key);return next},{replace:true})
 const download=async()=>{setExporting(true);setExportError('');try{await downloadAnalytics({...filters,survey:data?.form?.id||filters.survey})}catch(e){setExportError(e instanceof Error?e.message:'Error d’exportació')}finally{setExporting(false)}}
 return <div className="flex flex-col gap-6">
  <PageHead eyebrow="People Analytics" title="Anàlisi i Insights de Formularis" sub="Respostes de PostgreSQL, filtres al servidor i resultats agregats protegits." actions={<div className="flex flex-wrap gap-2 no-print"><button className="btn-line" disabled={loading} onClick={refresh}><RefreshCw size={16}/>Actualitzar</button><button className="btn-line" disabled={!stats||stats.isSuppressed||exporting||loading||!!error} onClick={()=>void download()}><Download size={16}/>{exporting?'Exportant…':'CSV agregat'}</button><button className="btn-line" onClick={()=>window.print()}><Printer size={16}/>Imprimir</button><Link className="btn-red" to="/rrhh/crear">Nova enquesta</Link></div>}/>
  {error&&<p role="alert" className="card p-4 text-red-dk">{error}</p>}
  {exportError&&<p role="alert" className="text-red-dk">{exportError}</p>}
  {loading&&!data&&<p role="status">Carregant l’anàlisi de la base de dades…</p>}
  {data&&<>
   <section className="card p-4 flex flex-col gap-4 no-print" aria-label="Filtres d’anàlisi">
    <label className="text-sm font-bold">Enquesta<select className="input mt-1" value={data.form?.id||''} onChange={e=>update('form',e.target.value)}>{data.forms.map(form=><option key={form.id} value={form.id}>{form.title} ({form.responses} respostes{filters.site?' en aquest centre':''})</option>)}</select></label>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3">
     <label className="text-xs font-bold">Departament<select className="input mt-1" value={filters.department} onChange={e=>update('departament',e.target.value)}><option value="">Tots</option>{data.options.departments.map(d=><option key={d.code} value={d.code}>{d.label}</option>)}</select></label>
     <label className="text-xs font-bold">Torn<select className="input mt-1" value={filters.shift} onChange={e=>update('torn',e.target.value)}><option value="">Tots</option>{data.options.shifts.map(d=><option key={d.code} value={d.code}>{d.label}</option>)}</select></label>
     <label className="text-xs font-bold">Canal<select className="input mt-1" value={filters.channel} onChange={e=>update('canal',e.target.value)}><option value="">Tots</option>{data.options.channels.map(d=><option key={d.code} value={d.code}>{d.label}</option>)}</select></label>
     <label className="text-xs font-bold">Dates<select className="input mt-1" value={filters.dateRange} onChange={e=>update('periode',e.target.value)}><option value="all">Tot l’històric</option><option value="7d">Últims 7 dies</option><option value="30d">Últims 30 dies</option><option value="90d">Últims 90 dies</option></select></label>
    </div>
    <p className="text-xs text-ink-muted">{stats?.totalResponses??0} respostes amb aquests filtres · dades actualitzades {new Date(data.generatedAt).toLocaleTimeString('ca-ES')} · actualització automàtica cada 30 segons.</p>
   </section>
   {!data.form&&<p className="card p-6">Encara no hi ha enquestes a la BD.</p>}
   {data.form&&<RepresentationPanel survey={data.form.id} site={filters.site}/>}
   {stats&&<>
    <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4" aria-label="Indicadors">
     {[['Respostes',String(stats.totalResponses)],['Públic objectiu',String(stats.target)],['Participació',value(stats.participationRate,'%')],['Llindar de privacitat',String(stats.threshold)]].map(([label,n])=><article key={label} className="card p-4"><p className="eyebrow">{label}</p><strong className="block text-3xl mt-2">{n}</strong></article>)}
    </section>
    {stats.isSuppressed?<section className="card p-5 flex gap-3 bg-warn-bg text-warn-ink" role="status"><AlertTriangle className="shrink-0"/><div><h2 className="font-bold">Mostra protegida per privacitat</h2><p className="text-sm mt-1">{stats.suppressionReason||`Calen almenys ${stats.threshold} respostes per mostrar resultats.`} Amplia els filtres. El CSV també està bloquejat.</p></div></section>:<>
     <section className="grid sm:grid-cols-2 gap-4"><article className="card p-5"><p className="eyebrow">Mitjana d’escales normalitzades</p><strong className="block text-3xl mt-2">{value(stats.avgScore,' /10')}</strong><p className="text-xs text-ink-muted mt-2">Es normalitza cada escala al seu rang i es calcula la mitjana per resposta. Sense comparatives ni NPS inventats.</p></article><article className="card p-5"><p className="eyebrow">Temps mitjà registrat</p><strong className="block text-3xl mt-2">{value(stats.avgDurationSecs,' s')}</strong><p className="text-xs text-ink-muted mt-2">Només es mostra quan hi ha prou durades informades.</p></article></section>
     <section className="grid lg:grid-cols-2 gap-5"><Breakdown title="Participació per canal" rows={stats.channelBreakdown}/><Breakdown title="Participació per torn" rows={stats.shiftBreakdown}/><Breakdown title="Participació per departament" rows={stats.departmentBreakdown}/>
      <article className="card p-5 flex flex-col gap-4"><h2 className="serif text-xl">Evolució temporal</h2><p className="text-xs text-ink-muted">Per dia, setmana o mes, segons la mostra disponible.</p>{stats.timeline.length?<GroupedBarChart categories={stats.timeline.map(r=>r.label)} series={[{label:'Respostes',color:COLORS[0],values:stats.timeline.map(r=>r.count)}]} maxScore={Math.max(...stats.timeline.map(r=>r.count),1)}/>:<p className="text-sm text-ink-muted">{hidden}</p>}</article>
     </section>
     <section className="card p-5 flex flex-col gap-4"><h2 className="serif text-xl">Dimensions mesurades</h2>{stats.dimensions.length?<HorizontalBarChart items={stats.dimensions.map(d=>({key:d.label,label:d.label,value:d.score,sublabel:`${d.count} respostes · ${d.score} /10`}))} maxVal={10} showPct={false}/>:<p className="text-sm text-ink-muted">No hi ha dimensions amb escales i mostra suficient. No s’afegeixen valors de referència ficticis.</p>}</section>
     <section className="flex flex-col gap-4" aria-label="Resultats per pregunta"><h2 className="serif text-2xl">Desglossament per pregunta</h2>{stats.questions.map(q=><QuestionResult key={q.id} q={q} threshold={stats.threshold}/>)}</section>
    </>}
    <section className="card p-4 text-xs text-ink-muted flex flex-col gap-2" aria-label="Font i límits de l’anàlisi">{stats.notes.map(note=><p key={note}>{note}</p>)}</section>
   </>}
  </>}
 </div>
}

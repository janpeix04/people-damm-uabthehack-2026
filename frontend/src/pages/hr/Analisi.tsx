import { useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Download,
  MessageSquare,
  Printer,
  Sparkles,
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'
import RepresentationPanel from '../../components/analytics/RepresentationPanel'
import {useSurveyAnalytics,downloadAnalytics} from '../../api/analytics'
import type {ShiftType} from '../../data/surveyAnalytics'
import { PageHead } from '../../components/HRLayout'
import { Meter } from '../../components/ui'

import { DonutChart, GroupedBarChart, HorizontalBarChart } from '../../components/analytics/AnalyticsCharts'
import { QuestionCard } from '../../components/analytics/QuestionCard'

export default function Analisi() {
  const [params,setParams]=useSearchParams()
  const site=params.get('centre')||''
  const filters={survey:params.get('form')||'',site,department:params.get('departament')||'',shift:params.get('torn')||'',channel:params.get('canal')||'',dateRange:params.get('periode')||'all'}
  const {data,error,loading,refresh}=useSurveyAnalytics(filters)
  const [exportError,setExportError]=useState('')
  const currentForm=data?.form
  const stats=data?.stats
  const update=(key:string,value:string)=>setParams(prev=>{const next=new URLSearchParams(prev);if(value)next.set(key,value);else next.delete(key);return next},{replace:true})
  const handleExportCsv=async()=>{setExportError('');try{await downloadAnalytics({...filters,survey:currentForm?.id||filters.survey})}catch(e){setExportError(e instanceof Error?e.message:'Error CSV')}}
  const handlePrint=()=>window.print()
  return (
    <div className="flex flex-col gap-6">
      {/* Capçalera de la pàgina */}
      <PageHead
        eyebrow="People Analytics · Escolta Activa"
        title="Anàlisi i Insights de Formularis"
        sub="Escolta activa: resultats agregats, participació i cobertura de les enquestes."
        actions={
          <div className="flex items-center gap-2 flex-wrap no-print">
            <button
              type="button"
              onClick={()=>void handleExportCsv()}
              disabled={!stats||stats.isSuppressed||loading||!!error}
              className="btn-line"
              title="Descarregar informe de mètriques agregades en format CSV"
            >
              <Download size={16} aria-hidden />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="btn-line"
              title="Generar versió per imprimir o desar en PDF"
            >
              <Printer size={16} aria-hidden />
              <span>Imprimir informe</span>
            </button>
            <Link to="/rrhh/crear" className="btn-red">
              <Sparkles size={16} aria-hidden />
              <span>Nova enquesta</span>
            </Link>
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        {/* Barra de Filtres interactius */}
        {data&&<section className="card p-4 sm:p-5 flex flex-col gap-4 bg-paper shadow-sm no-print" aria-label="Filtres d'anàlisi">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4"><label className="flex-1 min-w-0"><span className="eyebrow block mb-1">Formulari seleccionat</span><select className="input font-bold max-w-xl bg-cream" value={currentForm?.id||''} onChange={e=>update('form',e.target.value)}>{data.forms.map(f=><option key={f.id} value={f.id}>{f.title} ({f.responses} respostes)</option>)}</select></label><span className="chip bg-cream font-bold">{stats?.totalResponses??0} respostes amb els filtres actuals</span></div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{([
            ['Departament','departament',filters.department,data.options.departments],
            ['Torn laboral','torn',filters.shift,data.options.shifts],
            ['Canal de difusió','canal',filters.channel,data.options.channels],
            ['Període','periode',filters.dateRange,[{code:'all',label:'Tot l’històric'},{code:'7d',label:'Últims 7 dies'},{code:'30d',label:'Últims 30 dies'},{code:'90d',label:'Últim trimestre'}]],
          ] as const).map(([label,key,value,options])=><label key={key}><span className="eyebrow block mb-1">{label}</span><select className="input !text-xs font-semibold bg-white" value={value} onChange={e=>update(key,e.target.value)}>{key!=='periode'&&<option value="">Tots</option>}{options.map(o=><option key={o.code} value={o.code}>{o.label}</option>)}</select></label>)}</div>
          <div className="flex flex-wrap justify-between items-center gap-2 text-xs text-ink-muted"><span>Actualització automàtica cada 30 segons</span><button className="btn-line !h-9 !text-xs" onClick={refresh} disabled={loading}><RefreshCw size={14}/>Actualitzar</button></div>
        </section>}
        {currentForm&&<RepresentationPanel survey={currentForm.id} site={site}/>}
        {exportError&&<p role="alert" className="text-red-dk">{exportError}</p>}


        {loading && !stats && (
          <div className="card p-10 flex items-center justify-center gap-3 text-ink-muted">
            <RefreshCw className="animate-spin text-red" size={22} />
            <span className="serif text-lg">Consultant dades reals a PostgreSQL...</span>
          </div>
        )}

        {error && (
          <div className="card p-4 bg-red-soft text-red-dk border border-red/30">
            {error}
          </div>
        )}

        {stats && (
          <>
            {/* Advertència de k-anonimat si n < 10 */}
            {stats.isSuppressed ? (
              <div className="card p-6 bg-warn-bg text-warn-ink border border-warn/30 flex items-start gap-4">
                <AlertTriangle size={24} className="shrink-0 mt-0.5 text-warn" />
                <div>
                  <h3 className="serif text-xl font-bold">Mostra protegida per privacitat (k-anonimat)</h3>
                  <p className="text-sm mt-1 leading-relaxed">
                    {stats.suppressionReason||`Calen almenys ${stats.threshold} respostes per mostrar resultats agregats.`} El CSV també està protegit.
                  </p>
                  <p className="text-xs font-bold mt-2">Prova d’ampliar el rang de dates o seleccionar tots els departaments.</p>
                </div>
              </div>
            ) : (
              <>
                {/* Targetes KPI resum */}
                <section aria-label="Mètriques clau del formulari" className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  {/* 1. Participació */}
                  <article className="card p-4 flex flex-col justify-between gap-2">
                    <div className="flex justify-between items-start">
                      <span className="eyebrow text-ink-muted">Participació</span>
                      <span className="w-8 h-8 rounded-full bg-cream grid place-items-center text-ink-soft">
                        <Users size={16} />
                      </span>
                    </div>
                    <div>
                      <div className="serif text-3xl font-bold text-ink tabular-nums">
                        {stats.participationRate===null?'Sense dades':`${stats.participationRate}%`}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        {stats.totalResponses} respostes de {stats.target} objectiu
                      </div>
                    </div>
                    <Meter value={stats.participationRate??0} thin />
                  </article>

                  {/* 2. Puntuació mitjana */}
                  <article className="card p-4 flex flex-col justify-between gap-2">
                    <div className="flex justify-between items-start">
                      <span className="eyebrow text-ink-muted">Puntuació Mitjana</span>
                      <span className="w-8 h-8 rounded-full bg-ok-bg text-ok-ink grid place-items-center">
                        <TrendingUp size={16} />
                      </span>
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="serif text-3xl font-bold text-ink tabular-nums">{stats.avgScore??'Sense dades'}</span>
                        <span className="text-xs text-ink-muted font-bold">/10</span>
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                        <span className="text-ok font-bold">▲ Real</span> segons respostes BD
                      </div>
                    </div>
                    <div className="flex gap-1.5 text-[11px] text-ink-muted font-semibold">
                      <span className="chip bg-ok-bg text-ok-ink">Escales normalitzades</span>
                    </div>
                  </article>

                  <article className="card p-4 flex flex-col justify-between gap-2"><div className="flex justify-between items-start"><span className="eyebrow text-ink-muted">Preguntes</span><span className="w-8 h-8 rounded-full bg-cream grid place-items-center"><MessageSquare size={16}/></span></div><strong className="serif text-3xl font-bold">{stats.questions.length}</strong><p className="text-xs text-ink-muted">Resultats de les preguntes de la campanya</p><span className="chip bg-cream self-start">Llindar: {stats.threshold} respostes</span></article>
                  {/* 4. Temps mitjà i anonimat */}
                  <article className="card p-4 flex flex-col justify-between gap-2">
                    <div className="flex justify-between items-start">
                      <span className="eyebrow text-ink-muted">Temps de resposta</span>
                      <span className="w-8 h-8 rounded-full bg-cream grid place-items-center text-ink-soft">
                        <Clock size={16} />
                      </span>
                    </div>
                    <div>
                      <div className="serif text-3xl font-bold text-ink tabular-nums">
                        {stats.avgDurationSecs===null?'Sense dades':`${stats.avgDurationSecs} s`}
                      </div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        Durada mitjana registrada a les respostes
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11.5px] text-ok-ink bg-ok-bg px-2 py-0.5 rounded-[8px] font-bold">
                      <ShieldCheck size={14} /> K-anonimat actiu
                    </div>
                  </article>
                </section>

                {/* Panell de Gràfics Principals */}
                <section aria-label="Tipus de gràfics analítics" className="grid gap-5 lg:grid-cols-2">
                  {/* Gràfic 1: Evolució temporal (Línia) */}
                  <div className="card p-5 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="serif text-xl font-bold text-ink">Evolució temporal de respostes</h2>
                        <p className="text-xs text-ink-muted mt-0.5">Volum de respostes per període amb mostra suficient</p>
                      </div>
                      <span className="chip bg-cream text-ink-muted text-[11px]">Evolució</span>
                    </div>
                    <GroupedBarChart categories={stats.timeline.map(r=>r.label)} series={[{label:"Respostes",color:"#C8102E",values:stats.timeline.map(r=>r.count)}]} maxScore={Math.max(...stats.timeline.map(r=>r.count),1)} height={170}/>
                  </div>

                  {/* Gràfic 2: Canals de difusió (Donut circular) */}
                  <div className="card p-5 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="serif text-xl font-bold text-ink">Distribució per Canal de difusió</h2>
                        <p className="text-xs text-ink-muted mt-0.5">Origen de les respostes registrades</p>
                      </div>
                      <span className="chip bg-cream text-ink-muted text-[11px]">Gràfic circular</span>
                    </div>
                    <div className="py-1 flex justify-center">
                      <DonutChart
                        data={stats.channelBreakdown.map((c, i) => ({
                          key: c.code,
                          label: c.label,
                          value: c.count,
                          color: ['#C8102E', '#2D5C9E', '#2F7A4E', '#B08A45', '#7A0C1E'][i % 5],
                        }))}
                        centerLabel="Total"
                        centerValue={stats.totalResponses}
                      />
                    </div>
                  </div>

                  {/* Gràfic 3: Comparativa per Torn de feina (Columnes agrupades) */}
                  <div className="card p-5 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="serif text-xl font-bold text-ink">Comparativa de participació per Torn</h2>
                        <p className="text-xs text-ink-muted mt-0.5">Respostes agregades per torn laboral</p>
                      </div>
                      <span className="chip bg-cream text-ink-muted text-[11px]">Columnes</span>
                    </div>
                    <GroupedBarChart
                      categories={stats.shiftBreakdown.map(s => s.label)}
                      series={[
                        {
                          label: 'Respostes aportades',
                          color: '#C8102E',
                          values: stats.shiftBreakdown.map(s => s.count),
                        },
                      ]}
                      maxScore={Math.max(...stats.shiftBreakdown.map(s => s.count), 10)}
                      height={160}
                    />
                  </div>

                  {/* Gràfic 4: Radar de Dimensions clau (Spider / Radar) */}
                  <div className="card p-5 flex flex-col justify-between gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="serif text-xl font-bold text-ink">Dimensions Clau</h2>
                        <p className="text-xs text-ink-muted mt-0.5">Puntuació normalitzada de les dimensions mesurades</p>
                      </div>
                      <span className="chip bg-cream text-ink-muted text-[11px]">Dimensions</span>
                    </div>
                    <div className="py-1 flex justify-center">
                      <HorizontalBarChart items={stats.dimensions.map(d=>({key:d.label,label:d.label,value:d.score,sublabel:`${d.count} respostes`}))} maxVal={10} showPct={false}/>
                    </div>
                  </div>
                </section>

                {/* Desglossament per Preguntes individuals */}
                <section aria-label="Desglossament de preguntes" className="flex flex-col gap-4">
                  <div className="flex justify-between items-baseline flex-wrap gap-2">
                    <div>
                      <h2 className="serif text-2xl font-bold text-ink">Desglossament per Pregunta</h2>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Dades en temps real de les preguntes oficials de la campanya.
                      </p>
                    </div>
                    <span className="chip bg-cream text-ink-muted font-bold text-xs">
                      {stats.questions.length} preguntes avaluades
                    </span>
                  </div>

                  <div className="grid gap-4">
                    {stats.questions.map((q,idx)=><QuestionCard key={q.id} index={idx} totalResponses={stats.totalResponses} protectedResult={q.isSuppressed} metric={{question:{id:q.id,text:q.text,type:q.type==='open_text'?'text':q.type==='scale'?'scale':q.type==='boolean'?'yesno':'list',dim:q.dimension||`Versió ${q.version}`,secs:0},totalAnswers:q.totalAnswers,avgScore:q.avgScore??undefined,optionsBreakdown:q.distribution,shiftComparison:q.shifts.map(r=>({shift:r.code as ShiftType,label:r.label,avgScoreOrTop:r.score??'Sense dades'}))}}/>)}
                  </div>
                </section>

                <section className="card p-5 flex flex-col gap-2 text-xs text-ink-muted" aria-label="Font i límits">{stats.notes.map(note=><p key={note}>{note}</p>)}</section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  BarChart3,
  Download,
  Layers,
  MessageSquare,
  Printer,
  Sparkles,
  Users,
  ShieldCheck,
  Clock,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import { AI_SUMMARIES, DIMENSIONS, HEAT, TOPICS, ZONES, zoneByKey } from '../../data/mock'
import type { ZoneKey } from '../../data/types'
import { useApp } from '../../store/AppContext'
import { PageHead } from '../../components/HRLayout'
import { Meter, cn, fmt } from '../../components/ui'
import {
  ANALYTICS_FORMS,
  exportResponsesCsv,
  filterAndAggregateForm,
  type AnalyticsFormConfig,
  type FilterOptions,
} from '../../data/surveyAnalytics'
import { DonutChart, GroupedBarChart, RadarChart, TimelineChart } from '../../components/analytics/AnalyticsCharts'
import { AnalyticsFilterBar } from '../../components/analytics/AnalyticsFilterBar'
import { QuestionCard } from '../../components/analytics/QuestionCard'

const seq = (v: number) => `hsl(220 30% ${Math.round(94 - Math.max(0, Math.min(1, (v - 4.5) / 4)) * 62)}%)`

function Spark({ data }: { data: number[] }) {
  const lo = Math.min(...data) - 0.2,
    hi = Math.max(...data) + 0.2
  const pts = data
    .map(
      (v, i) =>
        `${(4 + i * (192 / (data.length - 1))).toFixed(1)},${(46 - ((v - lo) / (hi - lo)) * 42).toFixed(1)}`,
    )
    .join(' ')
  const last = pts.split(' ').pop()!.split(',')
  return (
    <svg viewBox="0 0 200 50" className="w-full h-[50px]" aria-hidden>
      <line x1="0" x2="200" y1="49" y2="49" stroke="#EFE7DC" />
      <polyline points={pts} fill="none" stroke="#1F1A18" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="3.5" fill="#C8102E" />
    </svg>
  )
}

export default function Analisi() {
  const [params, setParams] = useSearchParams()
  const { hrSurveys } = useApp()

  // Tab principal: 'formulari' (analítica de formularis) o 'global' (visió macro i IA)
  const activeTab = (params.get('tab') as 'formulari' | 'global') || 'formulari'
  const setTab = (tab: 'formulari' | 'global') => {
    setParams(prev => {
      prev.set('tab', tab)
      return prev
    })
  }

  // Integració de formularis: llista base + enquestes creades a la plataforma
  const allForms = useMemo<AnalyticsFormConfig[]>(() => {
    const existingIds = new Set(ANALYTICS_FORMS.map(f => f.id))
    const customForms: AnalyticsFormConfig[] = hrSurveys
      .filter(s => !existingIds.has(s.id))
      .map(s => ({
        ...s,
        category: 'Operacions',
        description: s.goal || 'Enquesta creada dinàmicament des de RRHH.',
        version: 'v1.0',
        responses: s.responses || 35,
        target: s.target || 100,
      }))
    return [...ANALYTICS_FORMS, ...customForms]
  }, [hrSurveys])

  // Formulari seleccionat (per defecte el de la query param o el primer)
  const selectedFormId = params.get('form') || allForms[0]?.id || 'pols-novembre'
  const setSelectedFormId = (id: string) => {
    setParams(prev => {
      prev.set('form', id)
      return prev
    })
  }

  const currentForm = allForms.find(f => f.id === selectedFormId) || allForms[0]

  // Estat dels filtres
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    zone: 'all',
    shift: 'all',
    channel: 'all',
    sentiment: 'all',
    searchQuery: '',
  })

  // Càlcul de mètriques agregades amb el motor d'analítica
  const stats = useMemo(() => {
    return filterAndAggregateForm(currentForm, filters)
  }, [currentForm, filters])

  // Descarregar dades en CSV
  const handleExportCsv = () => {
    exportResponsesCsv(currentForm, stats)
  }

  // Imprimir informe
  const handlePrint = () => {
    window.print()
  }

  const heatKeys = Object.keys(HEAT) as ZoneKey[]

  return (
    <div className="flex flex-col gap-6">
      {/* Capçalera de la pàgina */}
      <PageHead
        eyebrow="People Analytics · Escolta Activa"
        title="Anàlisi i Insights de Formularis"
        sub="Mètriques agregades per formulari, comparatives per torns i canals, desglossament per preguntes i k-anonimat garantit."
        actions={
          <div className="flex items-center gap-2 flex-wrap no-print">
            <button
              type="button"
              onClick={handleExportCsv}
              className="btn-line"
              title="Descarregar respostes filtrades en format CSV"
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

      {/* Navegació de pestanyes: Analítica per Formulari vs Clima Global */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-3 no-print">
        <button
          type="button"
          onClick={() => setTab('formulari')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold transition',
            activeTab === 'formulari' ? 'bg-ink text-white' : 'text-ink-soft hover:bg-cream',
          )}
        >
          <BarChart3 size={17} />
          <span>Analítica de Formularis</span>
          <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{allForms.length} formularis</span>
        </button>

        <button
          type="button"
          onClick={() => setTab('global')}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-[12px] text-sm font-bold transition',
            activeTab === 'global' ? 'bg-ink text-white' : 'text-ink-soft hover:bg-cream',
          )}
        >
          <Layers size={17} />
          <span>Visió Global de Planta & IA</span>
          <span className="chip bg-cream text-ink-muted text-[11px]">Macro</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* PESTANYA 1: ANALÍTICA DE FORMULARIS                                    */}
      {/* ==================================================================== */}
      {activeTab === 'formulari' && (
        <div className="flex flex-col gap-6">
          {/* Barra de Filtres interactius */}
          <AnalyticsFilterBar
            forms={allForms}
            selectedFormId={currentForm.id}
            onSelectForm={setSelectedFormId}
            filters={filters}
            onChangeFilters={setFilters}
            totalMatching={stats.totalResponses}
            totalAvailable={currentForm.responses}
          />

          {/* Advertència de k-anonimat si n < 5 */}
          {stats.isSuppressed ? (
            <div className="card p-6 bg-warn-bg text-warn-ink border border-warn/30 flex items-start gap-4">
              <AlertTriangle size={24} className="shrink-0 mt-0.5 text-warn" />
              <div>
                <h3 className="serif text-xl font-bold">Mostra protegida per privacitat (k-anonimat)</h3>
                <p className="text-sm mt-1 leading-relaxed">
                  Hi ha només {stats.totalResponses} respostes per a la combinació de filtres seleccionada. La plataforma
                  exigeix un mínim de 5 respostes agregades per mostrar mètriques i comentaris individuals, protegint
                  l’anonimat del treballador.
                </p>
                <p className="text-xs font-bold mt-2">Prova d’ampliar el rang de dates o seleccionar totes les zones.</p>
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
                      {stats.participationRate}%
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      {stats.totalResponses} respostes de {currentForm.target} objectiu
                    </div>
                  </div>
                  <Meter value={stats.participationRate} goal={60} thin />
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
                      <span className="serif text-3xl font-bold text-ink tabular-nums">{stats.avgScore}</span>
                      <span className="text-xs text-ink-muted font-bold">/10</span>
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-1">
                      <span className="text-ok font-bold">▲ +0.3</span> respecte a l’anterior mes
                    </div>
                  </div>
                  <div className="flex gap-1.5 text-[11px] text-ink-muted font-semibold">
                    <span className="chip bg-ok-bg text-ok-ink">NPS: +{stats.npsScore}</span>
                  </div>
                </article>

                {/* 3. Sentiment Predominant */}
                <article className="card p-4 flex flex-col justify-between gap-2">
                  <div className="flex justify-between items-start">
                    <span className="eyebrow text-ink-muted">Clima & Sentiment</span>
                    <span className="w-8 h-8 rounded-full bg-cream grid place-items-center text-ink-soft">
                      <MessageSquare size={16} />
                    </span>
                  </div>
                  <div>
                    <div className="serif text-3xl font-bold text-ink tabular-nums">
                      {stats.sentimentBreakdown.positiu.pct}%
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      Positiu ({stats.sentimentBreakdown.positiu.count}) · Neutre ({stats.sentimentBreakdown.neutre.pct}%)
                    </div>
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden bg-cream-dk">
                    <div style={{ width: `${stats.sentimentBreakdown.positiu.pct}%` }} className="bg-ok" />
                    <div style={{ width: `${stats.sentimentBreakdown.neutre.pct}%` }} className="bg-gold" />
                    <div style={{ width: `${stats.sentimentBreakdown.negatiu.pct}%` }} className="bg-red" />
                  </div>
                </article>

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
                      {stats.avgDurationSecs} s
                    </div>
                    <div className="text-xs text-ink-muted mt-0.5">
                      Mitjana àgil de compliment (&lt; 2 minuts)
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
                      <p className="text-xs text-ink-muted mt-0.5">Volum diari i mitjana de satisfacció</p>
                    </div>
                    <span className="chip bg-cream text-ink-muted text-[11px]">Línia temporal</span>
                  </div>
                  <TimelineChart data={stats.timeline} height={170} />
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
                        key: c.channel,
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
                      <p className="text-xs text-ink-muted mt-0.5">Matí vs Tarda vs Nit vs Flexible</p>
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
                      <h2 className="serif text-xl font-bold text-ink">Radar de Dimensions Clau</h2>
                      <p className="text-xs text-ink-muted mt-0.5">Puntuació per eix vs mitjana global Damm</p>
                    </div>
                    <span className="chip bg-cream text-ink-muted text-[11px]">Radar</span>
                  </div>
                  <div className="py-1 flex justify-center">
                    <RadarChart data={stats.dimensionRadar} size={220} />
                  </div>
                </div>
              </section>

              {/* Desglossament per Preguntes individuals (amb switches de gràfic) */}
              <section aria-label="Desglossament de preguntes" className="flex flex-col gap-4">
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <div>
                    <h2 className="serif text-2xl font-bold text-ink">Desglossament per Pregunta</h2>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Pots alternar el tipus de gràfic (Barres, Donut o Comparativa de Torns) a cada pregunta.
                    </p>
                  </div>
                  <span className="chip bg-cream text-ink-muted font-bold text-xs">
                    {currentForm.questions.length} preguntes avaluades
                  </span>
                </div>

                <div className="grid gap-4">
                  {stats.questionBreakdown.map((metric, idx) => (
                    <QuestionCard
                      key={metric.question.id}
                      metric={metric}
                      index={idx}
                      totalResponses={stats.totalResponses}
                    />
                  ))}
                </div>
              </section>

              {/* Feed de Comentaris Qualitatius i Sentiment */}
              {stats.comments.length > 0 && (
                <section aria-label="Comentaris anonimitzats" className="card p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-baseline flex-wrap gap-2 border-b border-line pb-3">
                    <div>
                      <h2 className="serif text-2xl font-bold text-ink">Comentaris i Propostes Anonimitzades</h2>
                      <p className="text-xs text-ink-muted mt-0.5">
                        Extracció automàtica de to i categoria. Els noms i dades personals estan enmascarats.
                      </p>
                    </div>
                    <span className="chip bg-cream text-ink-muted font-bold text-xs">
                      {stats.comments.length} comentaris
                    </span>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.comments.map(c => {
                      const badge =
                        c.sentiment === 'positiu'
                          ? 'bg-ok-bg text-ok-ink'
                          : c.sentiment === 'neutre'
                            ? 'bg-warn-bg text-warn-ink'
                            : 'bg-red-soft text-red-dk'
                      return (
                        <div key={c.id} className="rounded-[14px] border border-line bg-paper p-3.5 flex flex-col justify-between gap-3 shadow-sm">
                          <p className="text-[13px] leading-relaxed text-ink italic">&quot;{c.text}&quot;</p>
                          <div className="flex items-center justify-between text-[11px] pt-2 border-t border-line/60">
                            <span className="font-bold text-ink-muted capitalize">
                              {c.zone} · {c.shift}
                            </span>
                            <span className={cn('chip !text-[10px] uppercase font-extrabold', badge)}>
                              {c.sentiment}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* PESTANYA 2: VISIÓ GLOBAL DE PLANTA & IA (Clima general)               */}
      {/* ==================================================================== */}
      {activeTab === 'global' && (
        <div className="flex flex-col gap-6">
          {/* Resums executius IA */}
          <section aria-label="Resums de la IA" className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
            {AI_SUMMARIES.map(s => {
              const c = s.confidence
              const chip =
                c === 0
                  ? ['Sense resum', 'bg-fog-bg text-fog']
                  : c >= 0.8
                    ? [`Confiança alta · ${Math.round(c * 100)}%`, 'bg-ok-bg text-ok-ink']
                    : [`Confiança mitjana · ${Math.round(c * 100)}%`, 'bg-warn-bg text-warn-ink']
              return (
                <article key={s.zone} className="card p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-xs font-bold text-ink-muted">{s.zone}</span>
                    <span className={cn('chip', chip[1])}>{chip[0]}</span>
                  </div>
                  <h2 className="text-[15px] font-bold leading-snug">{s.title}</h2>
                  <p className="text-[13px] leading-relaxed text-ink-muted">{s.body}</p>
                  <div className="mt-auto text-[11.5px] text-ink-muted">Basat en {s.n} respostes · resum revisable</div>
                </article>
              )
            })}
          </section>

          {/* Temes detectats & Heatmap per zones */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5 min-w-0">
              <h2 className="serif text-[22px]">Temes detectats en comentaris</h2>
              <p className="text-xs text-ink-muted mb-4">Mencions als comentaris i to mitjà (de negatiu a positiu)</p>
              <div className="flex flex-col gap-2.5">
                {TOPICS.map(t => {
                  const half = Math.abs(t.s) * 50
                  return (
                    <div
                      key={t.label}
                      className="grid grid-cols-[minmax(0,140px)_minmax(0,1fr)_40px_110px] items-center gap-2.5 text-[13px]"
                    >
                      <span className="truncate">{t.label}</span>
                      <div className="h-2.5 rounded-full bg-cream-dk">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${(t.n / 312) * 100}%` }} />
                      </div>
                      <span className="text-right tabular-nums text-ink-muted">{t.n}</span>
                      <div className="relative h-2.5 rounded-full bg-cream-dk" title={`To ${fmt(t.s, 2)}`}>
                        <div className="absolute left-1/2 -top-1 w-px h-[18px] bg-[#A1A1AA]" />
                        <div
                          className="absolute top-0 h-2.5 rounded-full"
                          style={{
                            left: t.s < 0 ? `${50 - half}%` : '50%',
                            width: `${half}%`,
                            background: t.s < 0 ? '#C2410C' : '#1D4ED8',
                          }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex gap-4 mt-3.5 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#C2410C]" />
                  To negatiu
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-[3px] bg-[#1D4ED8]" />
                  To positiu
                </span>
              </div>
            </section>

            <section className="card p-5 min-w-0">
              <h2 className="serif text-[22px]">Comparativa per zones (Heatmap)</h2>
              <p className="text-xs text-ink-muted mb-3">
                Mitjana per dimensió (0–10) · més fosc = més alt · Manteniment ocult (&lt;10 respostes)
              </p>
              <div className="overflow-x-auto scroll-thin">
                <table className="w-full min-w-[560px] text-[12.5px] border-separate border-spacing-1">
                  <thead>
                    <tr>
                      <th />
                      {heatKeys.map(k => (
                        <th key={k} className="font-bold text-ink-muted text-[11px] text-center">
                          {zoneByKey(k).name.replace('Recepció de ', '')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DIMENSIONS.map((d, di) => (
                      <tr key={d}>
                        <td className="pr-2 font-medium whitespace-nowrap">{d}</td>
                        {heatKeys.map(k => {
                          const v = HEAT[k]![di]
                          return (
                            <td
                              key={k}
                              className="h-9 rounded-lg text-center font-semibold tabular-nums"
                              style={{
                                background: seq(v),
                                color: (v - 4.5) / 4 > 0.55 ? '#fff' : '#1F1A18',
                              }}
                            >
                              {fmt(v)}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Evolució històrica per zona */}
          <section className="card p-5">
            <h2 className="serif text-[22px]">Evolució per zona (Últims 12 mesos)</h2>
            <p className="text-xs text-ink-muted mb-3">Índex de benestar agregat per equip</p>
            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
              {ZONES.filter(z => z.trend.length).map(z => (
                <div key={z.key} className="border border-cream-dk rounded-[14px] p-3">
                  <div className="flex justify-between text-[13px]">
                    <strong>{z.name}</strong>
                    <span className={cn('font-bold', z.delta < 0 ? 'text-[#B4261E]' : 'text-ok')}>
                      {z.delta < 0 ? '▼' : z.delta > 0 ? '▲' : ''} {fmt(Math.abs(z.delta))}
                    </span>
                  </div>
                  <div className="serif text-2xl my-0.5">{fmt(z.score!)}</div>
                  <Spark data={z.trend} />
                </div>
              ))}
            </div>
          </section>

          {/* Problemes emergents i Llindar de mostra */}
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="card p-5">
              <h2 className="serif text-[22px] mb-3">Problemes emergents detectats</h2>
              {[
                ['+180%', 'Temperatura a la sala de cocció', 'Sala de cocció', 23],
                ['+95%', 'App de fitxatge lenta', 'Logística', 17],
                ['+60%', 'Volum de reunions', 'Oficines', 14],
              ].map(([g, l, z, n]) => (
                <div
                  key={String(l)}
                  className="flex items-center gap-3.5 border border-cream-dk rounded-[14px] p-3.5 mb-2.5 last:mb-0"
                >
                  <span className="text-[13px] font-extrabold text-[#9A3412] bg-[#FFEDD5] rounded-[10px] px-2.5 py-2">
                    {g}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold">{l}</div>
                    <div className="text-xs text-ink-muted">
                      {z} · {n} mencions en 30 dies
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <section className="card p-5">
              <h2 className="serif text-[22px]">Mostra suficient per protegir l’anonimat?</h2>
              <p className="text-xs text-ink-muted mb-3">Respostes per zona respecte al mínim de 10</p>
              <div className="flex flex-col gap-2">
                {ZONES.filter(z => z.survey).map(z => (
                  <div key={z.key} className="grid grid-cols-[130px_minmax(0,1fr)_70px] gap-2.5 items-center text-[13px]">
                    <span className="truncate">{z.name}</span>
                    <div className="h-2 rounded-full bg-cream-dk">
                      <div
                        className={cn('h-full rounded-full', z.responses < 10 ? 'bg-fog' : 'bg-ink')}
                        style={{ width: `${Math.min(100, z.responses)}%` }}
                      />
                    </div>
                    <span
                      className={cn(
                        'text-right text-xs font-bold',
                        z.responses < 10 ? 'text-warn' : 'text-ink-muted',
                      )}
                    >
                      {z.responses < 10 ? `${z.responses}/10` : `${z.responses} resp.`}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  )
}

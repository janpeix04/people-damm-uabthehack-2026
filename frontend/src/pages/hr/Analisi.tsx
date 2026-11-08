import { useEffect, useMemo, useState } from 'react'
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
import { useApp } from '../../store/AppContext'
import { useSites } from '../../api/departments'
import { fetchSurveyAnalytics } from '../../api/hr'
import { PageHead } from '../../components/HRLayout'
import { Meter, cn } from '../../components/ui'
import {
  exportResponsesCsv,
  type AnalyticsFormConfig,
  type AggregateStats,
  type FilterOptions,
} from '../../data/surveyAnalytics'
import { DonutChart, GroupedBarChart, RadarChart, TimelineChart } from '../../components/analytics/AnalyticsCharts'
import { AnalyticsFilterBar } from '../../components/analytics/AnalyticsFilterBar'
import { QuestionCard } from '../../components/analytics/QuestionCard'

export default function Analisi() {
  const [params, setParams] = useSearchParams()
  const { hrSurveys, hrLoading, hrError, refreshHr } = useApp()
  const site = params.get('centre') || ''
  const { sites } = useSites()
  const siteName = site ? sites.find(s => s.code === site)?.name ?? site : ''

  const allForms = useMemo<AnalyticsFormConfig[]>(() => hrSurveys.map(s => {
    return {
      ...s,
      category: s.id.includes('seguretat') ? 'Seguretat'
        : s.id.includes('clima') || s.id.includes('pols') ? 'Clima'
        : s.id.includes('talent') ? 'Talent'
        : 'Operacions',
      description: s.goal || '',
      version: 'v1.0',
      responses: s.responses ?? 0,
      target: s.target ?? 0,
      questions: (s.questions && s.questions.length > 0) ? s.questions : [],
    } as AnalyticsFormConfig
  }), [hrSurveys])

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

  // Dades reals agregades directament des de PostgreSQL
  const [stats, setStats] = useState<AggregateStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!currentForm?.id) return
    setLoading(true)
    fetchSurveyAnalytics({
      form: currentForm.id,
      site: site || undefined,
      zone: filters.zone !== 'all' ? filters.zone : undefined,
      shift: filters.shift !== 'all' ? filters.shift : undefined,
      channel: filters.channel !== 'all' ? filters.channel : undefined,
      sentiment: filters.sentiment !== 'all' ? filters.sentiment : undefined,
      dateRange: filters.dateRange !== 'all' ? filters.dateRange : undefined,
      searchQuery: filters.searchQuery || undefined,
    })
      .then(data => {
        if (active) {
          setStats(data)
          setError(null)
        }
      })
      .catch(err => {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error carregant dades reals.')
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [currentForm?.id, site, filters.zone, filters.shift, filters.channel, filters.sentiment, filters.dateRange, filters.searchQuery])

  // Descarregar dades en CSV
  const handleExportCsv = () => {
    if (currentForm && stats) exportResponsesCsv(currentForm, stats, site)
  }

  // Imprimir informe
  const handlePrint = () => {
    window.print()
  }

  if (hrLoading && !allForms.length) return <p role="status">Carregant enquestes...</p>
  if (hrError) return <div role="alert">{hrError}<button className="btn-line ml-2" onClick={() => void refreshHr()}>Reintentar</button></div>
  if (!currentForm) return <div className="card p-6">Encara no hi ha enquestes a la base de dades.</div>

  return (
    <div className="flex flex-col gap-6">
      {/* Capçalera de la pàgina */}
      <PageHead
        eyebrow="People Analytics · Escolta Activa"
        title="Anàlisi i Insights de Formularis (Dades Reals BD)"
        sub={`${siteName ? `Centre: ${siteName} · ` : 'Tot el grup Damm · '}Mètriques en directe de PostgreSQL, respecte estricte de departaments per seu i k-anonimat garantit.`}
        actions={
          <div className="flex items-center gap-2 flex-wrap no-print">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={!stats}
              className="btn-line"
              title="Descarregar informe de mètriques i comentaris reals en format CSV"
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
        <AnalyticsFilterBar
          forms={allForms}
          selectedFormId={currentForm.id}
          onSelectForm={setSelectedFormId}
          filters={filters}
          onChangeFilters={setFilters}
          totalMatching={stats?.totalResponses ?? 0}
          totalAvailable={currentForm.responses}
        />

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
                    Hi ha només {stats.totalResponses} respostes per a la combinació de filtres seleccionada. La plataforma
                    exigeix un mínim de 10 respostes agregades per mostrar mètriques i comentaris individuals, protegint
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
                        {stats.totalResponses} respostes de {stats.target} objectiu
                      </div>
                    </div>
                    <Meter value={stats.participationRate} thin />
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
                        <span className="text-ok font-bold">▲ Real</span> segons respostes BD
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
                      {stats.questionBreakdown.length} preguntes avaluades
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
                        <h2 className="serif text-2xl font-bold text-ink">Comentaris i Propostes Anonimitzades (PostgreSQL)</h2>
                        <p className="text-xs text-ink-muted mt-0.5">
                          Extrets directament de les respostes dels treballadors. PII enmascarada amb el protocol de protecció de dades.
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
          </>
        )}
      </div>
    </div>
  )
}

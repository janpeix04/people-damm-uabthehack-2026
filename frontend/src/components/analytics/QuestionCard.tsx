import { useState } from 'react'
import { BarChart2, PieChart, Clock, MessageSquare, ShieldCheck } from 'lucide-react'
import type { QuestionMetric } from '../../data/surveyAnalytics'
import { DonutChart, HorizontalBarChart } from './AnalyticsCharts'
import { cn } from '../ui'

const PALETTE = ['#C8102E', '#2D5C9E', '#2F7A4E', '#B08A45', '#7A0C1E', '#5E6672']

export function QuestionCard({
  metric,
  index,
  totalResponses,
}: {
  metric: QuestionMetric
  index: number
  totalResponses: number
}) {
  const { question, totalAnswers, avgScore, optionsBreakdown, shiftComparison } = metric
  const [viewMode, setViewMode] = useState<'bar' | 'donut' | 'shift'>('bar')

  const qTypeLabels: Record<string, string> = {
    scale: 'Escala (0–10)',
    faces: 'Emocional',
    list: 'Selecció d’opcions',
    yesno: 'Binària (Sí / No)',
    text: 'Resposta oberta',
  }

  // Preparació de dades per al Donut
  const donutData = optionsBreakdown.map((opt, i) => ({
    key: opt.label,
    label: opt.label,
    value: opt.count,
    color: PALETTE[i % PALETTE.length],
  }))

  // Preparació de dades per a Barres
  const barData = optionsBreakdown.map((opt, i) => ({
    key: opt.label,
    label: opt.label,
    value: opt.count,
    pct: opt.pct,
    color: PALETTE[i % PALETTE.length],
  }))

  const participationPct = totalResponses > 0 ? Math.round((totalAnswers / totalResponses) * 100) : 0

  return (
    <article className="card p-5 flex flex-col gap-4">
      {/* Capçalera de la pregunta */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-3.5">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <span className="w-7 h-7 rounded-full bg-ink text-white font-extrabold text-xs grid place-items-center shrink-0 mt-0.5">
            {index + 1}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="chip bg-red-soft text-red-dk font-bold">{question.dim}</span>
              <span className="chip bg-cream text-ink-muted text-[11px]">{qTypeLabels[question.type] || question.type}</span>
              <span className="text-xs text-ink-muted">· {participationPct}% de resposta ({totalAnswers} respostes)</span>
            </div>
            <h3 className="serif text-lg leading-snug text-ink font-semibold">{question.text}</h3>
          </div>
        </div>

        {/* Mètrica clau & selector de tipus de gràfic */}
        <div className="flex flex-col sm:items-end gap-2 shrink-0">
          {avgScore !== undefined && (
            <div className="flex items-baseline gap-1.5">
              <span className="eyebrow text-ink-muted">Mitjana</span>
              <span
                className={cn(
                  'serif text-2xl font-bold tabular-nums',
                  avgScore >= 7.5 ? 'text-ok' : avgScore >= 5.5 ? 'text-ink' : 'text-red',
                )}
              >
                {avgScore.toFixed(1)}
              </span>
              <span className="text-xs text-ink-muted font-bold">/10</span>
            </div>
          )}

          {/* Switcher de gràfic */}
          {question.type !== 'text' && (
            <div className="inline-flex rounded-[10px] bg-cream p-0.5 border border-line text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode('bar')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] transition',
                  viewMode === 'bar' ? 'bg-white text-ink shadow-sm font-bold' : 'text-ink-muted hover:text-ink',
                )}
                title="Veure gràfic de barres"
              >
                <BarChart2 size={13} aria-hidden />
                <span>Barres</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('donut')}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] transition',
                  viewMode === 'donut' ? 'bg-white text-ink shadow-sm font-bold' : 'text-ink-muted hover:text-ink',
                )}
                title="Veure gràfic circular"
              >
                <PieChart size={13} aria-hidden />
                <span>Donut</span>
              </button>
              {shiftComparison && shiftComparison.length > 0 && (
                <button
                  type="button"
                  onClick={() => setViewMode('shift')}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] transition',
                    viewMode === 'shift' ? 'bg-white text-ink shadow-sm font-bold' : 'text-ink-muted hover:text-ink',
                  )}
                  title="Comparar per torns"
                >
                  <Clock size={13} aria-hidden />
                  <span>Per Torn</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cos amb el gràfic seleccionat */}
      <div className="pt-1">
        {question.type === 'text' ? (
          <div className="flex flex-col gap-3 text-xs text-ink-soft bg-cream/60 rounded-[14px] p-4">
            <div className="flex items-center gap-2 text-ink-muted">
              <MessageSquare size={16} />
              <span>{totalAnswers} persones han aportat comentaris de millora en aquesta pregunta.</span>
            </div>
            <div className="text-[12px] text-ink-muted italic">
              Els comentaris individuals s’anonimitzen per complet i s’agrupen a la secció inferior d’insights de text.
            </div>
          </div>
        ) : viewMode === 'donut' ? (
          <div className="py-2 flex justify-center">
            <DonutChart data={donutData} centerLabel="Respostes" centerValue={totalAnswers} />
          </div>
        ) : viewMode === 'shift' && shiftComparison ? (
          <div className="flex flex-col gap-2.5">
            <span className="text-xs font-bold text-ink-muted">Mitjana de puntuació per torn de feina:</span>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {shiftComparison.map(s => (
                <div key={s.shift} className="rounded-[12px] border border-line bg-paper p-3 flex flex-col gap-1">
                  <span className="text-xs font-medium text-ink-muted">{s.label}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="serif text-xl font-bold text-ink">{s.avgScoreOrTop}</span>
                    <span className="text-[11px] text-ink-muted">/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <HorizontalBarChart items={barData} maxVal={totalAnswers} />
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-ink-muted pt-2 border-t border-line/60">
        <span className="flex items-center gap-1">
          <ShieldCheck size={13} className="text-ok" />
          K-anonimat garantit (respostes agregades, identificadors eliminats)
        </span>
        <span>Temps estimat: {question.secs}s</span>
      </div>
    </article>
  )
}

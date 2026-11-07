import { useState } from 'react'
import { X } from 'lucide-react'
import type { Question } from '../data/types'
import { cn, Face, FACES, PrivacyNote } from './ui'

interface Props {
  questions: Question[]
  onExit?: () => void
  onDone: (answers: Record<string, unknown>) => void
  preview?: boolean
}

/** Una pregunta per pantalla, botons grans i barra de progrés. */
export function SurveyRunner({ questions, onExit, onDone, preview }: Props) {
  const [step, setStep] = useState(0)
  const [ans, setAns] = useState<Record<string, unknown>>({})
  const q = questions[Math.min(step, questions.length - 1)]
  if (!q) return null
  const cur = ans[q.id]
  const ok = q.type === 'text' || cur !== undefined
  const left = questions.slice(step).reduce((a, x) => a + x.secs, 0)
  const set = (v: unknown) => setAns(a => ({ ...a, [q.id]: v }))
  const last = step === questions.length - 1

  const opt = (on: boolean) => cn('w-full min-h-[56px] px-4 rounded-[16px] border-2 text-left font-bold text-base transition', on ? 'border-red bg-red-soft' : 'border-line bg-white hover:border-ink-muted')

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 sm:px-5 pt-4 pb-3 flex flex-col gap-3 border-b border-cream-dk">
        <div className="flex justify-between items-center">
          {onExit ? (
            <button onClick={onExit} aria-label="Sortir" className="w-10 h-10 rounded-[12px] bg-cream grid place-items-center"><X size={20} /></button>
          ) : <span className="w-10" />}
          <span className="text-[13px] font-extrabold">Pregunta {step + 1} de {questions.length}</span>
          <span className="text-[13px] font-bold text-ink-muted">≈ {left} s</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${questions.length}, minmax(0,1fr))` }}>
          {questions.map((x, i) => <div key={x.id} className={cn('h-1.5 rounded-full', i <= step ? 'bg-red' : 'bg-cream-dk')} />)}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-6 flex flex-col gap-5">
        <div className="eyebrow !text-red">{q.dim}</div>
        <h1 className="serif text-[28px] leading-[1.15] -mt-2">{q.text}</h1>

        {q.type === 'faces' && (
          <div className="flex flex-col gap-2">
            {FACES.map((f, i) => (
              <button key={f[0]} aria-pressed={cur === i} onClick={() => set(i)} className={cn(opt(cur === i), 'flex items-center gap-3')}>
                <Face i={i} size={36} />{f[0]}
              </button>
            ))}
          </div>
        )}
        {(q.type === 'list' || q.type === 'yesno') && (
          <div className="flex flex-col gap-2">
            {(q.type === 'yesno' ? ['Sí', 'No', 'No ho sé'] : q.options ?? []).map((o, i) => (
              <button key={o} aria-pressed={cur === i} onClick={() => set(i)} className={opt(cur === i)}>{o}</button>
            ))}
          </div>
        )}
        {q.type === 'scale' && (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: 11 }, (_, n) => (
                <button key={n} aria-pressed={cur === n} onClick={() => set(n)} className={cn('h-[52px] rounded-[14px] border-2 font-extrabold text-[17px]', cur === n ? 'border-red bg-red text-white' : 'border-line bg-white')}>{n}</button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-ink-muted"><span>0 · gens</span><span>10 · molt</span></div>
          </div>
        )}
        {q.type === 'text' && (
          <div className="flex flex-col gap-2">
            <label htmlFor={`t-${q.id}`} className="text-[13px] font-bold">La teva resposta (opcional)</label>
            <textarea id={`t-${q.id}`} rows={5} value={(cur as string) ?? ''} onChange={e => set(e.target.value)} placeholder="Escriu aquí. No hi posis noms ni dades personals." className="input !text-base !rounded-[16px] resize-none" />
            <p className="text-xs text-ink-muted">El text es revisa i s’anonimitza abans d’analitzar-se.</p>
          </div>
        )}
      </div>

      <footer className="px-4 sm:px-5 pb-5 pt-2 flex flex-col gap-2.5">
        <PrivacyNote>Anònima: no guardem el teu nom, el dispositiu ni la ubicació.</PrivacyNote>
        <div className="flex gap-2">
          {step > 0 && <button className="btn-line !h-14 !text-base" onClick={() => setStep(s => s - 1)}>Enrere</button>}
          <button
            className={cn('btn flex-1 !h-14 !text-[17px]', ok ? 'bg-red text-white shadow-red' : 'bg-cream-dk text-ink-muted')}
            aria-disabled={!ok}
            onClick={() => { if (!ok) return; if (last) onDone(ans); else setStep(s => s + 1) }}
          >
            {last ? (preview ? 'Final de la previsualització' : 'Enviar') : 'Següent'}
          </button>
        </div>
      </footer>
    </div>
  )
}

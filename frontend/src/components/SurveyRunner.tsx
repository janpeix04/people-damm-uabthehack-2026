import { useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import type { Question } from '../data/types'
import { cn, Face, FACES } from './ui'

interface Props {
  questions: Question[]
  onExit?: () => void
  onDone: (answers: Record<string, unknown>) => void
  preview?: boolean
}

/** Una pregunta per pantalla, botons grans, barra de progrés i to proper/inclusiu d'IA per defecte. */
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

  const opt = (on: boolean) =>
    cn(
      'choice-option w-full min-h-[56px] px-4 rounded-[16px] border-2 text-left font-bold text-base transition',
      on ? 'border-red bg-red-soft' : 'border-line bg-white hover:border-ink-muted'
    )

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 sm:px-5 pt-4 pb-3 flex flex-col gap-3 border-b border-cream-dk">
        <div className="flex justify-between items-center">
          {onExit ? (
            <button onClick={onExit} aria-label="Sortir" className="w-10 h-10 rounded-[12px] bg-cream grid place-items-center">
              <X size={20} />
            </button>
          ) : (
            <span className="w-10" />
          )}
          <span className="text-[13px] font-extrabold">
            Pregunta {step + 1} de {questions.length}
          </span>
          <span className="text-[13px] font-bold text-ink-muted">≈ {left} s</span>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${questions.length}, minmax(0,1fr))` }}>
          {questions.map((x, i) => (
            <div key={x.id} className={cn('survey-progress-step h-1.5 rounded-full', i <= step ? 'bg-red' : 'bg-cream-dk')} />
          ))}
        </div>
      </header>

      {/* Missatge de suport de la IA segons el tipus de pregunta */}
      {step > 0 && (
        <div className="mx-4 sm:mx-5 mt-3 px-3.5 py-2.5 rounded-[14px] bg-[#FAF7F2] border border-[#E8DEC8] flex items-center gap-2.5 text-xs">
          <Sparkles size={16} className="text-red shrink-0" aria-hidden />
          <span className="text-ink leading-snug">
            {q.type !== 'text' ? (
              <>
                <strong>To proper i inclusiu:</strong> Totes les respostes són confidencials i s'utilitzen únicament per impulsar millores col·lectives.
              </>
            ) : (
              <>
                <strong>Espai obert d'escolta:</strong> Pots escriure lliurement. La IA anonimitza de forma automàtica qualsevol dada identificativa.
              </>
            )}
          </span>
        </div>
      )}

      <div key={q.id} className="question-stage flex-1 overflow-y-auto px-4 sm:px-5 py-5 flex flex-col gap-4">
        <div className="eyebrow !text-red">{q.dim}</div>
        <h1 className="serif text-[26px] sm:text-[28px] leading-[1.15] -mt-1 text-ink">{q.text}</h1>
        {q.help && <p className="text-sm text-ink-muted -mt-2">{q.help}</p>}

        {q.type === 'faces' && (
          <div className="flex flex-col gap-2">
            {FACES.map((f, i) => (
              <button
                key={f[0]}
                aria-pressed={cur === i}
                onClick={() => set(i)}
                className={cn(opt(cur === i), 'flex items-center gap-3')}
              >
                <Face i={i} size={36} />
                {f[0]}
              </button>
            ))}
          </div>
        )}
        {(q.type === 'list' || q.type === 'yesno') && (
          <div className="flex flex-col gap-2">
            {(q.type === 'yesno' ? ['Sí', 'No', 'No ho sé'] : q.options ?? []).map((o, i) => (
              <button key={o} aria-pressed={cur === i} onClick={() => set(i)} className={opt(cur === i)}>
                {o}
              </button>
            ))}
          </div>
        )}
        {q.type === 'scale' && (() => {
          const min = q.min ?? 0
          const max = q.max ?? 10
          const values = Array.from({ length: max - min + 1 }, (_, i) => min + i)
          return (
            <div className="flex flex-col gap-2">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${Math.min(values.length, 6)}, minmax(0,1fr))` }}>
                {values.map(n => (
                  <button
                    key={n}
                    aria-pressed={cur === n}
                    onClick={() => set(n)}
                    className={cn(
                      'h-[52px] rounded-[14px] border-2 font-extrabold text-[17px]',
                      cur === n ? 'border-red bg-red text-white' : 'border-line bg-white'
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-ink-muted">
                <span>{min} · {max - min <= 4 ? 'molt baix' : 'gens'}</span>
                <span>{max} · {max - min <= 4 ? 'molt alt' : 'molt'}</span>
              </div>
            </div>
          )
        })()}
        {q.type === 'text' && (
          <div className="flex flex-col gap-2">
            <label htmlFor={`t-${q.id}`} className="text-[13px] font-bold">
              La teva aportació constructiva (opcional)
            </label>
            <textarea
              id={`t-${q.id}`}
              rows={5}
              value={(cur as string) ?? ''}
              onChange={e => set(e.target.value)}
              placeholder="Escriu aquí la teva visió lliurement. No cal incloure noms ni dades personals."
              className="input !text-base !rounded-[16px] resize-none"
            />
            <p className="text-xs text-ink-muted">El text és moderat i anonimitzat abans de consolidar-se en els informes agregats.</p>
          </div>
        )}
      </div>

      <footer className="px-4 sm:px-5 pb-5 pt-2 flex flex-col gap-2.5">
        
        <div className="flex gap-2">
          {step > 0 && (
            <button className="btn-line !h-14 !text-base px-5 font-bold" onClick={() => setStep(s => s - 1)}>
              Enrere
            </button>
          )}
          <button
            className={cn('btn flex-1 !h-14 !text-[16px] font-bold', ok ? 'bg-red text-white shadow-red' : 'bg-cream-dk text-ink-muted')}
            aria-disabled={!ok}
            onClick={() => {
              if (!ok) return
              if (last) onDone(ans)
              else setStep(s => s + 1)
            }}
          >
            {last ? (preview ? 'Final de la previsualització' : 'Enviar respostes anònimes ✓') : 'Següent pregunta →'}
          </button>
        </div>
      </footer>
    </div>
  )
}

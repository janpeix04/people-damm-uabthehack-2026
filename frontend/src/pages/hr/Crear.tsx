import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Pencil, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { CHANNELS, KEYWORDS, MIN_SAMPLE, QUESTION_BANK, SURVEY_ZONES, TEMPLATES } from '../../data/mock'
import type { ChannelKey, Question, Survey, ZoneKey } from '../../data/types'
import { useApp } from '../../store/AppContext'
import { cn, PathIcon, PrivacyNote } from '../../components/ui'
import { SurveyRunner } from '../../components/SurveyRunner'

const STEPS = ['Objectiu', 'Preguntes', 'Públic i canals', 'Revisió i publicació']
const TYPE_LABEL: Record<Question['type'], string> = { faces: 'Cares', list: 'Opcions', scale: '0–10', yesno: 'Sí / No', text: 'Text opcional' }
const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)

/** Simulació de la IA: tria preguntes del banc segons les paraules clau de l’objectiu. */
function generate(goal: string): Question[] {
  const g = goal.toLowerCase()
  const groups = Object.keys(KEYWORDS).filter(k => KEYWORDS[k].some(w => g.includes(w)))
  const keys = [...(groups.length ? groups : ['general']), 'general', 'obert']
  const seen = new Set<string>()
  const out: Question[] = []
  keys.forEach(k => QUESTION_BANK[k].forEach(q => { if (!seen.has(q.text) && out.length < 8) { seen.add(q.text); out.push({ ...q, id: `q${out.length + 1}-${Date.now().toString(36)}` }) } }))
  return out
}

export default function Crear() {
  const [params] = useSearchParams()
  const nav = useNavigate()
  const { addSurvey, toast } = useApp()
  const tpl = params.get('plantilla')
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState(tpl ? TEMPLATES[+tpl]?.name ?? '' : 'Torns, descans i conciliació')
  const [goal, setGoal] = useState(tpl ? TEMPLATES[+tpl]?.goal ?? '' : TEMPLATES[1].goal)
  const [dur, setDur] = useState('1 min')
  const [loading, setLoading] = useState(false)
  const [pool, setPool] = useState<Question[]>([])
  const [sel, setSel] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [zones, setZones] = useState<ZoneKey[]>(['envasat', 'logistica'])
  const [channels, setChannels] = useState<ChannelKey[]>(['qr', 'app', 'whatsapp', 'tablet', 'placa', 'world'])
  const [opens, setOpens] = useState(today())
  const [closes, setCloses] = useState(plusDays(14))
  const [approved, setApproved] = useState(false)

  const byId = useMemo(() => Object.fromEntries(pool.map(q => [q.id, q])), [pool])
  const chosen = sel.map(id => byId[id]).filter(Boolean)
  const secs = chosen.reduce((a, q) => a + q.secs, 0)
  const valid = chosen.length >= 3 && chosen.length <= 6
  const people = SURVEY_ZONES.filter(z => zones.includes(z.key)).reduce((a, z) => a + z.headcount, 0)

  const runAI = () => {
    setLoading(true)
    setTimeout(() => {
      const qs = generate(goal)
      setPool(qs); setSel(qs.slice(0, 4).map(q => q.id)); setLoading(false); setStep(1)
    }, 1200)
  }
  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) => set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])
  const move = (id: string, d: number) => { const i = sel.indexOf(id), j = i + d; if (j < 0 || j >= sel.length) return; const s = [...sel]; [s[i], s[j]] = [s[j], s[i]]; setSel(s) }
  const regen = (q: Question) => setPool(p => p.map(x => x.id === q.id && x.alts?.length ? { ...x, text: x.alts[0], alts: [...x.alts.slice(1), x.text] } : x))
  const remove = (id: string) => { setPool(p => p.filter(x => x.id !== id)); setSel(s => s.filter(x => x !== id)) }
  const more = () => {
    const used = new Set(pool.map(q => q.text))
    const extra = Object.values(QUESTION_BANK).flat().filter(q => !used.has(q.text)).slice(0, 2)
    if (!extra.length) { toast('La IA ja no té més propostes per a aquest objectiu'); return }
    setPool(p => [...p, ...extra.map((q, i) => ({ ...q, id: `qx${i}-${Date.now().toString(36)}` }))])
  }
  const canNext = step === 0 ? pool.length > 0 : step === 1 ? valid : step === 2 ? zones.length > 0 && channels.length > 0 : false

  const publish = () => {
    if (!approved || !valid) return
    const id = (title || 'enquesta').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 32) + '-' + Date.now().toString(36).slice(-4)
    const s: Survey = {
      id, title: title || 'Nova enquesta', goal, status: opens <= today() ? 'open' : 'scheduled', zones, questions: chosen, channels,
      opensAt: opens, closesAt: closes, responses: 0, target: people, createdAt: today(), fromAction: params.get('accio') ?? undefined,
    }
    addSurvey(s)
    toast(s.status === 'open' ? 'Enquesta publicada i oberta' : 'Enquesta programada')
    nav(`/rrhh/enquestes/${id}?nova=1`)
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3.5">
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <Link to="/rrhh/enquestes" className="text-[13px] font-bold text-red-dk">← Enquestes</Link>
            <h1 className="serif text-[34px] sm:text-[36px] leading-[1.05] mt-1.5">Nova enquesta</h1>
          </div>
          <span className="text-[13px] text-ink-muted">Esborrany local · no s’envia res fins que la publiquis</span>
        </div>
        <ol className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {STEPS.map((l, i) => {
            const cur = i === step, done = i < step, reachable = i <= step || (i === 1 && pool.length > 0) || (i > 1 && valid)
            return (
              <li key={l}>
                <button disabled={!reachable} onClick={() => setStep(i)} aria-current={cur ? 'step' : undefined}
                  className={cn('w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] border-[1.5px] text-left text-sm font-bold disabled:opacity-60', cur ? 'border-red bg-paper' : 'border-line', done ? 'bg-paper' : !cur && 'bg-cream')}>
                  <span className={cn('w-7 h-7 rounded-full grid place-items-center text-[13px] shrink-0', cur ? 'bg-red text-white' : done ? 'bg-ok text-white' : 'bg-line text-ink-muted')}>{done ? '✓' : i + 1}</span>
                  <span className="min-w-0">{l}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </header>

      <div className="flex flex-wrap gap-5 items-start">
        <section className="card p-5 sm:p-6 flex-[999_1_520px] min-w-0 flex flex-col gap-4">
          {step === 0 && (
            <>
              <h2 className="serif text-2xl">Què vols saber?</h2>
              <div className="flex flex-wrap gap-1.5 items-center">
                <span className="text-[12.5px] font-semibold text-ink-muted">Començar des d’una plantilla:</span>
                {TEMPLATES.map(t => <button key={t.name} onClick={() => { setTitle(t.name); setGoal(t.goal) }} className="h-[34px] px-3 rounded-full border border-line bg-cream text-[13px] font-semibold hover:border-ink-muted">{t.name}</button>)}
              </div>
              <div><label htmlFor="title" className="text-[13px] font-bold">Nom de l’enquesta</label><input id="title" className="input mt-1.5" value={title} onChange={e => setTitle(e.target.value)} /></div>
              <div><label htmlFor="goal" className="text-[13px] font-bold">Explica-ho amb les teves paraules</label><textarea id="goal" rows={4} className="input mt-1.5 !text-base !leading-relaxed !rounded-[16px] resize-y" value={goal} onChange={e => setGoal(e.target.value)} /></div>
              <div className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
                <div><div className="eyebrow mb-2">Durada màxima</div><div className="flex gap-1.5">{['30 s', '1 min', '2 min'].map(d => <button key={d} aria-pressed={dur === d} onClick={() => setDur(d)} className={cn('h-9 px-3.5 rounded-full border-[1.5px] text-[13px] font-bold', dur === d ? 'border-red bg-red-soft text-red-dk' : 'border-line bg-white')}>{d}</button>)}</div></div>
                <div><label htmlFor="lang" className="eyebrow block mb-2">Idioma</label><select id="lang" className="input !h-[38px] !py-0"><option>Català i castellà (automàtic)</option><option>Català</option><option>Castellà</option><option>Anglès</option></select></div>
                <div><label htmlFor="tone" className="eyebrow block mb-2">To</label><select id="tone" className="input !h-[38px] !py-0"><option>Proper, de tu a tu</option><option>Formal</option></select></div>
              </div>
              <div className="flex justify-end">
                <button onClick={runAI} disabled={loading || goal.trim().length < 10} className="btn-red !h-[50px] !px-5 !text-[15px]"><Sparkles size={18} aria-hidden />{loading ? 'La IA està preparant les preguntes…' : pool.length ? 'Tornar a generar' : 'Generar preguntes amb IA'}</button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="flex flex-wrap justify-between items-end gap-2.5">
                <div><h2 className="serif text-2xl">La IA proposa {pool.length} preguntes</h2><p className="text-[13px] text-ink-muted">Tria’n entre 3 i 6. Pots editar-les, regenerar-les o esborrar-les.</p></div>
                <button onClick={more} className="btn-line !h-[38px] !text-[13px]">+ Proposar-ne més</button>
              </div>
              <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                {pool.map(q => {
                  const on = sel.includes(q.id)
                  return (
                    <article key={q.id} className={cn('rounded-[16px] p-3.5 flex flex-col gap-2.5 bg-white border-2', on ? 'border-red' : 'border-cream-dk')}>
                      <div className="flex justify-between gap-2 text-[11.5px] font-bold"><span className="chip bg-red-soft text-red-dk !py-0.5">{q.dim}</span><span className="text-ink-muted">{TYPE_LABEL[q.type]} · {q.secs} s</span></div>
                      {editing === q.id
                        ? <textarea autoFocus className="input !text-[15px] !font-bold" rows={3} value={q.text} onChange={e => setPool(p => p.map(x => x.id === q.id ? { ...x, text: e.target.value } : x))} onBlur={() => setEditing(null)} aria-label="Text de la pregunta" />
                        : <p className="text-[15px] font-bold leading-snug">{q.text}</p>}
                      <div className="flex gap-1 items-center border-t border-[#F1EAE0] pt-2">
                        <button aria-pressed={on} onClick={() => toggle(sel, q.id, setSel)} className={cn('flex-1 h-9 rounded-[10px] text-[13px] font-bold', on ? 'bg-red text-white' : 'bg-cream')}>{on ? '✓ A l’enquesta' : 'Afegir'}</button>
                        <button onClick={() => setEditing(q.id)} aria-label="Editar" className="w-9 h-9 grid place-items-center rounded-[10px] text-ink-muted hover:bg-cream"><Pencil size={16} /></button>
                        <button onClick={() => regen(q)} aria-label="Regenerar" className="w-9 h-9 grid place-items-center rounded-[10px] text-ink-muted hover:bg-cream"><RefreshCw size={16} /></button>
                        <button onClick={() => remove(q.id)} aria-label="Esborrar" className="w-9 h-9 grid place-items-center rounded-[10px] text-ink-muted hover:bg-cream"><Trash2 size={16} /></button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h2 className="serif text-2xl">A qui va dirigida?</h2>
                <p className="text-[13px] text-ink-muted mb-2.5">Zones de Damm World. Els resultats d’una zona només es veuen amb {MIN_SAMPLE} respostes o més.</p>
                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
                  <button aria-pressed={zones.length === SURVEY_ZONES.length} onClick={() => setZones(zones.length === SURVEY_ZONES.length ? [] : SURVEY_ZONES.map(z => z.key))} className="toggle flex items-center gap-2.5 p-3 text-[13.5px] font-bold">Tota la planta<span className="ml-auto text-xs text-ink-muted font-semibold">727</span></button>
                  {SURVEY_ZONES.map(z => {
                    const on = zones.includes(z.key), low = z.headcount < 30
                    return (
                      <button key={z.key} aria-pressed={on} onClick={() => toggle(zones, z.key, setZones)} className="toggle flex items-center gap-2.5 p-3">
                        <span className={cn('w-5 h-5 rounded-md grid place-items-center text-[13px] text-white shrink-0', on ? 'bg-red' : 'bg-line')}>{on ? '✓' : ''}</span>
                        <span className="flex-1 text-[13.5px] font-semibold">{z.name}<br /><span className={cn('text-[11.5px] font-medium', low ? 'text-warn' : 'text-ink-muted')}>{z.headcount} persones{low ? ' · risc de no arribar a 10' : ''}</span></span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div>
                <h2 className="serif text-2xl">Per on arribarà?</h2>
                <p className="text-[13px] text-ink-muted mb-2.5">Tots els canals porten al mateix enllaç, sense iniciar sessió.</p>
                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
                  {CHANNELS.map(c => {
                    const on = channels.includes(c.key)
                    return (
                      <button key={c.key} aria-pressed={on} onClick={() => toggle(channels, c.key, setChannels)} className="toggle flex gap-2.5 items-start p-3">
                        <span className={cn('w-[34px] h-[34px] rounded-[10px] grid place-items-center shrink-0', on ? 'bg-red' : 'bg-cream')}><PathIcon d={c.icon} size={18} color={on ? '#fff' : '#5C534E'} /></span>
                        <span className="text-[13.5px] font-bold">{c.label}<br /><span className="text-xs font-medium text-ink-muted">{c.sub}</span></span>
                      </button>
                    )
                  })}
                </div>
              </div>
              <div className="grid gap-3 grid-cols-[repeat(auto-fit,minmax(180px,1fr))]">
                <div><label htmlFor="d1" className="eyebrow block mb-1.5">Obertura</label><input id="d1" type="date" className="input" value={opens} onChange={e => setOpens(e.target.value)} /></div>
                <div><label htmlFor="d2" className="eyebrow block mb-1.5">Tancament</label><input id="d2" type="date" className="input" value={closes} onChange={e => setCloses(e.target.value)} /></div>
                <div><label htmlFor="d3" className="eyebrow block mb-1.5">Recordatori</label><select id="d3" className="input"><option>Als 3 dies, només a qui no ha obert</option><option>Cada setmana</option><option>Cap</option></select></div>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="flex flex-wrap gap-6 items-start">
              <div className="w-[300px] max-w-full h-[600px] rounded-[42px] bg-ink p-2.5 shrink-0">
                <div className="h-full rounded-[33px] bg-paper overflow-hidden">
                  <SurveyRunner preview questions={chosen} onDone={() => toast('Final de la previsualització')} />
                </div>
              </div>
              <div className="flex-[1_1_280px] min-w-0 flex flex-col gap-3">
                <h2 className="serif text-2xl">Revisió final</h2>
                {['Llenguatge clar i proper', 'Cap pregunta permet identificar ningú', `Mínim de ${MIN_SAMPLE} respostes per zona activat`, 'Text obert amb moderació i anonimització'].map(c => (
                  <div key={c} className="flex gap-2.5 items-center text-sm"><span className="w-[22px] h-[22px] rounded-full bg-ok text-white grid place-items-center text-xs shrink-0">✓</span>{c}</div>
                ))}
                <button aria-pressed={approved} onClick={() => setApproved(a => !a)} className="toggle flex gap-2.5 items-center p-3 text-sm font-semibold">
                  <span className={cn('w-[22px] h-[22px] rounded-md grid place-items-center text-white shrink-0', approved ? 'bg-red' : 'bg-line')}>{approved ? '✓' : ''}</span>He revisat les preguntes i aprovo la publicació
                </button>
                <button onClick={publish} disabled={!approved || !valid} className="btn-red !h-[52px] !text-base">{opens <= today() ? 'Publicar enquesta' : 'Programar enquesta'}</button>
                <p className="text-xs text-ink-muted">La IA no publica res sola: cal la teva aprovació.</p>
              </div>
            </div>
          )}
        </section>

        <aside aria-label="Resum" className="card p-5 flex-[1_1_300px] min-w-0 flex flex-col gap-3.5 lg:sticky lg:top-6">
          <div><div className="eyebrow">Resum</div><div className="serif text-[22px] leading-tight mt-1">{title || 'Sense nom'}</div></div>
          <div className="grid grid-cols-2 gap-2">
            {[['Preguntes', <>{chosen.length}<span className="text-xs font-semibold text-ink-muted"> / 3–6</span></>], ['Temps', `${secs} s`], ['Persones', people || '—'], ['Canals', channels.length]].map(([l, v]) => (
              <div key={String(l)} className="bg-cream rounded-[14px] px-3 py-2.5"><div className="text-xs text-ink-muted">{l}</div><div className="text-[22px] font-extrabold tabular-nums">{v}</div></div>
            ))}
          </div>
          {pool.length > 0 && <div className={cn('text-[12.5px] font-bold rounded-[12px] px-3 py-2', valid ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink')}>{valid ? '✓ Llargada adequada per respondre en menys d’un minut' : 'Tria entre 3 i 6 preguntes'}</div>}
          <ol className="flex flex-col gap-1.5">
            {chosen.map((q, i) => (
              <li key={q.id} className="flex gap-2 items-start text-[13px] leading-snug">
                <span className="w-[22px] h-[22px] rounded-full bg-ink text-white text-[11px] font-extrabold grid place-items-center shrink-0">{i + 1}</span>
                <span className="flex-1">{q.text}</span>
                <button onClick={() => move(q.id, -1)} aria-label="Pujar" className="w-7 h-7 grid place-items-center rounded-lg bg-cream shrink-0"><ArrowUp size={14} /></button>
                <button onClick={() => move(q.id, 1)} aria-label="Baixar" className="w-7 h-7 grid place-items-center rounded-lg bg-cream shrink-0"><ArrowDown size={14} /></button>
              </li>
            ))}
          </ol>
          <PrivacyNote>La IA proposa, RRHH decideix. Res es publica sense la teva aprovació.</PrivacyNote>
          {step < 3 && (
            <div className="flex gap-2">
              {step > 0 && <button className="btn-line" onClick={() => setStep(s => s - 1)}>Enrere</button>}
              <button className="btn-ink flex-1" disabled={!canNext} onClick={() => setStep(s => s + 1)}>{step === 0 && !pool.length ? 'Genera primer les preguntes' : `Continuar · ${STEPS[step + 1]}`}</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowUp, Pencil, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { CHANNELS, MIN_SAMPLE, SURVEY_ZONES } from '../../data/mock'
import type { ChannelKey, Question, Survey, ZoneKey } from '../../data/types'
import { DEPARTAMENTS, generateSurvey, publishSurvey, toN8nQuestion, toQuestion, type N8nSurvey } from '../../api/n8n'
import { useApp } from '../../store/AppContext'
import { cn, PathIcon, PrivacyNote } from '../../components/ui'
import { SurveyRunner } from '../../components/SurveyRunner'

const STEPS = ['Objectiu', 'Preguntes', 'Públic i canals', 'Revisió i publicació']
const TYPE_LABEL: Record<Question['type'], string> = { faces: 'Cares', list: 'Opcions', scale: '0–10', yesno: 'Sí / No', text: 'Text opcional' }
const today = () => new Date().toISOString().slice(0, 10)
const plusDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10)

const LANG_OPTIONS = [
  { key: 'CASTELLANO', label: 'CASTELLANO', apiVal: 'Castellano' },
  { key: 'CATALÀ', label: 'CATALÀ', apiVal: 'Català' },
  { key: 'ENGLISH', label: 'ENGLISH', apiVal: 'English' },
] as const

type LangKey = (typeof LANG_OPTIONS)[number]['key']

const RESTRICTIONS = 'No señalar a personas individuales ni evaluar desempeño personal'
const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Error desconegut')

/** Generador intel·ligent de suport segons l'idioma seleccionat si la IA necessita alternatives extres */
function generateAlternativeQuestion(existingCount: number, lang: LangKey, goal: string): Question {
  const id = `q_extra_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  const goalLower = goal.toLowerCase()
  const isTurn = goalLower.includes('torn') || goalLower.includes('turno') || goalLower.includes('shift')
  const isEquip = goalLower.includes('eina') || goalLower.includes('herramienta') || goalLower.includes('tool') || goalLower.includes('material')

  if (lang === 'CASTELLANO') {
    if (isTurn) {
      const qs: Question[] = [
        { id, dim: 'Descanso', type: 'faces', secs: 10, text: '¿Sientes que el tiempo de descanso entre turnos es suficiente para tu bienestar?' },
        { id, dim: 'Organización', type: 'list', secs: 12, text: '¿Con cuánta antelación conoces habitualmente tus horarios y turnos?', options: ['Con más de 2 semanas', 'Con 1 semana', 'Con pocos días', 'Sin previsión'] },
        { id, dim: 'Conciliación', type: 'scale', secs: 12, text: 'Del 0 al 10, ¿cómo valoras el equilibrio entre tus turnos de trabajo y tu vida personal?' },
        { id, dim: 'Sugerencias', type: 'text', secs: 15, text: '¿Qué ajuste específico en los descansos o turnos mejoraría más tu día a día?' },
      ]
      return qs[existingCount % qs.length]
    }
    if (isEquip) {
      const qs: Question[] = [
        { id, dim: 'Herramientas', type: 'faces', secs: 10, text: '¿Cómo valoras el estado y funcionamiento de los equipos y herramientas de trabajo?' },
        { id, dim: 'Soporte', type: 'scale', secs: 12, text: 'Del 0 al 10, ¿recibes soporte técnico rápido cuando una herramienta falla?' },
        { id, dim: 'Propuestas', type: 'text', secs: 15, text: '¿Qué herramienta o recurso facilitaría más tu actividad habitual?' },
      ]
      return qs[existingCount % qs.length]
    }
    const defaultQs: Question[] = [
      { id, dim: 'Ambiente', type: 'faces', secs: 10, text: '¿Cómo valoras el ambiente de trabajo y el apoyo de tus compañeros de equipo?' },
      { id, dim: 'Comunicación', type: 'scale', secs: 12, text: 'Del 0 al 10, ¿recibes con claridad y a tiempo la información para desempeñar tu labor?' },
      { id, dim: 'Bienestar', type: 'yesno', secs: 8, text: '¿Sientes que tu opinión y propuestas son escuchadas en tu departamento?' },
      { id, dim: 'Mejora', type: 'text', secs: 15, text: '¿Qué propuesta concreta te gustaría compartir para mejorar el clima de trabajo?' },
    ]
    return defaultQs[existingCount % defaultQs.length]
  }

  if (lang === 'ENGLISH') {
    if (isTurn) {
      const qs: Question[] = [
        { id, dim: 'Rest', type: 'faces', secs: 10, text: 'Do you feel the rest intervals between shifts are adequate for your wellbeing?' },
        { id, dim: 'Planning', type: 'list', secs: 12, text: 'How far in advance do you usually receive your work schedule?', options: ['Over 2 weeks', 'About 1 week', 'A few days', 'No advance notice'] },
        { id, dim: 'Work-Life', type: 'scale', secs: 12, text: 'From 0 to 10, how well does your shift schedule balance with your personal life?' },
        { id, dim: 'Suggestions', type: 'text', secs: 15, text: 'What specific improvement would help your schedule and rest the most?' },
      ]
      return qs[existingCount % qs.length]
    }
    const defaultQs: Question[] = [
      { id, dim: 'Environment', type: 'faces', secs: 10, text: 'How would you rate the overall teamwork and collaboration in your department?' },
      { id, dim: 'Communication', type: 'scale', secs: 12, text: 'From 0 to 10, how clearly and promptly is important work information communicated?' },
      { id, dim: 'Listening', type: 'yesno', secs: 8, text: 'Do you feel your ideas and feedback are taken into consideration?' },
      { id, dim: 'Ideas', type: 'text', secs: 15, text: 'What concrete suggestion would you share to improve our everyday work?' },
    ]
    return defaultQs[existingCount % defaultQs.length]
  }

  // Català
  if (isTurn) {
    const qs: Question[] = [
      { id, dim: 'Descans', type: 'faces', secs: 10, text: 'Sents que el temps de descans entre torns és suficient per recuperar-te?' },
      { id, dim: 'Planificació', type: 'list', secs: 12, text: 'Amb quanta antelació coneixes habitualment els teus torns de feina?', options: ['Amb més de 2 setmanes', 'Amb 1 setmana', 'Amb pocs dies', 'Sense previsió'] },
      { id, dim: 'Conciliació', type: 'scale', secs: 12, text: 'Del 0 al 10, com valores l’equilibri entre els torns i la teva vida personal?' },
      { id, dim: 'Propostes', type: 'text', secs: 15, text: 'Quin ajust concret en els descansos o torns ajudaria més al teu dia a dia?' },
    ]
    return qs[existingCount % qs.length]
  }
  const catQs: Question[] = [
    { id, dim: 'Ambient', type: 'faces', secs: 10, text: 'Com valores l’ambient de treball i la companyonia en el teu equip?' },
    { id, dim: 'Comunicació', type: 'scale', secs: 12, text: 'Del 0 al 10, reps amb prou claredat i agilitat la informació que necessites?' },
    { id, dim: 'Escolta', type: 'yesno', secs: 8, text: 'Sents que les teves aportacions i propostes es tenen en compte?' },
    { id, dim: 'Millores', type: 'text', secs: 15, text: 'Quina idea pràctica t’agradaria proposar per fer millor la nostra feina?' },
  ]
  return catQs[existingCount % catQs.length]
}

export default function Crear() {
  const nav = useNavigate()
  const { addSurvey, toast } = useApp()

  const [step, setStep] = useState(0)
  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>('')
  const [lang, setLang] = useState<LangKey>('CASTELLANO')
  const [departments, setDepartments] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [draft, setDraft] = useState<{ id: string; survey: N8nSurvey; warnings: string[] } | null>(null)
  const [pool, setPool] = useState<Question[]>([])
  const [sel, setSel] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [zones, setZones] = useState<ZoneKey[]>(['envasat', 'logistica'])
  const [channels, setChannels] = useState<ChannelKey[]>(['qr', 'app', 'teams', 'placa', 'world'])
  const [opens, setOpens] = useState(today())
  const [closes, setCloses] = useState(plusDays(14))
  const [approved, setApproved] = useState(false)

  const currentLangObj = LANG_OPTIONS.find(l => l.key === lang) ?? LANG_OPTIONS[0]
  const collectiveStr = departments.length > 0 ? departments.join(', ') : 'Planta'
  const durationSecs = (Number(durationMinutes) || 1) * 60

  const byId = useMemo(() => Object.fromEntries(pool.map(q => [q.id, q])), [pool])
  const chosen = sel.map(id => byId[id]).filter(Boolean)
  const secs = chosen.reduce((a, q) => a + q.secs, 0)
  const valid = chosen.length >= 3 && chosen.length <= 6
  const people = SURVEY_ZONES.filter(z => zones.includes(z.key)).reduce((a, z) => a + z.headcount, 0)

  /** WF-01: Crida a la IA d'n8n amb l'idioma seleccionat i el missatge/objectiu */
  const callWF01 = (extraRestrictions = '') =>
    generateSurvey({
      objetivo: goal.trim(),
      colectiu: collectiveStr,
      durada_max: durationSecs,
      idioma: currentLangObj.apiVal,
      restriccions: extraRestrictions
        ? `${RESTRICTIONS}. ${extraRestrictions}`
        : `${RESTRICTIONS}. Generar estrictament en idioma ${currentLangObj.apiVal}.`,
    })

  const runAI = async () => {
    setLoading(true)
    setGenError(null)
    try {
      const r = await callWF01()
      const qs = r.survey.preguntas.map(toQuestion)
      setDraft({ id: r.survey_id, survey: r.survey, warnings: r.control_calidad?.anti_sesgo_warnings ?? [] })
      if (!title.trim() && r.survey.titulo) setTitle(r.survey.titulo)
      setPool(qs)
      setSel(qs.slice(0, 6).map(q => q.id))
      setStep(1)
    } catch (e) {
      setGenError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  const toggle = <T,>(arr: T[], v: T, set: (x: T[]) => void) =>
    set(arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v])

  const move = (id: string, d: number) => {
    const i = sel.indexOf(id),
      j = i + d
    if (j < 0 || j >= sel.length) return
    const s = [...sel]
    ;[s[i], s[j]] = [s[j], s[i]]
    setSel(s)
  }

  const regen = (q: Question) =>
    setPool(p =>
      p.map(x =>
        x.id === q.id && x.alts?.length
          ? { ...x, text: x.alts[0], alts: [...x.alts.slice(1), x.text] }
          : x
      )
    )

  const remove = (id: string) => {
    setPool(p => p.filter(x => x.id !== id))
    setSel(s => s.filter(x => x !== id))
  }

  /** Proposar més preguntes mantenint l'idioma i el missatge */
  const more = async () => {
    setLoadingMore(true)
    try {
      const existingTexts = pool.map(q => q.text.trim())
      const r = await callWF01(
        `Generar noves preguntes complementàries diferents a les existents sobre: "${goal.trim()}". Idioma obligatori: ${currentLangObj.apiVal}. Evitar duplicar: ${existingTexts.slice(0, 5).join(' | ')}`
      )
      const used = new Set(pool.map(q => q.text.trim().toLowerCase()))
      const extra = r.survey.preguntas
        .map(toQuestion)
        .filter(q => !used.has(q.text.trim().toLowerCase()))

      if (extra.length > 0) {
        setPool(p => [...p, ...extra])
        toast(`La IA ha proposat ${extra.length} noves preguntes en ${currentLangObj.label}`)
      } else {
        // Generador alternatiu en el mateix idioma per no deixar mai bloquejat l'usuari
        const fallbackQ = generateAlternativeQuestion(pool.length, lang, goal)
        setPool(p => [...p, fallbackQ])
        toast(`Afegida nova proposta adaptada en ${currentLangObj.label}`)
      }
    } catch {
      const fallbackQ = generateAlternativeQuestion(pool.length, lang, goal)
      setPool(p => [...p, fallbackQ])
      toast(`Generada nova pregunta en ${currentLangObj.label} basada en l'objectiu`)
    } finally {
      setLoadingMore(false)
    }
  }

  /** WF-02: Publicació amb signatura humana de RRHH */
  const publish = async () => {
    if (!approved || !valid || !draft || publishing) return
    setPublishing(true)
    try {
      const r = await publishSurvey({
        approved_by_human: approved,
        approved_by: 'RRHH',
        survey_id: draft.id,
        survey: {
          ...draft.survey,
          titulo: title || draft.survey.titulo,
          colectivo: collectiveStr,
          idioma: currentLangObj.apiVal,
          preguntas: chosen.map(toN8nQuestion),
        },
      })
      const id =
        (title || 'enquesta')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')
          .slice(0, 32) +
        '-' +
        Date.now().toString(36).slice(-4)

      const s: Survey = {
        id,
        title: title || draft.survey.titulo || 'Nova enquesta',
        goal,
        status: opens <= today() ? 'open' : 'scheduled',
        zones,
        questions: chosen,
        channels,
        opensAt: opens,
        closesAt: closes,
        responses: 0,
        target: people,
        createdAt: today(),
        n8nId: r.survey_id ?? draft.id,
        intro: draft.survey.introduccion_transparencia,
        formUrl: r.publicacion?.form_url,
        qrUrl: r.publicacion?.qr_code_url,
      }
      addSurvey(s)
      toast(s.status === 'open' ? 'Enquesta publicada i oberta' : 'Enquesta programada')
      nav(`/rrhh/enquestes/${id}?nova=1`)
    } catch (e) {
      toast(`No s’ha pogut publicar: ${errMsg(e)}`)
    } finally {
      setPublishing(false)
    }
  }

  // La barra lateral de resum només es mostra a la Fase 2 (Preguntes) i a la Fase 3 (Públic i canals)
  const showSummarySidebar = step === 1 || step === 2

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-3.5">
        <div className="flex flex-wrap justify-between items-end gap-3">
          <div>
            <Link to="/rrhh/enquestes" className="text-[13px] font-bold text-red-dk">
              ← Enquestes
            </Link>
            <h1 className="serif text-[34px] sm:text-[36px] leading-[1.05] mt-1.5">Nova enquesta</h1>
          </div>
          <span className="text-[13px] text-ink-muted">La IA d’n8n proposa · no es publica res fins que l’aprovis</span>
        </div>
        <ol className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {STEPS.map((l, i) => {
            const cur = i === step
            const done = i < step
            const reachable = i <= step || (i === 1 && pool.length > 0) || (i > 1 && valid)
            return (
              <li key={l}>
                <button
                  disabled={!reachable}
                  onClick={() => setStep(i)}
                  aria-current={cur ? 'step' : undefined}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] border-[1.5px] text-left text-sm font-bold disabled:opacity-60 transition-colors',
                    cur ? 'border-red bg-paper' : 'border-line',
                    done ? 'bg-paper' : !cur && 'bg-cream'
                  )}
                >
                  <span
                    className={cn(
                      'w-7 h-7 rounded-full grid place-items-center text-[13px] shrink-0 font-bold',
                      cur ? 'bg-red text-white' : done ? 'bg-ok text-white' : 'bg-line text-ink-muted'
                    )}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  <span className="min-w-0">{l}</span>
                </button>
              </li>
            )
          })}
        </ol>
      </header>

      <div className="flex flex-wrap gap-5 items-start">
        {/* Contingut principal del formulari */}
        <section
          className={cn(
            'card p-5 sm:p-6 min-w-0 flex flex-col gap-5',
            showSummarySidebar ? 'flex-[999_1_520px]' : 'w-full'
          )}
        >
          {/* ========================================================
              FASE 1: OBJECTIUS
              ======================================================== */}
          {step === 0 && (
            <>
              <div>
                <h2 className="serif text-2xl sm:text-3xl">Què vols saber?</h2>
                <p className="text-sm text-ink-muted mt-1">
                  Defineix l'objectiu de la microconsulta perquè la IA prepari preguntes curtes, neutres i adaptades als teus equips.
                </p>
              </div>

              <div>
                <label htmlFor="title" className="text-[13.5px] font-bold block mb-1">
                  Nom de l’enquesta
                </label>
                <input
                  id="title"
                  className="input"
                  placeholder="Ex: Torns, descans i conciliació a planta"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="goal" className="text-[13.5px] font-bold block mb-1">
                  Explica-ho amb les teves paraules
                </label>
                <textarea
                  id="goal"
                  rows={4}
                  className="input !text-base !leading-relaxed !rounded-[16px] resize-y"
                  placeholder="Ex: Volem conèixer com afecta el nou sistema de torns a Envasat i Logística, sobretot pel que fa al descans, l’estrès i la conciliació."
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                />
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Durada màxima: camp numèric en minuts */}
                <div>
                  <label htmlFor="durMin" className="eyebrow block mb-2 font-bold">
                    Durada màxima (minuts)
                  </label>
                  <input
                    id="durMin"
                    type="number"
                    min={1}
                    max={60}
                    placeholder="Ex: 2"
                    className="input !h-[42px]"
                    value={durationMinutes}
                    onChange={e => {
                      const v = e.target.value
                      setDurationMinutes(v === '' ? '' : Math.max(1, parseInt(v, 10) || 1))
                    }}
                  />
                  <span className="text-[11.5px] text-ink-muted mt-1 block">Temps màxim estimat de resposta</span>
                </div>

                {/* Idioma: CATALÀ, CASTELLANO, ENGLISH (per defecte CASTELLANO) */}
                <div>
                  <label htmlFor="lang" className="eyebrow block mb-2 font-bold">
                    Idioma
                  </label>
                  <select
                    id="lang"
                    className="input !h-[42px] !py-0 font-semibold"
                    value={lang}
                    onChange={e => setLang(e.target.value as LangKey)}
                  >
                    {LANG_OPTIONS.map(l => (
                      <option key={l.key} value={l.key}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-[11.5px] text-ink-muted mt-1 block">Llengua per a l'enunciat de les preguntes</span>
                </div>
              </div>

              {/* Departaments (abans col·lectius): Selector múltiple */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#F1EAE0]">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="eyebrow block font-bold">Departaments (Selector múltiple)</label>
                  <button
                    type="button"
                    onClick={() =>
                      setDepartments(departments.length === DEPARTAMENTS.length ? [] : [...DEPARTAMENTS])
                    }
                    className="text-xs font-bold text-red-dk hover:underline"
                  >
                    {departments.length === DEPARTAMENTS.length ? 'Deseleccionar tots' : 'Seleccionar tots els departaments'}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {DEPARTAMENTS.map(d => {
                    const on = departments.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        aria-pressed={on}
                        onClick={() => toggle(departments, d, setDepartments)}
                        className={cn(
                          'h-10 px-4 rounded-full border-[1.5px] text-[13.5px] font-bold transition-all flex items-center gap-1.5',
                          on ? 'border-red bg-red-soft text-red-dk shadow-sm' : 'border-line bg-white text-ink hover:border-ink-muted'
                        )}
                      >
                        {on && <span className="font-extrabold">✓</span>}
                        <span>{d}</span>
                      </button>
                    )
                  })}
                </div>
                <p className="text-xs text-ink-muted">
                  {departments.length === 0
                    ? 'Selecciona un o diversos departaments als quals anirà adreçada la consulta.'
                    : `Departaments seleccionats: ${departments.join(', ')}`}
                </p>
              </div>

              {genError && (
                <div role="alert" className="text-[13px] font-semibold rounded-[12px] px-3.5 py-2.5 bg-warn-bg text-warn-ink">
                  No s’han pogut generar les preguntes: {genError}. Comprova que el workflow WF-01 estigui actiu i torna-ho a provar.
                </div>
              )}

              <div className="flex justify-end pt-3 border-t border-[#F1EAE0]">
                <button
                  onClick={runAI}
                  disabled={loading || goal.trim().length < 5 || departments.length === 0}
                  className="btn-red !h-[50px] !px-6 !text-[15px] font-bold shadow-sm"
                >
                  <Sparkles size={18} aria-hidden />
                  {loading
                    ? 'La IA està preparant les preguntes…'
                    : pool.length
                    ? 'Tornar a generar preguntes'
                    : 'Generar preguntes amb IA'}
                </button>
              </div>
            </>
          )}

          {/* ========================================================
              FASE 2: PREGUNTES
              ======================================================== */}
          {step === 1 && (
            <>
              <div className="flex flex-wrap justify-between items-end gap-2.5">
                <div>
                  <h2 className="serif text-2xl sm:text-3xl">La IA proposa {pool.length} preguntes</h2>
                  <p className="text-[13.5px] text-ink-muted">
                    Idioma: <strong className="text-ink">{currentLangObj.label}</strong> · Tria’n entre 3 i 6. Pots editar-les, regenerar-les o esborrar-les.
                  </p>
                </div>
                <button onClick={more} disabled={loadingMore} className="btn-line !h-[40px] !text-[13px] font-bold">
                  {loadingMore ? 'La IA està pensant noves preguntes…' : '+ Proposar-ne més'}
                </button>
              </div>

              <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
                {pool.map(q => {
                  const on = sel.includes(q.id)
                  return (
                    <article
                      key={q.id}
                      className={cn(
                        'rounded-[16px] p-4 flex flex-col gap-2.5 bg-white border-2 transition-all',
                        on ? 'border-red shadow-sm' : 'border-cream-dk'
                      )}
                    >
                      <div className="flex justify-between gap-2 text-[11.5px] font-bold">
                        <span className="chip bg-red-soft text-red-dk !py-0.5">{q.dim}</span>
                        <span className="text-ink-muted">
                          {TYPE_LABEL[q.type]} · {q.secs} s
                        </span>
                      </div>
                      {editing === q.id ? (
                        <textarea
                          autoFocus
                          className="input !text-[15px] !font-bold"
                          rows={3}
                          value={q.text}
                          onChange={e =>
                            setPool(p => p.map(x => (x.id === q.id ? { ...x, text: e.target.value } : x)))
                          }
                          onBlur={() => setEditing(null)}
                          aria-label="Text de la pregunta"
                        />
                      ) : (
                        <p className="text-[15px] font-bold leading-snug text-ink">{q.text}</p>
                      )}
                      <div className="flex gap-1.5 items-center border-t border-[#F1EAE0] pt-2 mt-auto">
                        <button
                          aria-pressed={on}
                          onClick={() => toggle(sel, q.id, setSel)}
                          className={cn(
                            'flex-1 h-9 rounded-[10px] text-[13px] font-bold transition-colors',
                            on ? 'bg-red text-white' : 'bg-cream hover:bg-cream-dk text-ink'
                          )}
                        >
                          {on ? '✓ A l’enquesta' : 'Afegir'}
                        </button>
                        <button
                          onClick={() => setEditing(q.id)}
                          aria-label="Editar"
                          title="Editar enunciat"
                          className="w-9 h-9 grid place-items-center rounded-[10px] text-ink-muted hover:bg-cream transition-colors"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => regen(q)}
                          disabled={!q.alts?.length}
                          aria-label="Regenerar"
                          title="Regenerar amb alternativa"
                          className="disabled:opacity-40 w-9 h-9 grid place-items-center rounded-[10px] text-ink-muted hover:bg-cream transition-colors"
                        >
                          <RefreshCw size={16} />
                        </button>
                        <button
                          onClick={() => remove(q.id)}
                          aria-label="Esborrar"
                          title="Eliminar de la proposta"
                          className="w-9 h-9 grid place-items-center rounded-[10px] text-ink-muted hover:bg-cream transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}

          {/* ========================================================
              FASE 3: PÚBLIC I CANALS
              ======================================================== */}
          {step === 2 && (
            <>
              <div>
                <h2 className="serif text-2xl">A qui va dirigida?</h2>
                <p className="text-[13px] text-ink-muted mb-2.5">
                  Zones de Damm World. Els resultats d’una zona només es veuen amb {MIN_SAMPLE} respostes o més per garantir l'anonimat (k≥5).
                </p>
                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
                  <button
                    aria-pressed={zones.length === SURVEY_ZONES.length}
                    onClick={() =>
                      setZones(zones.length === SURVEY_ZONES.length ? [] : SURVEY_ZONES.map(z => z.key))
                    }
                    className="toggle flex items-center gap-2.5 p-3 text-[13.5px] font-bold"
                  >
                    Tota la planta
                    <span className="ml-auto text-xs text-ink-muted font-semibold">727</span>
                  </button>
                  {SURVEY_ZONES.map(z => {
                    const on = zones.includes(z.key)
                    const low = z.headcount < 30
                    return (
                      <button
                        key={z.key}
                        aria-pressed={on}
                        onClick={() => toggle(zones, z.key, setZones)}
                        className="toggle flex items-center gap-2.5 p-3"
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-md grid place-items-center text-[13px] text-white shrink-0 font-bold',
                            on ? 'bg-red' : 'bg-line'
                          )}
                        >
                          {on ? '✓' : ''}
                        </span>
                        <span className="flex-1 text-[13.5px] font-semibold text-left">
                          {z.name}
                          <br />
                          <span className={cn('text-[11.5px] font-medium', low ? 'text-warn' : 'text-ink-muted')}>
                            {z.headcount} persones{low ? ' · risc de no arribar a 10' : ''}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h2 className="serif text-2xl">Per on arribarà?</h2>
                <p className="text-[13px] text-ink-muted mb-2.5">
                  Canals de distribució de la microconsulta. Tots porten al mateix enllaç anònim, sense iniciar sessió.
                </p>
                <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(230px,1fr))]">
                  {CHANNELS.map(c => {
                    const on = channels.includes(c.key)
                    return (
                      <button
                        key={c.key}
                        aria-pressed={on}
                        onClick={() => toggle(channels, c.key, setChannels)}
                        className="toggle flex gap-2.5 items-start p-3 text-left"
                      >
                        <span
                          className={cn(
                            'w-[34px] h-[34px] rounded-[10px] grid place-items-center shrink-0',
                            on ? 'bg-red' : 'bg-cream'
                          )}
                        >
                          <PathIcon d={c.icon} size={18} color={on ? '#fff' : '#5C534E'} />
                        </span>
                        <span className="text-[13.5px] font-bold">
                          {c.label}
                          <br />
                          <span className="text-xs font-medium text-ink-muted">{c.sub}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Nova secció: Obertura i tancament d'enquesta */}
              <div className="pt-4 border-t border-[#F1EAE0] flex flex-col gap-3">
                <h2 className="serif text-2xl">Obertura i tancament de l’enquesta</h2>
                <p className="text-[13px] text-ink-muted">
                  Defineix el període de vigència durant el qual l’enquesta estarà activa i disponible per rebre respostes.
                </p>
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                  <div className="bg-cream/60 rounded-[14px] p-3.5 border border-line">
                    <label htmlFor="d1" className="eyebrow block mb-1.5 font-bold">
                      Data d’obertura
                    </label>
                    <input
                      id="d1"
                      type="date"
                      className="input bg-white"
                      value={opens}
                      onChange={e => setOpens(e.target.value)}
                    />
                    <p className="text-xs text-ink-muted mt-1.5">A partir d’aquest dia estarà disponible per als treballadors.</p>
                  </div>
                  <div className="bg-cream/60 rounded-[14px] p-3.5 border border-line">
                    <label htmlFor="d2" className="eyebrow block mb-1.5 font-bold">
                      Data de tancament
                    </label>
                    <input
                      id="d2"
                      type="date"
                      className="input bg-white"
                      value={closes}
                      onChange={e => setCloses(e.target.value)}
                    />
                    <p className="text-xs text-ink-muted mt-1.5">Últim dia per respondre abans de consolidar els resultats.</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-[#F1EAE0]">
                <button className="btn-line !h-11 px-5" onClick={() => setStep(1)}>
                  Enrere
                </button>
                <button
                  className="btn-ink !h-11 px-6 font-bold"
                  disabled={zones.length === 0 || channels.length === 0}
                  onClick={() => setStep(3)}
                >
                  Continuar · Revisió i publicació →
                </button>
              </div>
            </>
          )}

          {/* ========================================================
              FASE 4: REVISIÓ I PUBLICACIÓ (Sense barra de resum externa)
              ======================================================== */}
          {step === 3 && (
            <div className="flex flex-wrap gap-6 items-start">
              {/* Previsualització mòbil */}
              <div className="w-[300px] max-w-full h-[600px] rounded-[42px] bg-ink p-2.5 shrink-0 mx-auto lg:mx-0 shadow-lg">
                <div className="h-full rounded-[33px] bg-paper overflow-hidden">
                  <SurveyRunner preview questions={chosen} onDone={() => toast('Final de la previsualització')} />
                </div>
              </div>

              {/* Contingut integrat de Revisió Final */}
              <div className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
                <div>
                  <h2 className="serif text-3xl">Revisió final</h2>
                  <p className="text-sm text-ink-muted mt-1">
                    Comprova les dades clau de la consulta abans de publicar-la de forma definitiva.
                  </p>
                </div>

                {/* Bloc de resum integrat: Nom, Núm Preguntes, Temps i Persones */}
                <div className="card p-4 bg-cream/70 border border-line flex flex-col gap-3">
                  <div className="border-b border-[#E8DEC8] pb-2.5">
                    <span className="eyebrow block">Nom de l'enquesta</span>
                    <h3 className="serif text-xl font-bold text-ink mt-0.5">
                      {title || draft?.survey.titulo || 'Nova enquesta'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-[12px] p-2.5 border border-[#E8DEC8]">
                      <span className="text-xs text-ink-muted block font-semibold">Preguntes</span>
                      <strong className="text-xl font-extrabold text-ink tabular-nums">{chosen.length}</strong>
                      <span className="text-[11px] text-ink-muted block">/ 3–6</span>
                    </div>
                    <div className="bg-white rounded-[12px] p-2.5 border border-[#E8DEC8]">
                      <span className="text-xs text-ink-muted block font-semibold">Temps</span>
                      <strong className="text-xl font-extrabold text-ink tabular-nums">{secs} s</strong>
                      <span className="text-[11px] text-ink-muted block">estimat</span>
                    </div>
                    <div className="bg-white rounded-[12px] p-2.5 border border-[#E8DEC8]">
                      <span className="text-xs text-ink-muted block font-semibold">Persones</span>
                      <strong className="text-xl font-extrabold text-ink tabular-nums">{people || '—'}</strong>
                      <span className="text-[11px] text-ink-muted block">plantilla</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink-muted pt-1">
                    <span>
                      Idioma: <strong>{currentLangObj.label}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Canals: <strong>{channels.length} seleccionats</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Departaments: <strong>{departments.length > 0 ? departments.join(', ') : 'Tots'}</strong>
                    </span>
                  </div>
                </div>

                {draft?.survey.introduccion_transparencia && (
                  <div className="bg-white rounded-[14px] p-3 border border-line text-sm text-ink-muted leading-relaxed">
                    <span className="font-bold text-ink block text-xs uppercase tracking-wider mb-1">
                      Introducció transparent
                    </span>
                    {draft.survey.introduccion_transparencia}
                  </div>
                )}

                {draft?.warnings.map(w => (
                  <div key={w} className="text-[12.5px] font-semibold rounded-[12px] px-3.5 py-2.5 bg-warn-bg text-warn-ink">
                    Control anti-biaix: {w}
                  </div>
                ))}

                <div className="flex flex-col gap-2">
                  {[
                    'Llenguatge clar i proper',
                    'Cap pregunta permet identificar ningú',
                    `Mínim de ${MIN_SAMPLE} respostes per zona activat (k-anonimat)`,
                    'Text obert amb moderació i anonimització automàtica',
                  ].map(c => (
                    <div key={c} className="flex gap-2.5 items-center text-sm">
                      <span className="w-[22px] h-[22px] rounded-full bg-ok text-white grid place-items-center text-xs shrink-0 font-bold">
                        ✓
                      </span>
                      <span>{c}</span>
                    </div>
                  ))}
                </div>

                <button
                  aria-pressed={approved}
                  onClick={() => setApproved(a => !a)}
                  className={cn(
                    'toggle flex gap-2.5 items-center p-3 text-sm font-semibold rounded-[12px] transition-colors',
                    approved && 'border-red bg-red-soft/40'
                  )}
                >
                  <span
                    className={cn(
                      'w-[22px] h-[22px] rounded-md grid place-items-center text-white shrink-0 font-bold text-xs',
                      approved ? 'bg-red' : 'bg-line'
                    )}
                  >
                    {approved ? '✓' : ''}
                  </span>
                  He revisat les preguntes i aprovo la publicació
                </button>

                <div className="flex gap-2">
                  <button className="btn-line !h-[52px] px-5" onClick={() => setStep(2)}>
                    Enrere
                  </button>
                  <button
                    onClick={publish}
                    disabled={!approved || !valid || !draft || publishing}
                    className="btn-red flex-1 !h-[52px] !text-base font-bold shadow-md"
                  >
                    {publishing
                      ? 'Publicant a n8n…'
                      : opens <= today()
                      ? 'Publicar enquesta'
                      : 'Programar enquesta'}
                  </button>
                </div>
                <p className="text-xs text-ink-muted text-center">
                  La IA no publica res sola: cal la teva aprovació humana de RRHH.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            BARRA LATERAL DE RESUM
            (Exclusiva per a les Fases 2 i 3, segons especificació)
            ======================================================== */}
        {showSummarySidebar && (
          <aside
            aria-label="Resum"
            className="card p-5 flex-[1_1_300px] min-w-0 flex flex-col gap-3.5 lg:sticky lg:top-6"
          >
            <div>
              <div className="eyebrow">Resum</div>
              <div className="serif text-[22px] leading-tight mt-1">{title || 'Sense nom'}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                [
                  'Preguntes',
                  <>
                    {chosen.length}
                    <span className="text-xs font-semibold text-ink-muted"> / 3–6</span>
                  </>,
                ],
                ['Temps', `${secs} s`],
                ['Persones', people || '—'],
                ['Canals', channels.length],
              ].map(([l, v]) => (
                <div key={String(l)} className="bg-cream rounded-[14px] px-3 py-2.5">
                  <div className="text-xs text-ink-muted">{l}</div>
                  <div className="text-[22px] font-extrabold tabular-nums">{v}</div>
                </div>
              ))}
            </div>

            {pool.length > 0 && (
              <div
                className={cn(
                  'text-[12.5px] font-bold rounded-[12px] px-3 py-2',
                  valid ? 'bg-ok-bg text-ok-ink' : 'bg-warn-bg text-warn-ink'
                )}
              >
                {valid ? '✓ Llargada adequada per respondre en pocs segons' : 'Tria entre 3 i 6 preguntes'}
              </div>
            )}

            <ol className="flex flex-col gap-1.5">
              {chosen.map((q, i) => (
                <li key={q.id} className="flex gap-2 items-start text-[13px] leading-snug">
                  <span className="w-[22px] h-[22px] rounded-full bg-ink text-white text-[11px] font-extrabold grid place-items-center shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-1">{q.text}</span>
                  <button
                    onClick={() => move(q.id, -1)}
                    aria-label="Pujar"
                    className="w-7 h-7 grid place-items-center rounded-lg bg-cream shrink-0 hover:bg-cream-dk"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    onClick={() => move(q.id, 1)}
                    aria-label="Baixar"
                    className="w-7 h-7 grid place-items-center rounded-lg bg-cream shrink-0 hover:bg-cream-dk"
                  >
                    <ArrowDown size={14} />
                  </button>
                </li>
              ))}
            </ol>

            <PrivacyNote>La IA proposa, RRHH decideix. Res es publica sense la teva aprovació.</PrivacyNote>

            {/* Fase 2: El pas a la següent fase ha de ser "Acceptar i continuar" de la part de resum */}
            {step === 1 && (
              <div className="flex gap-2">
                <button className="btn-line" onClick={() => setStep(0)}>
                  Enrere
                </button>
                <button
                  className="btn-ink flex-1 !font-bold"
                  disabled={!valid}
                  onClick={() => setStep(2)}
                >
                  Acceptar i continuar →
                </button>
              </div>
            )}

            {/* Fase 3: Botons de navegació a la part de resum */}
            {step === 2 && (
              <div className="flex gap-2">
                <button className="btn-line" onClick={() => setStep(1)}>
                  Enrere
                </button>
                <button
                  className="btn-ink flex-1 !font-bold"
                  disabled={zones.length === 0 || channels.length === 0}
                  onClick={() => setStep(3)}
                >
                  Continuar · Revisió →
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowDown, ArrowUp, Clock, Info, Pencil, RefreshCw, Sparkles, Trash2 } from 'lucide-react'
import { CHANNELS, MIN_SAMPLE, SURVEY_ZONES } from '../../data/mock'
import type { ChannelKey, Question, Survey, ZoneKey } from '../../data/types'
import { DEPARTAMENTS, generateSurvey, toQuestion, type N8nSurvey } from '../../api/n8n'
import { useApp } from '../../store/AppContext'
import { cn, PathIcon, PrivacyNote } from '../../components/ui'
import TeamsDeliveryPreview from '../../components/TeamsDeliveryPreview'
import { SurveyRunner } from '../../components/SurveyRunner'

const STEPS = ['Objectiu', 'Preguntes', 'Públic i canals', 'Revisió i publicació']
const TYPE_LABEL: Record<Question['type'], string> = { faces: 'Cares', list: 'Opcions', scale: '0-10', yesno: 'Sí / No', text: 'Text opcional' }
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

/** Obté les zones corresponents als departaments triats a la Fase 1 */
export function getZonesForDepartments(deps: string[]): ZoneKey[] {
  if (deps.length === 0 || (deps.includes('Planta') && deps.length === DEPARTAMENTS.length)) {
    return SURVEY_ZONES.map(z => z.key)
  }
  const set = new Set<ZoneKey>()
  deps.forEach(d => {
    switch (d) {
      case 'Planta':
        ;(['envasat', 'coccio', 'malta', 'fermentacio', 'manteniment'] as ZoneKey[]).forEach(k => set.add(k))
        break
      case 'Logística':
        set.add('logistica')
        break
      case 'Comercial':
        set.add('comercial')
        break
      case 'Oficina':
      case 'Manager':
        set.add('oficines')
        break
    }
  })
  return Array.from(set)
}

/** Obté els canals recomanats segons els departaments triats a la Fase 1 */
export function getChannelsForDepartments(deps: string[]): ChannelKey[] {
  const set = new Set<ChannelKey>()
  const hasPlantaOrLogistica = deps.includes('Planta') || deps.includes('Logística')
  const hasOficinaOrManager = deps.includes('Oficina') || deps.includes('Manager')
  const hasComercial = deps.includes('Comercial')

  if (hasPlantaOrLogistica) {
    set.add('qr')
    set.add('app')
    set.add('placa')
    set.add('world')
  }
  if (hasOficinaOrManager) {
    set.add('teams')
    set.add('email')
    set.add('app')
    set.add('placa')
  }
  if (hasComercial) {
    set.add('app')
    set.add('email')
    set.add('teams')
  }
  if (set.size === 0) {
    return ['qr', 'app', 'teams', 'placa', 'world']
  }
  return Array.from(set)
}

/** Generador intel·ligent de suport segons departaments, durada i idioma seleccionats */
function generateAlternativeQuestion(existingCount: number, lang: LangKey, goal: string, deps: string[]): Question {
  const id = `q_extra_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`
  const goalLower = goal.toLowerCase()
  const isTurn = goalLower.includes('torn') || goalLower.includes('turno') || goalLower.includes('shift')
  const isLog = deps.includes('Logística') || goalLower.includes('logíst') || goalLower.includes('logistic')
  const isCom = deps.includes('Comercial') || goalLower.includes('comercial') || goalLower.includes('vent')
  const isOfi = deps.includes('Oficina') || deps.includes('Manager') || goalLower.includes('oficin')

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
    if (isLog) {
      const qs: Question[] = [
        { id, dim: 'Logística', type: 'faces', secs: 10, text: '¿Cómo valoras la coordinación operativa entre las plataformas de logística y planta?' },
        { id, dim: 'Cargas de trabajo', type: 'scale', secs: 12, text: 'Del 0 al 10, ¿cómo gestionamos los picos de volumen y entregas?' },
        { id, dim: 'Recursos', type: 'text', secs: 15, text: '¿Qué mejora en muelles o sistemas de transporte optimizaría tu labor?' },
      ]
      return qs[existingCount % qs.length]
    }
    if (isCom) {
      const qs: Question[] = [
        { id, dim: 'Comercial', type: 'faces', secs: 10, text: '¿Dispones de las herramientas móviles y soporte de marketing necesarios en tu ruta?' },
        { id, dim: 'Objetivos', type: 'scale', secs: 12, text: 'Del 0 al 10, ¿sientes que los objetivos comerciales son claros y alcanzables?' },
        { id, dim: 'Propuestas', type: 'text', secs: 15, text: '¿Qué propuesta comercial ayudaría a reforzar la relación con nuestros clientes?' },
      ]
      return qs[existingCount % qs.length]
    }
    if (isOfi) {
      const qs: Question[] = [
        { id, dim: 'Colaboración', type: 'faces', secs: 10, text: '¿Cómo valoras la flexibilidad y el entorno de trabajo digital en las oficinas?' },
        { id, dim: 'Eficiencia', type: 'scale', secs: 12, text: 'Del 0 al 10, ¿el volumen de reuniones te permite avanzar en tus prioridades?' },
        { id, dim: 'Iniciativas', type: 'text', secs: 15, text: '¿Qué iniciativa simplificaría procesos en tu área o departamento?' },
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
  if (isLog) {
    const qs: Question[] = [
      { id, dim: 'Logística', type: 'faces', secs: 10, text: 'Com valores la coordinació i el ritme de treball a les plataformes logístiques?' },
      { id, dim: 'Recursos', type: 'scale', secs: 12, text: 'Del 0 al 10, comptes amb els mitjans adequats per gestionar els pics de càrrega?' },
      { id, dim: 'Millores', type: 'text', secs: 15, text: 'Quina adaptació en rutes o molls facilitaria més la feina diària?' },
    ]
    return qs[existingCount % qs.length]
  }
  if (isCom) {
    const qs: Question[] = [
      { id, dim: 'Comercial', type: 'faces', secs: 10, text: 'Com valores les eines mòbils i el suport en ruta per atendre els clients?' },
      { id, dim: 'Agilitat', type: 'scale', secs: 12, text: 'Del 0 al 10, reps respostes ràpides davant d’incidències comercials?' },
      { id, dim: 'Propostes', type: 'text', secs: 15, text: 'Quina proposta t’agradaria impulsar per millorar la relació amb els establiments?' },
    ]
    return qs[existingCount % qs.length]
  }
  if (isOfi) {
    const qs: Question[] = [
      { id, dim: 'Oficines', type: 'faces', secs: 10, text: 'Com valores la flexibilitat horària i la coordinació amb els altres departaments?' },
      { id, dim: 'Eficiència', type: 'scale', secs: 12, text: 'Del 0 al 10, la gestió de reunions et deixa espai per a la feina de fons?' },
      { id, dim: 'Projectes', type: 'text', secs: 15, text: 'Quina millora de processos o digitalització proposaries per al teu equip?' },
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
  const { addSurvey, hrSurveys, hrLoading, hrError, toast } = useApp()
  const [params] = useSearchParams()
  const editId = params.get('editar') || undefined
  const [loadedId, setLoadedId] = useState<string>()

  const [step, setStep] = useState(0)
  // Control de fases acceptades per impedir avançar sense acceptar la fase prèvia
  const [acceptedSteps, setAcceptedSteps] = useState<number[]>([])
  const [maxAcceptedStep, setMaxAcceptedStep] = useState(0)

  const [title, setTitle] = useState('')
  const [goal, setGoal] = useState('')
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(2)
  const [lang, setLang] = useState<LangKey>('CASTELLANO')
  const [departments, setDepartments] = useState<string[]>(['Planta', 'Logística'])

  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [draft, setDraft] = useState<{ id: string; survey: N8nSurvey; warnings: string[] } | null>(null)
  const [pool, setPool] = useState<Question[]>([])
  const [sel, setSel] = useState<string[]>([])
  const [editing, setEditing] = useState<string | null>(null)
  const [zones, setZones] = useState<ZoneKey[]>(() => getZonesForDepartments(['Planta', 'Logística']))
  const [channels, setChannels] = useState<ChannelKey[]>(() => getChannelsForDepartments(['Planta', 'Logística']))
  const [opens, setOpens] = useState(today())
  const [closes, setCloses] = useState(plusDays(14))
  const [approved, setApproved] = useState(false)
  useEffect(() => {
    if (!editId || loadedId === editId) return
    const saved = hrSurveys.find(s => s.id === editId)
    if (!saved || saved.status !== 'draft') return
    setTitle(saved.title); setGoal(saved.goal); setZones(saved.zones); setChannels(saved.channels)
    setOpens((saved.opensAt || today()).slice(0, 10)); setCloses((saved.closesAt || plusDays(14)).slice(0, 10))
    setLang(saved.locale === 'en' ? 'ENGLISH' : saved.locale === 'es' ? 'CASTELLANO' : LANG_OPTIONS[1].key)
    setPool(saved.questions); setSel(saved.questions.map(q => q.id))
    setDraft({ id: 'manual', survey: { titulo: saved.title, preguntas: [], introduccion_transparencia: saved.intro }, warnings: [] })
    setLoadedId(editId); setStep(1)
  }, [editId, loadedId, hrSurveys])

  const currentLangObj = LANG_OPTIONS.find(l => l.key === lang) ?? LANG_OPTIONS[0]
  const collectiveStr = departments.length > 0 ? departments.join(', ') : 'Planta'
  const durationSecs = (Number(durationMinutes) || 1) * 60

  const byId = useMemo(() => Object.fromEntries(pool.map(q => [q.id, q])), [pool])
  const chosen = sel.map(id => byId[id]).filter(Boolean)
  const secs = chosen.reduce((a, q) => a + q.secs, 0)
  const valid = chosen.length >= 3 && chosen.length <= 12
  const people = SURVEY_ZONES.filter(z => zones.includes(z.key)).reduce((a, z) => a + z.headcount, 0)

  // Sincronitza públic i canals derivats dels departaments de la Fase 1
  const syncPublicAndChannelsWithDepartments = (newDeps: string[]) => {
    const derivedZones = getZonesForDepartments(newDeps)
    const derivedChannels = getChannelsForDepartments(newDeps)
    setZones(derivedZones)
    setChannels(derivedChannels)
  }

  /** WF-01: Crida a la IA d'n8n amb durada, departaments, idioma i objectiu */
  const callWF01 = (extraRestrictions = '') => {
    const deptInfo = `Departaments a cobrir: ${collectiveStr}.`
    const durInfo = `Durada màxima objectiu de l'enquesta: ${durationMinutes || 1} minuts (${durationSecs} segons) de resposta.`
    return generateSurvey({
      objetivo: goal.trim(),
      colectiu: collectiveStr,
      durada_max: durationSecs,
      idioma: currentLangObj.apiVal,
      restriccions: extraRestrictions
        ? `${RESTRICTIONS}. ${deptInfo} ${durInfo} ${extraRestrictions}`
        : `${RESTRICTIONS}. ${deptInfo} ${durInfo} Generar estrictament en idioma ${currentLangObj.apiVal}.`,
    })
  }

  const runAI = async () => {
    setLoading(true)
    setGenError(null)
    try {
      const r = await callWF01()
      const qs = r.survey.preguntas.map(toQuestion)
      setDraft({ id: r.survey_id, survey: r.survey, warnings: r.control_calidad?.anti_sesgo_warnings ?? [] })
      if (!title.trim() && r.survey.titulo) setTitle(r.survey.titulo)
      setPool(qs)

      // Selecció inicial de preguntes respectant la durada marcada a la Fase 1 (mínim 3)
      let accSecs = 0
      const initialSel: string[] = []
      for (const q of qs) {
        if (initialSel.length < 3 || accSecs + q.secs <= durationSecs) {
          initialSel.push(q.id)
          accSecs += q.secs
        }
      }
      setSel(initialSel.length >= 3 ? initialSel : qs.slice(0, Math.max(3, qs.length)).map(q => q.id))

      // Sincronització automàtica de públic i canals amb els departaments de Fase 1
      syncPublicAndChannelsWithDepartments(departments)

      // Marcar Fase 1 com a acceptada i avançar
      setAcceptedSteps(prev => Array.from(new Set([...prev, 0])))
      setMaxAcceptedStep(prev => Math.max(prev, 1))
      setStep(1)
    } catch (e) {
      setGenError(errMsg(e))
    } finally {
      setLoading(false)
    }
  }

  /** Acceptar Fase 1 sense necessitat de tornar a generar IA si ja hi ha preguntes */
  const acceptPhase1 = () => {
    if (goal.trim().length < 5 || departments.length === 0 || !durationMinutes) return
    syncPublicAndChannelsWithDepartments(departments)
    setAcceptedSteps(prev => Array.from(new Set([...prev, 0])))
    setMaxAcceptedStep(prev => Math.max(prev, 1))
    setStep(1)
  }

  /** Acceptar Fase 2 (Preguntes) */
  const acceptPhase2 = () => {
    if (!valid) return
    setAcceptedSteps(prev => Array.from(new Set([...prev, 1])))
    setMaxAcceptedStep(prev => Math.max(prev, 2))
    setStep(2)
  }

  /** Acceptar Fase 3 (Públic i canals) */
  const acceptPhase3 = () => {
    if (zones.length === 0 || channels.length === 0) return
    setAcceptedSteps(prev => Array.from(new Set([...prev, 2])))
    setMaxAcceptedStep(prev => Math.max(prev, 3))
    setStep(3)
  }

  const startManual = () => {
    const questions = Array.from({ length: 3 }, (_, i) => generateAlternativeQuestion(i, lang, goal, departments))
    setDraft({ id: 'manual', survey: { titulo: title, preguntas: [] }, warnings: [] })
    setPool(questions)
    setSel(questions.map(q => q.id))
    setStep(1)
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

  /** Proposar més preguntes mantenint l'idioma, departaments i durada */
  const more = async () => {
    setLoadingMore(true)
    try {
      const existingTexts = pool.map(q => q.text.trim())
      const r = await callWF01(
        `Generar noves preguntes complementàries per als departaments ${collectiveStr} sobre: "${goal.trim()}". Idioma: ${currentLangObj.apiVal}. Evitar duplicar: ${existingTexts.slice(0, 5).join(' | ')}`
      )
      const used = new Set(pool.map(q => q.text.trim().toLowerCase()))
      const extra = r.survey.preguntas
        .map(toQuestion)
        .filter(q => !used.has(q.text.trim().toLowerCase()))

      if (extra.length > 0) {
        setPool(p => [...p, ...extra])
        toast(`La IA ha proposat ${extra.length} noves preguntes per a ${collectiveStr}`)
      } else {
        const fallbackQ = generateAlternativeQuestion(pool.length, lang, goal, departments)
        setPool(p => [...p, fallbackQ])
        toast(`Afegida nova proposta adaptada per a ${collectiveStr}`)
      }
    } catch {
      const fallbackQ = generateAlternativeQuestion(pool.length, lang, goal, departments)
      setPool(p => [...p, fallbackQ])
      toast(`Generada nova pregunta adaptada per a ${collectiveStr}`)
    } finally {
      setLoadingMore(false)
    }
  }

  /** Persistència local a PostgreSQL amb aprovació humana per publicar. */
  const publish = async (asDraft = false) => {
    if ((!asDraft && !approved) || !valid || !draft || publishing) return
    setPublishing(true)
    try {
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
        status: asDraft ? 'draft' : opens <= today() ? 'open' : 'scheduled',
        zones,
        questions: chosen,
        channels,
        opensAt: opens,
        closesAt: closes,
        responses: 0,
        target: people,
        createdAt: today(),
        locale: lang === 'ENGLISH' ? 'en' : lang === 'CASTELLANO' ? 'es' : 'ca',
        intro: draft.survey.introduccion_transparencia,
      }
      const saved = await addSurvey(s, !asDraft && approved, editId)
      toast(asDraft ? 'Esborrany desat' : s.status === 'open' ? 'Enquesta publicada i oberta' : 'Enquesta programada')
      nav(`/rrhh/enquestes/${saved.id}?nova=1`)
    } catch (e) {
      toast(`No s’ha pogut publicar: ${errMsg(e)}`)
    } finally {
      setPublishing(false)
    }
  }

  // La barra lateral de resum només es mostra a la Fase 2 (Preguntes) i a la Fase 3 (Públic i canals)
  const showSummarySidebar = step === 1 || step === 2

  if (editId && hrLoading) return <p role="status">Carregant esborrany…</p>
  if (editId && (hrError || !hrSurveys.some(s => s.id === editId && s.status === 'draft'))) return <p role="alert">{hrError || 'No es pot editar aquesta enquesta.'}</p>

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
        </div>
        <ol className="grid gap-2 grid-cols-2 md:grid-cols-4">
          {STEPS.map((l, i) => {
            const cur = i === step
            const done = acceptedSteps.includes(i)
            // No es pot avançar a fases futures sense haver acceptat l'anterior; es pot tornar enrere en qualsevol moment
            const canNavigate = i <= step || (i <= maxAcceptedStep && acceptedSteps.includes(i - 1))
            return (
              <li key={l}>
                <button
                  type="button"
                  disabled={!canNavigate}
                  onClick={() => setStep(i)}
                  aria-current={cur ? 'step' : undefined}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[14px] border-[1.5px] text-left text-sm font-bold transition-colors',
                    cur ? 'border-red bg-paper' : 'border-line',
                    done ? 'bg-paper' : !cur && 'bg-cream',
                    !canNavigate && 'opacity-40 cursor-not-allowed'
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
                  Defineix l'objectiu de la microconsulta, la durada i els departaments per preparar preguntes precises, neutres i adaptades als teus equips.
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
                  Explica-ho amb les teves paraules *
                </label>
                <textarea
                  id="goal"
                  rows={4}
                  className="input !text-base !leading-relaxed !rounded-[16px] resize-y"
                  placeholder="Ex: Volem conèixer com afecta el nou sistema de torns a Envasat i Logística, sobretot pel que fa al descans, l’estrès i la conciliació."
                  value={goal}
                  onChange={e => setGoal(e.target.value)}
                />
                <span className="text-[11.5px] text-ink-muted mt-1 block">Mínim 5 caràcters per guiar la generació de la consulta.</span>
              </div>

              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {/* Durada màxima: camp numèric en minuts */}
                <div>
                  <label htmlFor="durMin" className="eyebrow block mb-2 font-bold">
                    Durada màxima (minuts) *
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
                  <span className="text-[11.5px] text-ink-muted mt-1 block">
                    Temps màxim estimat: {durationMinutes ? `${durationSecs} segons` : 'pendent'}
                  </span>
                </div>

                {/* Idioma */}
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

              {/* Departaments: Selector múltiple que impactarà les seccions futures */}
              <div className="flex flex-col gap-2 pt-2 border-t border-[#F1EAE0]">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="eyebrow block font-bold">Departaments * (Selector múltiple)</label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = departments.length === DEPARTAMENTS.length ? [] : [...DEPARTAMENTS]
                      setDepartments(next)
                    }}
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
                    ? '⚠️ Cal seleccionar almenys un departament per configurar les preguntes, zones i canals.'
                    : `Departaments seleccionats (${departments.length}): ${departments.join(', ')}. S'adaptaran les preguntes, zones i canals de distribució.`}
                </p>
              </div>

              <button className="btn-line" disabled={!title.trim() || !goal.trim()} onClick={startManual}>Començar amb preguntes de plantilla</button>
              {genError && (
                <div role="alert" className="text-[13px] font-semibold rounded-[12px] px-3.5 py-2.5 bg-warn-bg text-warn-ink">
                  No s’han pogut generar les preguntes: {genError}. Comprova que el workflow WF-01 estigui actiu i torna-ho a provar.
                </div>
              )}

              <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-[#F1EAE0]">
                <div className="text-xs text-ink-muted font-medium">
                  {pool.length > 0 && (
                    <span className="text-ok font-semibold">
                      ✓ Hi ha {pool.length} preguntes preparades prèviament.
                    </span>
                  )}
                </div>
                <div className="flex gap-2.5 items-center">
                  {pool.length > 0 && (
                    <button
                      type="button"
                      onClick={acceptPhase1}
                      disabled={goal.trim().length < 5 || departments.length === 0 || !durationMinutes}
                      className="btn-ink !h-[50px] !px-6 !text-[15px] font-bold shadow-sm"
                    >
                      Acceptar i continuar →
                    </button>
                  )}
                  <button
                    onClick={runAI}
                    disabled={loading || goal.trim().length < 5 || departments.length === 0 || !durationMinutes}
                    className="btn-red !h-[50px] !px-6 !text-[15px] font-bold shadow-sm"
                  >
                    <Sparkles size={18} aria-hidden />
                    {loading
                      ? 'La IA està preparant les preguntes…'
                      : pool.length
                      ? 'Tornar a generar preguntes amb IA'
                      : 'Generar preguntes amb IA'}
                  </button>
                </div>
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
                  <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-muted mt-1">
                    <span>Idioma: <strong className="text-ink">{currentLangObj.label}</strong></span>
                    <span>·</span>
                    <span>Departaments: <strong className="text-ink">{collectiveStr}</strong></span>
                    <span>·</span>
                    <span>
                      Objectiu Fase 1: <strong className="text-ink">{durationMinutes || 1} min ({durationSecs} s)</strong>
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-1">
                    Tria’n almenys 3 preguntes. Pots editar-les, regenerar-les o esborrar-les.
                  </p>
                </div>
                <button onClick={more} disabled={loadingMore} className="btn-line !h-[40px] !text-[13px] font-bold">
                  {loadingMore ? 'La IA està pensant noves preguntes…' : '+ Proposar-ne més'}
                </button>
              </div>

              {/* Indicador de concordança de temps amb la Fase 1 */}
              <div className={cn(
                'rounded-[14px] p-3 text-xs font-semibold flex items-center justify-between flex-wrap gap-2 border',
                secs <= durationSecs ? 'bg-ok-bg text-ok-ink border-ok/30' : 'bg-warn-bg text-warn-ink border-warn/30'
              )}>
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  Temps acumulat seleccionat: <strong>{secs} segons</strong> (Objectiu marcat: {durationSecs} s)
                </span>
                <span>
                  {secs <= durationSecs
                    ? '✓ Dins del temps marcat a la Fase 1'
                    : '⚠️ Les preguntes seleccionades superen el temps orientatiu marcat'}
                </span>
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

              {/* Barra de navegació a peu de pàgina per a Fase 2 */}
              <div className="flex justify-between items-center pt-4 border-t border-[#F1EAE0]">
                <button
                  type="button"
                  className="btn-line !h-11 px-5 font-bold"
                  onClick={() => setStep(0)}
                >
                  ← Enrere (Objectiu)
                </button>
                <button
                  type="button"
                  className="btn-ink !h-11 px-6 font-bold"
                  disabled={!valid}
                  onClick={acceptPhase2}
                >
                  Acceptar i continuar →
                </button>
              </div>
            </>
          )}

          {/* ========================================================
              FASE 3: PÚBLIC I CANALS
              ======================================================== */}
          {step === 2 && (
            <>
              {/* Notificació d'integració amb departaments de Fase 1 */}
              <div className="rounded-[14px] bg-[#FAF7F2] p-3.5 border border-[#E8DEC8] flex items-start gap-2.5 text-xs text-ink leading-relaxed">
                <Info size={16} className="text-red shrink-0 mt-0.5" />
                <div>
                  <strong>Sincronitzat amb la Fase 1:</strong> Hem preseleccionat les zones i canals òptims per als departaments marcats (<strong>{collectiveStr}</strong>). Pots ajustar-los lliurement segons les teves necessitats.
                </div>
              </div>

              <div>
                <div className="flex justify-between items-baseline flex-wrap gap-2">
                  <h2 className="serif text-2xl">A qui va dirigida?</h2>
                  <span className="text-xs text-ink-muted font-semibold">
                    Departaments base: <strong>{collectiveStr}</strong>
                  </span>
                </div>
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
                  Canals de distribució de la microconsulta, adaptats als canals habituals de {collectiveStr}.
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

              <TeamsDeliveryPreview
                selected={channels.includes('teams')}
                title={title || draft?.survey.titulo || 'Nova enquesta'}
                questions={chosen.length}
                closesAt={closes}
                onToggle={() => toggle(channels, 'teams', setChannels)}
              />

              {/* Obertura i tancament d'enquesta */}
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
                <button
                  type="button"
                  className="btn-line !h-11 px-5 font-bold"
                  onClick={() => setStep(1)}
                >
                  ← Enrere (Preguntes)
                </button>
                <button
                  type="button"
                  className="btn-ink !h-11 px-6 font-bold"
                  disabled={zones.length === 0 || channels.length === 0}
                  onClick={acceptPhase3}
                >
                  Acceptar i continuar · Revisió →
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
                      <span className="text-[11px] text-ink-muted block">mín. 3</span>
                    </div>
                    <div className="bg-white rounded-[12px] p-2.5 border border-[#E8DEC8]">
                      <span className="text-xs text-ink-muted block font-semibold">Temps</span>
                      <strong className="text-xl font-extrabold text-ink tabular-nums">{secs} s</strong>
                      <span className="text-[11px] text-ink-muted block">obj: {durationSecs} s</span>
                    </div>
                    <div className="bg-white rounded-[12px] p-2.5 border border-[#E8DEC8]">
                      <span className="text-xs text-ink-muted block font-semibold">Persones</span>
                      <strong className="text-xl font-extrabold text-ink tabular-nums">{people || 'Sense dades'}</strong>
                      <span className="text-[11px] text-ink-muted block">plantilla</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-semibold text-ink-muted pt-1">
                    <span>
                      Departaments (Fase 1): <strong className="text-ink">{collectiveStr}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Durada objectiu: <strong className="text-ink">{durationMinutes || 1} min</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Idioma: <strong>{currentLangObj.label}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Canals: <strong>{channels.length} seleccionats</strong>
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
                  <button
                    type="button"
                    className="btn-line !h-[52px] px-5 font-bold"
                    onClick={() => setStep(2)}
                  >
                    ← Enrere
                  </button>
                  <button
                    onClick={() => void publish()}
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
                <button className="btn-line" disabled={!valid || !draft || publishing} onClick={() => void publish(true)}>Desar esborrany</button>
                <p className="text-xs text-ink-muted text-center">
                  La IA no publica res sola: cal la teva aprovació humana de RRHH.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================
            BARRA LATERAL DE RESUM
            (Exclusiva per a les Fases 2 i 3)
            ======================================================== */}
        {showSummarySidebar && (
          <aside
            aria-label="Resum"
            className="card p-5 flex-[1_1_300px] min-w-0 flex flex-col gap-3.5 lg:sticky lg:top-6"
          >
            <div>
              <div className="eyebrow">Resum de la consulta</div>
              <div className="serif text-[22px] leading-tight mt-1">{title || 'Sense nom'}</div>
              <div className="text-xs text-ink-muted font-medium mt-1">
                Departaments: <strong>{collectiveStr}</strong>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                [
                  'Preguntes',
                  <>
                    {chosen.length}
                    <span className="text-xs font-semibold text-ink-muted"> / mín. 3</span>
                  </>,
                ],
                [
                  'Temps',
                  <>
                    {secs} s
                    <span className="text-[11px] block font-medium text-ink-muted">
                      obj: {durationSecs} s
                    </span>
                  </>,
                ],
                ['Persones', people || 'Sense dades'],
                ['Canals', channels.length],
              ].map(([l, v]) => (
                <div key={String(l)} className="bg-cream rounded-[14px] px-3 py-2.5">
                  <div className="text-xs text-ink-muted">{l}</div>
                  <div className="text-[20px] font-extrabold tabular-nums leading-tight mt-0.5">{v}</div>
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
                {valid
                  ? `✓ Compleix el requisit: ${chosen.length} seleccionades (mín. 3)`
                  : `Cal seleccionar almenys 3 preguntes (en portes ${chosen.length})`}
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

            {/* Fase 2: Botons de navegació a la part de resum */}
            {step === 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-line"
                  onClick={() => setStep(0)}
                >
                  Enrere
                </button>
                <button
                  type="button"
                  className="btn-ink flex-1 !font-bold"
                  disabled={!valid}
                  onClick={acceptPhase2}
                >
                  Acceptar i continuar →
                </button>
              </div>
            )}

            {/* Fase 3: Botons de navegació a la part de resum */}
            {step === 2 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn-line"
                  onClick={() => setStep(1)}
                >
                  Enrere
                </button>
                <button
                  type="button"
                  className="btn-ink flex-1 !font-bold"
                  disabled={zones.length === 0 || channels.length === 0}
                  onClick={acceptPhase3}
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

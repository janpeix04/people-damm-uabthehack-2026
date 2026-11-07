import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Mail } from 'lucide-react'
import { HAIR_STYLES, HAIRS, IDEA_CATEGORIES, PLAZA_MILESTONES, PLAZA_TOPICS, SHIRTS, SKINS, MOODS, zoneByKey } from '../data/mock'
import type { Avatar, ZoneKey } from '../data/types'
import { useApp } from '../store/AppContext'
import { cn, fmt, Meter, Modal, PrivacyNote, toneBg, MoodBadge } from './ui'

/** Fites col·lectives de la Festa de la setmana (participació a La Plaça). */
export function FestaMilestones() {
  const { plazaWeek } = useApp()
  const next = PLAZA_MILESTONES.find(m => plazaWeek.pct < m.at)
  return (
    <div className="grid grid-cols-4 gap-1.5 mt-3">
      {PLAZA_MILESTONES.map(m => {
        const done = plazaWeek.pct >= m.at, isNext = m === next
        return (
          <div key={m.label} className={cn('flex flex-col items-center gap-1 text-center text-[11px] font-semibold', done || isNext ? 'text-ink' : 'text-ink-muted')}>
            <span className={cn('w-[30px] h-[30px] rounded-full grid place-items-center', done ? 'bg-ok text-white' : isNext ? 'bg-gold text-white ring-4 ring-gold/20' : 'bg-[#EFE9E1] text-[#8A7F78]')}>{done ? '✓' : m.mark}</span>
            {m.label}<br />{m.at}%
          </div>
        )
      })}
    </div>
  )
}

/** Festa de la setmana: participació única a La Plaça (es reinicia cada dilluns). */
export function FestaWeekPanel({ hr, className }: { hr?: boolean; className?: string }) {
  const { plazaWeek: w } = useApp()
  const missing = w.next ? (w.next.missing === 1 ? 'Falta 1 persona' : `Falten ${w.next.missing} persones`) : null
  return (
    <section aria-label="Festa de la setmana" className={cn('bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-3', className)}>
      <div className="flex justify-between items-baseline gap-2"><h2 className="serif text-[19px] sm:text-[21px]">Festa de la setmana</h2><strong className="text-sm tabular-nums">{Math.floor(w.pct)}%</strong></div>
      <Meter value={w.pct} goal={w.goal} className="mt-2" />
      <p className="text-[12px] text-ink-muted mt-1.5">
        {missing ? <>{missing} per a <strong className="text-ink">{w.next!.label.toLowerCase()}</strong></> : 'Totes les fites aconseguides!'} · es reinicia {w.resetsIn === 1 ? 'demà' : 'dilluns'}
      </p>
      <div className="hidden sm:block"><FestaMilestones /></div>
      <p className="hidden sm:block text-[11px] leading-snug text-ink-muted mt-2.5 pt-2 border-t border-cream-dk">
        {hr
          ? <>{w.participants} de {w.headcount} persones han participat a La Plaça aquesta setmana · la setmana passada, {w.lastWeek}%.</>
          : <>Compta cada persona un cop per setmana: pregunta del dia, +1 o idea. {w.joined && <strong className="text-ok">✓ Ja hi has sumat.</strong>}</>}
      </p>
    </section>
  )
}

/** Pregunta del dia: un toc per respondre; el resultat agregat només es veu un cop respost (i amb un mínim de respostes). */
export function DailyQuestion({ hr, className }: { hr?: boolean; className?: string }) {
  const { plazaWeek: w, answerDaily, plazaError, plazaLoading, refreshPlaza, toast } = useApp()
  const [busy, setBusy] = useState(false)
  const q = w.question
  const showResults = hr || !!w.myAnswer
  if (plazaLoading) return <p role="status">Carregant La Plaça…</p>
  if (plazaError) return <p role="alert">{plazaError} <button className="btn-line" onClick={() => void refreshPlaza()}>Reintentar</button></p>
  if (!q) return <p className="text-sm text-ink-muted">Encara no s’ha publicat la pregunta d’avui.</p>
  return (
    <section aria-label="Pregunta del dia" className={cn('flex flex-col gap-2.5', className)}>
      <div className="flex items-center justify-between gap-2"><span className="eyebrow !text-red">Pregunta del dia</span><span className="text-[11px] text-ink-muted">Anònima · un toc</span></div>
      <h3 className="serif text-[20px] leading-tight">{q.text}</h3>
      {!showResults && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${q.options.length > 3 ? 2 : q.options.length}, minmax(0, 1fr))` }}>
          {q.options.map(o => (
            <button key={o.key} disabled={busy} onClick={async () => { setBusy(true); try { await answerDaily(o.key) } catch (e) { toast(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) } }} className="rounded-[14px] border border-line bg-cream hover:bg-cream-dk transition px-2 py-2.5 flex flex-col items-center gap-1 text-[13px] font-bold">
              <span className="text-[24px] leading-none" aria-hidden>{o.emoji}</span>{o.label}
            </button>
          ))}
        </div>
      )}
      {showResults && (w.results ? (
        <div className="flex flex-col gap-1.5">
          {w.results.map(r => (
            <div key={r.key} className="flex items-center gap-2 text-[13px]">
              <span className="w-6 text-center" aria-hidden>{r.emoji}</span>
              <span className="w-[96px] font-semibold truncate">{r.label}{!hr && w.myAnswer === r.key ? ' ✓' : ''}</span>
              <span className="flex-1 h-2 rounded-full bg-cream-dk overflow-hidden"><span className="block h-full rounded-full bg-red" style={{ width: `${r.pct}%` }} /></span>
              <span className="w-9 text-right tabular-nums text-ink-muted">{Math.round(r.pct)}%</span>
            </div>
          ))}
          <p className="text-[11px] text-ink-muted">{w.todayTotal} respostes avui · només resultats agregats</p>
        </div>
      ) : <p className="text-[13px] text-ink-muted bg-cream rounded-[12px] p-3">Encara no hi ha prou respostes per mostrar el resultat (mínim 10).</p>)}
      {!hr && w.myAnswer && <p className="text-[12px] font-semibold text-ok">Gràcies! Demà hi haurà una pregunta nova.</p>}
    </section>
  )
}

/** Missions col·lectives de Damm World (sense punts individuals). */
export function MissionsPanel({ onSurvey, className }: { onSurvey: () => void; className?: string }) {
  const { festa } = useApp()
  const env = zoneByKey('envasat'), log = zoneByKey('logistica'), man = zoneByKey('manteniment')
  const items = [
    { w: 'stressed' as const, title: 'Que Envasat i Logística passin d’estressats a contents', pct: ((env.participation + log.participation) / 2 / 60) * 100, left: `Envasat ${env.participation}% · Logística ${log.participation}%`, right: 'Objectiu 60%' },
    { w: 'nodata' as const, title: 'Fes visible l’emoció de Manteniment', pct: man.responses * 10, left: `${man.responses} de 10 respostes`, right: `Falten ${10 - man.responses}` },
    { w: 'lock' as const, title: 'Obre el Jardí de la cervesa', pct: (festa.pct / 60) * 100, left: `Planta al ${Math.round(festa.pct)}%`, right: 'Objectiu 60%' },
  ]
  return (
    <aside aria-label="Missions de l’equip" className={cn('bg-paper/95 backdrop-blur border border-line rounded-[22px] shadow-lift p-4 flex flex-col gap-3', className)}>
      <h2 className="serif text-[24px]">Missions de l’equip</h2>
      {items.map(m => (
        <div key={m.title} className="rounded-[14px] bg-cream p-3 flex flex-col gap-2">
          <div className="flex gap-2.5 items-center text-sm font-bold leading-snug"><MoodBadge w={m.w} size={34} icon={19} />{m.title}</div>
          <div className="h-2.5 rounded-full bg-[#E9E0D3] overflow-hidden"><div className="h-full rounded-full bg-red" style={{ width: `${Math.min(100, m.pct)}%` }} /></div>
          <div className="flex justify-between text-xs text-ink-muted"><span>{m.left}</span><b className="text-ink">{m.right}</b></div>
        </div>
      ))}
      <button onClick={onSurvey} className="btn-red !h-[50px]">Ajuda l’equip · enquesta de 45 s</button>
      <p className="text-[11.5px] leading-snug text-ink-muted">Missions col·lectives. No hi ha punts per resposta ni rànquings de persones.</p>
    </aside>
  )
}

/** Fitxa d’una zona de Damm World. `hr` afegeix alertes i enllaços de gestió. */
export function ZonePanel({ zone, hr, className }: { zone: ZoneKey; hr?: boolean; className?: string }) {
  const z = zoneByKey(zone)
  const w = MOODS[z.mood]
  const hidden = z.score == null
  return (
    <section aria-live="polite" className={cn('bg-paper/95 backdrop-blur border border-line rounded-[22px] shadow-lift p-4 sm:p-5 flex flex-col gap-2.5 max-h-[62dvh] overflow-y-auto', className)}>
      <div className="flex gap-3 items-center">
        <MoodBadge w={z.mood} size={52} icon={28} />
        <div className="min-w-0 flex-1"><div className="text-xs font-semibold text-ink-muted">{z.area}{z.headcount ? ` · ${z.headcount} persones` : ''}</div><h2 className="serif text-[24px] leading-tight">{z.name}</h2></div>
        <div className="text-right"><div className="serif text-[30px] leading-none">{z.score != null ? fmt(z.score) : z.key === 'jardi' ? '60%' : '?'}</div><span className="text-xs font-bold" style={{ color: w.ink }}>{z.moodLabel}</span></div>
      </div>
      <p className="text-[13px] sm:text-sm leading-relaxed">{z.story}</p>
      {z.key !== 'jardi' && <p className="hidden sm:block text-[11.5px] text-ink-muted -mt-1">Emoció predominant de l’equip, a partir de respostes anònimes agregades (mínim 10). Mai individual.</p>}
      {!hidden && (
        <>
          <div className="hidden sm:flex flex-wrap gap-1.5">{z.topics.map(t => <span key={t.label} className="chip" style={{ background: toneBg(t.tone) }}>{t.label}</span>)}</div>
          <div className="flex gap-2 items-start text-[13px] leading-snug bg-ok-bg rounded-[12px] px-3 py-2.5"><Check size={16} className="text-ok shrink-0 mt-px" aria-hidden /><span><strong>Què estem fent:</strong> {z.doing}</span></div>
          <div className="flex justify-between text-xs text-ink-muted"><span>Participació {z.participation}% · {z.responses} respostes</span><span>{z.delta < 0 ? '▼' : '▲'} {fmt(Math.abs(z.delta))} vs mes anterior</span></div>
        </>
      )}
      {hidden && z.key === 'manteniment' && <><Meter value={70} thin /><span className="text-[13px] font-semibold">{z.responses} de 10 respostes · falten {10 - z.responses} perquè es pugui mostrar l’emoció de l’equip</span></>}
      {z.key === 'jardi' && <span className="text-[13px] font-semibold">Depèn de la participació de tota la planta (Festa de la plaça).</span>}
      {hr && z.alerts.length > 0 && <div className="flex flex-col gap-1.5">{z.alerts.map(a => <div key={a} className="text-[13px] leading-snug bg-warn-bg text-[#5A3A10] rounded-[12px] px-3 py-2">⚠ {a}</div>)}</div>}
      {hr && z.suggestion && <ActionDraft key={z.key} zone={z.key} name={z.name} s={z.suggestion} />}
      {hr && z.survey && !z.suggestion && <div className="flex gap-2 flex-wrap"><Link to="/rrhh/crear" className="btn-ink !h-9 !text-[13px]">Microenquesta per a {z.name}</Link></div>}
    </section>
  )
}

/** Proposta d'acció per a una zona: és un esborrany i no fa res fins que RRHH l'aprova. */
function ActionDraft({ zone, name, s }: { zone: ZoneKey; name: string; s: { focus: string; why: string; action: string } }) {
  const [state, setState] = useState<'draft' | 'ok' | 'no'>('draft')
  if (state === 'no') return <button onClick={() => setState('draft')} className="self-start text-xs font-semibold text-ink-muted underline">Proposta descartada · desfer</button>
  return (
    <div className="rounded-[14px] border border-dashed border-[#C9BBA8] bg-[#FBF7F0] px-3 py-2.5 flex flex-col gap-1.5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-ink-muted">
        <span>Proposta d’acció</span>
        <span className={cn('rounded-full px-2 py-0.5 normal-case tracking-normal', state === 'ok' ? 'bg-ok-bg text-ok' : 'bg-[#EFE6D8] text-[#6B5A44]')}>{state === 'ok' ? 'Aprovada per RRHH' : 'Esborrany de l’IA · cal aprovació'}</span>
      </div>
      <p className="text-[13px] leading-snug"><strong>Què preocupa més:</strong> {s.focus}. <span className="text-ink-soft">{s.why}</span></p>
      <p className="text-[13px] leading-snug"><strong>Què proposem:</strong> {s.action}</p>
      {state === 'draft'
        ? <div className="flex gap-2 flex-wrap pt-0.5">
            <button onClick={() => setState('ok')} className="btn-ink !h-9 !text-[13px]">Aprovar</button>
            <Link to={`/rrhh/crear?zona=${zone}`} className="btn-line !h-9 !text-[13px]">Editar com a microenquesta</Link>
            <button onClick={() => setState('no')} className="btn-line !h-9 !text-[13px]">Descartar</button>
          </div>
        : <Link to={`/rrhh/crear?zona=${zone}`} className="btn-ink !h-9 !text-[13px] self-start">Preparar la microenquesta per a {name}</Link>}
    </div>
  )
}

export function IdeaModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addIdea } = useApp()
  const [cat, setCat] = useState(0)
  const [text, setText] = useState('')
  const [step, setStep] = useState<'form' | number | 'done'>('form')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const close = () => { onClose(); setTimeout(() => { setStep('form'); setText('') }, 200) }
  const send = async () => {
    if (text.trim().length < 3) return
    setBusy(true); setError(null)
    try { await addIdea(IDEA_CATEGORIES[cat], text.trim()); setStep('done') }
    catch (e) { setError(e instanceof Error ? e.message : 'No s’ha pogut desar') }
    finally { setBusy(false) }
  }
  const steps = ['Traiem noms i dades personals', 'Revisem el to i el contingut', 'L’afegim al tema, sense el teu nom']
  return (
    <Modal open={open} onClose={close} title={step === 'done' ? 'Idea rebuda' : typeof step === 'number' ? 'Desant…' : 'Bústia d’idees'}>
      {step === 'form' && (
        <>
          <p className="text-sm text-ink-muted">La idea es desa sense vincular-la al teu compte.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">{IDEA_CATEGORIES.map((c, i) => <button key={c} aria-pressed={cat === i} onClick={() => setCat(i)} className="toggle p-3 text-[13px] font-bold text-center">{c}</button>)}</div>
          <label htmlFor="idea" className="text-[13px] font-bold">La teva idea o opinió</label>
          <textarea id="idea" rows={4} className="input !text-[15px] !rounded-[16px]" value={text} onChange={e => setText(e.target.value)} placeholder="Per exemple: estaria bé tenir el calendari de torns visible al menjador." />
          <p className="text-xs text-ink-muted">No hi incloguis noms. Els correus i telèfons es redacten; RRHH revisa el contingut abans de publicar.</p>
          {error && <p role="alert">{error}</p>}
          <button className="btn-red !h-[52px] !text-base" disabled={busy || text.trim().length < 3} onClick={() => void send()}>{busy ? 'Desant…' : 'Deixar-la a la bústia'}</button>
        </>
      )}
      {typeof step === 'number' && (
        <div className="flex flex-col gap-3 py-1">
          {steps.map((s, i) => <div key={s} className={cn('flex gap-3 items-center text-[15px] font-semibold', i < step ? 'text-ink' : 'text-ink-muted')}><span className={cn('w-[30px] h-[30px] rounded-full grid place-items-center text-white text-sm', i < step ? 'bg-ok' : 'bg-line')}>{i < step ? '✓' : i + 1}</span>{s}</div>)}
        </div>
      )}
      {step === 'done' && (
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-20 h-20 rounded-[26px] bg-red grid place-items-center shadow-red"><Mail size={38} color="#fff" aria-hidden /></div>
          <p className="text-[15px] leading-relaxed text-ink-muted">S’ha desat a la bústia de <strong className="text-ink">{IDEA_CATEGORIES[cat]}</strong>, sense vincular-la al teu moneder. Queda pendent de moderació.</p>
          <button className="btn-ink w-full" onClick={close}>Tornar a la plaça</button>
        </div>
      )}
    </Modal>
  )
}

export function TopicsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Temes de la setmana">
      <div className="flex flex-col gap-2">
        {PLAZA_TOPICS.map(t => (
          <div key={t.label} className="flex items-center gap-3 rounded-[14px] p-3" style={{ background: toneBg(t.tone) }}>
            <div className="flex-1"><strong className="block">{t.label}</strong><small className="text-ink-muted">{t.n} opinions · {t.trend}</small></div>
            <span className="w-28 h-2 rounded-full bg-white overflow-hidden"><span className="block h-full bg-ink" style={{ width: `${(t.n / 64) * 100}%` }} /></span>
          </div>
        ))}
        <p className="text-xs text-ink-muted mt-1">Opinions agrupades i moderades. Mai es mostren comentaris individuals.</p>
      </div>
    </Modal>
  )
}

function AvatarPreview({ a }: { a: Avatar }) {
  const light = ['#F4EFE6', '#B08A45'].includes(SHIRTS[a.shirt])
  return (
    <svg viewBox="0 0 120 150" className="w-[140px] h-[175px] rounded-[20px] bg-gradient-to-b from-[#DCEBF3] to-[#F6FAFC] shrink-0" aria-hidden>
      <ellipse cx="60" cy="142" rx="26" ry="5" fill="rgba(0,0,0,.12)" />
      <rect x="47" y="112" width="11" height="28" rx="5" fill="#2B3346" /><rect x="62" y="112" width="11" height="28" rx="5" fill="#2B3346" />
      <rect x="40" y="76" width="40" height="44" rx="18" fill={SHIRTS[a.shirt]} stroke={light ? '#E3DCD0' : 'none'} />
      {a.logo && <text x="60" y="100" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" fontWeight="800" fontSize="9" fill={light ? '#C8102E' : '#FFFFFF'}>DAMM</text>}
      <circle cx="60" cy="48" r="28" fill={SKINS[a.skin]} />
      {a.style === 2 ? [32, 42, 54, 66, 78, 88].map(x => <circle key={x} cx={x} cy={30 + Math.abs(60 - x) * .25} r="9" fill={HAIRS[a.hair]} />)
        : <path d={a.style === 1 ? 'M30 60 C26 22 94 22 90 60 L84 48 C80 34 40 34 36 48Z' : 'M32 46 C32 22 50 18 60 18 C74 18 88 24 88 46 C82 34 72 30 60 30 C48 30 38 34 32 46Z'} fill={HAIRS[a.hair]} />}
      {a.style === 3 && <circle cx="60" cy="16" r="10" fill={HAIRS[a.hair]} />}
      <ellipse cx="50" cy="50" rx="3" ry="4" fill="#1E1A26" /><ellipse cx="70" cy="50" rx="3" ry="4" fill="#1E1A26" />
      <ellipse cx="42" cy="59" rx="4" ry="2.4" fill="#FF8C9C" opacity=".4" /><ellipse cx="78" cy="59" rx="4" ry="2.4" fill="#FF8C9C" opacity=".4" />
      <path d="M53 62 Q60 69 67 62" stroke="#7A2B35" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function AvatarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { avatar, setAvatar, toast } = useApp()
  const [a, setA] = useState<Avatar>(avatar)
  const [saving, setSaving] = useState(false)
  useEffect(() => { if (open) setA(avatar) }, [open])
  const sw = (key: 'skin' | 'hair' | 'shirt', list: string[], label: string) => (
    <div>
      <div className="text-[13px] font-bold mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">{list.map((c, i) => <button key={c} aria-label={`${label} ${i + 1}`} aria-pressed={a[key] === i} onClick={() => setA({ ...a, [key]: i })} className={cn('w-9 h-9 rounded-full border-[3px] border-white', a[key] === i ? 'ring-2 ring-ink' : 'ring-1 ring-line')} style={{ background: c }} />)}</div>
    </div>
  )
  return (
    <Modal open={open} onClose={onClose} title="El teu personatge">
      <div className="flex flex-wrap gap-5 items-start">
        <AvatarPreview a={a} />
        <div className="flex-1 min-w-[200px] flex flex-col gap-3">
          {sw('skin', SKINS, 'Pell')}
          {sw('hair', HAIRS, 'Cabell')}
          <div><div className="text-[13px] font-bold mb-1.5">Pentinat</div><div className="flex flex-wrap gap-1.5">{HAIR_STYLES.map((s, i) => <button key={s} aria-pressed={a.style === i} onClick={() => setA({ ...a, style: i })} className="toggle h-9 px-3 text-[13px] font-bold">{s}</button>)}</div></div>
          {sw('shirt', SHIRTS, 'Samarreta')}
          <div className="flex gap-1.5">{['Llisa', 'Amb DAMM'].map((s, i) => <button key={s} aria-pressed={a.logo === (i === 1)} onClick={() => setA({ ...a, logo: i === 1 })} className="toggle h-9 px-3 text-[13px] font-bold">{s}</button>)}</div>
        </div>
      </div>
      <PrivacyNote>El personatge es desa al servidor amb el moneder d’aquest dispositiu. No es vincula a les respostes anònimes.</PrivacyNote>
      <button className="btn-red !h-[52px]" disabled={saving} onClick={async () => { setSaving(true); try { await setAvatar(a); onClose(); toast('Personatge desat') } catch (e) { toast(e instanceof Error ? e.message : 'No s’ha pogut desar') } finally { setSaving(false) } }}>{saving ? 'Desant…' : 'Fet'}</button>
    </Modal>
  )
}

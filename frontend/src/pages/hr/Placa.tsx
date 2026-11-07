import { useEffect, useState } from 'react'
import { hrPlazaCall } from '../../api/plaza'
import type { Idea } from '../../data/types'
import { Eye, Inbox, MessageCircle, MessageCircleQuestion } from 'lucide-react'
import { Scene3D } from '../../components/Scene3D'
import { DailyQuestion, FestaWeekPanel, TopicsModal } from '../../components/Panels'
import { Modal } from '../../components/ui'
import { useApp } from '../../store/AppContext'

/** La Plaça vista per RRHH: l'escena a pantalla completa amb els controls flotant a sobre. */
export default function HRPlaca() {
  const { plazaWeek, toast, refreshPlaza } = useApp()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [questionText, setQuestionText] = useState('')
  const [options, setOptions] = useState('')
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshIdeas = async () => {
    try { setIdeas(await hrPlazaCall<Idea[]>({ action: 'list' })); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error de connexió') }
  }
  const moderate = async (id: string, status: string) => {
    setBusy(true)
    try { setIdeas(await hrPlazaCall<Idea[]>({ action: 'moderate', id, status })); await refreshPlaza(); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setBusy(false) }
  }
  const [modal, setModal] = useState<'topics' | 'ideas' | 'daily' | null>(null)
  useEffect(() => { void refreshIdeas() }, [modal])
  const moderant = ideas.filter(i => i.status === 'moderant').length

  return (
    <div className="relative h-[calc(100dvh-64px)] lg:h-[100dvh]">
      <Scene3D kind="plaza" className="absolute inset-0" ariaLabel="La Plaça en 3D: font, terrassa, escenari, parada de l’enquesta i persones conversant"
        festa={plazaWeek.pct} readOnly
        onAction={a => (a === 'stage' ? toast(plazaWeek.pct >= 60 ? 'Concert desbloquejat aquesta setmana per la participació a La Plaça' : 'El concert s’obre al 60% de participació setmanal a La Plaça') : a === 'idea' ? setModal('ideas') : toast('Vista de RRHH: les enquestes les responen els treballadors'))} />

      <div className="absolute left-3 right-3 top-3 sm:left-4 sm:right-4 sm:top-4 flex gap-2 items-start pointer-events-none">
        <div className="flex-1 max-w-[380px] flex flex-col gap-2">
          <FestaWeekPanel hr className="pointer-events-auto" />
          <div className="hidden lg:block pointer-events-auto bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-3.5"><DailyQuestion hr /></div>
        </div>
        <span className="hidden md:flex ml-auto pointer-events-auto items-center gap-2 bg-paper/95 border border-line rounded-full shadow-lift px-4 h-11 text-[13px] font-semibold text-ink-soft">
          <Eye size={17} aria-hidden /> Vista RRHH · així la veuen els treballadors
        </span>
      </div>

      <div className="absolute left-3 right-3 bottom-3 sm:bottom-4 flex flex-wrap justify-center gap-2">
        <button onClick={() => setModal('daily')} className="btn-line !h-[52px] !rounded-[18px] shadow-lift"><MessageCircleQuestion size={18} className="text-red" aria-hidden />Gestionar pregunta del dia</button>
        <button onClick={() => setModal('topics')} className="btn-line !h-[52px] !rounded-[18px] shadow-lift"><MessageCircle size={18} className="text-rain" aria-hidden /><span>Temes<span className="hidden sm:inline"> de la setmana</span></span></button>
        <button onClick={() => { void refreshIdeas(); setModal('ideas') }} className="btn-ink !h-[52px] !rounded-[18px] shadow-lift">
          <Inbox size={18} aria-hidden />Bústia d’idees
          {ideas.length > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red text-white text-xs font-bold grid place-items-center">{ideas.length}</span>}
        </button>
      </div>

      <p className="hidden xl:block absolute left-4 bottom-4 max-w-[250px] text-[11.5px] leading-snug text-ink-soft bg-paper/85 rounded-[12px] px-2.5 py-2">Personatges il·lustratius: no representen ningú real. Les bafarades mostren temes agregats i moderats. Dades sintètiques.</p>

      <TopicsModal open={modal === 'topics'} onClose={() => setModal(null)} />
      <Modal open={modal === 'daily'} onClose={() => setModal(null)} title="Pregunta del dia"><DailyQuestion hr />
        {!plazaWeek.question && <><label className="text-sm">Pregunta<input className="input" value={questionText} onChange={e => setQuestionText(e.target.value)} /></label><label className="text-sm">Opcions (una per línia)<textarea className="input" value={options} onChange={e => setOptions(e.target.value)} /></label><label><input type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} /> He revisat i aprovo la publicació</label><button disabled={busy || !approved} className="btn-red" onClick={async () => { setBusy(true); try { await hrPlazaCall({ action: 'question', text: questionText, options: options.split('\n').map(o => o.trim()).filter(Boolean), approved }); await refreshPlaza(); toast('Pregunta publicada'); setError(null) } catch (e) { setError(e instanceof Error ? e.message : 'Error') } finally { setBusy(false) } }}>Publicar pregunta d’avui</button></>}
        {error && <p role="alert">{error}</p>}
      </Modal>
      <Modal open={modal === 'ideas'} onClose={() => setModal(null)} title="Bústia d’idees">
        <p className="text-sm text-ink-muted -mt-2">Correus i telèfons es redacten automàticament. Revisa noms i altres detalls abans de publicar.{moderant > 0 && ` ${moderant} en moderació.`}</p>
        {error && <p role="alert">{error}</p>}
        {ideas.length === 0 && <p className="text-sm text-ink-muted bg-cream rounded-[12px] p-3">Encara no hi ha idees noves. Prova-ho des de l’app del treballador (La Plaça → Deixa una idea).</p>}
        <div className="flex flex-col gap-2">
          {ideas.map(i => (
            <div key={i.id} className="border border-cream-dk rounded-[12px] p-3 flex flex-col gap-1.5">
              <div className="flex justify-between gap-2 items-center"><span className="chip bg-cream text-ink-soft">{i.category}</span><span className={i.status === 'moderant' ? 'chip bg-warn-bg text-warn-ink' : 'chip bg-ok-bg text-ok-ink'}>{i.status === 'moderant' ? 'En moderació' : 'Publicada al tema'}</span></div>
              <p className="text-[13.5px] leading-snug">{i.text}</p>
              <p className="text-xs">Estat: {i.status}</p>
              {i.status === 'moderant' && <div className="flex gap-2"><button disabled={busy} className="btn-ink" onClick={() => void moderate(i.id, 'published')}>Publicar</button><button disabled={busy} className="btn-line" onClick={() => void moderate(i.id, 'rejected')}>Rebutjar</button></div>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

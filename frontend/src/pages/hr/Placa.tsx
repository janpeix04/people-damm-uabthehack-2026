import {useSearchParams} from 'react-router-dom'
import { useEffect, useState } from 'react'
import { hrPlazaCall } from '../../api/plaza'
import type { Idea } from '../../data/types'
import { Inbox, MessageCircle } from 'lucide-react'
import { Scene3D } from '../../components/Scene3D'
import { BeerMenuModal, TopicsModal } from '../../components/Panels'
import { Modal } from '../../components/ui'
import { useApp } from '../../store/AppContext'

const IDEA_STATUS:Record<Idea['status'],{label:string;className:string}>={
  moderant:{label:'En moderació',className:'bg-warn-bg text-warn-ink'},
  publicada:{label:'Publicada',className:'bg-ok-bg text-ok-ink'},
  rebutjada:{label:'Rebutjada',className:'bg-red-soft text-red-dk'},
  arxivada:{label:'Arxivada',className:'bg-cream text-ink-muted'},
}

/** La Plaça vista per RRHH: l'escena a pantalla completa amb els controls flotant a sobre. */
export default function HRPlaca() {
  const [params]=useSearchParams()
  const site=params.get('centre')||''
  const { ideas: publishedIdeas, toast, refreshPlaza } = useApp()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const refreshIdeas = async () => {
    try { setIdeas(await hrPlazaCall<Idea[]>({ action: 'list',site })); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error de connexió') }
  }
  const moderate = async (id: string, status: string) => {
    setBusy(true)
    try { setIdeas(await hrPlazaCall<Idea[]>({ action: 'moderate', id, status,site })); await refreshPlaza(); setError(null) }
    catch (e) { setError(e instanceof Error ? e.message : 'Error') }
    finally { setBusy(false) }
  }
  const [modal, setModal] = useState<'topics' | 'ideas' | 'bar' | null>(null)
  useEffect(() => { void refreshIdeas() }, [modal,site])
  const moderant = ideas.filter(i => i.status === 'moderant').length

  return (
    <div className="relative h-full min-h-0 overflow-hidden">
      <Scene3D kind="plaza" className="absolute inset-0" ariaLabel="La Plaça en 3D: font, terrassa, barra de cerveses, parada de l’enquesta i persones conversant"
        topics={publishedIdeas} readOnly
        onAction={a => (a === 'stage' ? setModal('bar') : a === 'idea' ? setModal('ideas') : toast('Vista de RRHH: les enquestes les responen els treballadors'))} />

      <div className="absolute left-3 right-3 bottom-3 sm:bottom-4 flex flex-wrap justify-center gap-2">
        <button onClick={() => setModal('topics')} className="btn-line !h-[52px] !rounded-[18px] shadow-lift"><MessageCircle size={18} className="text-rain" aria-hidden /><span>Temes<span className="hidden sm:inline"> de la setmana</span></span></button>
        <button onClick={() => { void refreshIdeas(); setModal('ideas') }} className="btn-ink !h-[52px] !rounded-[18px] shadow-lift">
          <Inbox size={18} aria-hidden />Bústia d’idees
          {ideas.length > 0 && <span className="min-w-[22px] h-[22px] px-1.5 rounded-full bg-red text-white text-xs font-bold grid place-items-center">{ideas.length}</span>}
        </button>
      </div>

      <p className="hidden xl:block absolute left-4 bottom-4 max-w-[250px] text-[11.5px] leading-snug text-ink-soft bg-paper/85 rounded-[12px] px-2.5 py-2">Personatges il·lustratius: no representen ningú real. Les bafarades mostren temes agregats i moderats. Dades sintètiques.</p>

      <TopicsModal open={modal === 'topics'} onClose={() => setModal(null)} />
      <BeerMenuModal open={modal === 'bar'} onClose={() => setModal(null)} />
      <Modal open={modal === 'ideas'} onClose={() => setModal(null)} title="Bústia d’idees">
        <p className="text-sm text-ink-muted -mt-2">Correus i telèfons es redacten automàticament. Revisa noms i altres detalls abans de publicar.{moderant > 0 && ` ${moderant} en moderació.`}</p>
        {error && <p role="alert">{error}</p>}
        {ideas.length === 0 && <p className="text-sm text-ink-muted bg-cream rounded-[12px] p-3">Encara no hi ha idees noves. Prova-ho des de l’app del treballador (La Plaça → Deixa una idea).</p>}
        <div className="flex flex-col gap-2">
          {ideas.map(i => (
            <div key={i.id} className="border border-cream-dk rounded-[12px] p-3 flex flex-col gap-1.5">
              <div className="flex justify-between gap-2 items-center"><span className="chip bg-cream text-ink-soft">{i.category}</span><span className={`chip ${IDEA_STATUS[i.status].className}`}>{IDEA_STATUS[i.status].label}</span></div>
              <p className="text-[13.5px] leading-snug">{i.text}</p>
              {i.status === 'moderant' && <div className="flex gap-2"><button disabled={busy} className="btn-ink" onClick={() => void moderate(i.id, 'published')}>Publicar</button><button disabled={busy} className="btn-line" onClick={() => void moderate(i.id, 'rejected')}>Rebutjar</button></div>}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}

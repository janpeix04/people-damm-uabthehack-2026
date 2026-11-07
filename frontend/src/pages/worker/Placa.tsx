import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Mail, MessageCircle, UserRound } from 'lucide-react'
import { Scene3D } from '../../components/Scene3D'
import { AvatarModal, FestaMilestones, IdeaModal, TopicsModal } from '../../components/Panels'
import { Meter } from '../../components/ui'
import { useApp } from '../../store/AppContext'
import type { SceneHandle } from '../../three/engine.js'

export default function WorkerPlaca() {
  const nav = useNavigate()
  const { pending, avatar, festa, toast } = useApp()
  const scene = useRef<SceneHandle | null>(null)
  const [modal, setModal] = useState<'idea' | 'topics' | 'avatar' | null>(null)
  const next = pending[0]
  const goSurvey = () => (next ? nav(`/e/${next.id}`) : toast('No tens cap enquesta pendent. Gràcies!'))

  return (
    <div className="relative h-[calc(100dvh-84px)]">
      <Scene3D ref={scene} kind="plaza" avatar={avatar} className="absolute inset-0" ariaLabel="La Plaça en 3D: font, terrassa, parada de l’enquesta i persones conversant"
        surveyTag={next ? `Enquesta nova · ${next.questions.reduce((a, q) => a + q.secs, 0)} s` : undefined}
        onAction={a => (a === 'survey' ? goSurvey() : a === 'idea' ? setModal('idea') : toast('El concert s’obre quan la plaça arribi al 60% de participació'))} />

      <div className="absolute left-3 right-3 top-3 flex gap-2 items-start pointer-events-none">
        <section className="pointer-events-auto bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-3 flex-1 max-w-[380px]" aria-label="Festa de la plaça">
          <div className="flex justify-between items-baseline"><h1 className="serif text-[19px]">Festa de la plaça</h1><strong className="text-sm tabular-nums">{Math.round(festa.pct)}%</strong></div>
          <Meter value={festa.pct} goal={festa.goal} className="mt-2" />
          <p className="text-[12px] text-ink-muted mt-1.5">{festa.missing > 0 ? `Falten ${festa.missing} respostes per al concert` : 'Concert desbloquejat!'}</p>
          <div className="hidden sm:block"><FestaMilestones /></div>
        </section>
        <button onClick={() => setModal('avatar')} aria-label="El teu personatge" className="pointer-events-auto ml-auto w-12 h-12 rounded-[16px] bg-paper/95 border border-line shadow-lift grid place-items-center"><UserRound size={22} /></button>
      </div>

      <div className="absolute left-3 right-3 bottom-3 flex flex-wrap justify-center gap-2">
        <button onClick={goSurvey} className="btn-red !h-[52px] !px-5 !text-[15px] !rounded-[18px]"><ClipboardCheck size={20} aria-hidden />{next ? 'Respon l’enquesta' : 'Cap enquesta pendent'}</button>
        <button onClick={() => setModal('idea')} aria-label="Deixa una idea" className="btn-line !h-[52px] !rounded-[18px] shadow-lift"><Mail size={18} className="text-red" aria-hidden /><span className="hidden sm:inline">Deixa una idea</span></button>
        <button onClick={() => setModal('topics')} aria-label="Temes de la setmana" className="btn-line !h-[52px] !rounded-[18px] shadow-lift"><MessageCircle size={18} className="text-rain" aria-hidden /><span className="hidden sm:inline">Temes</span></button>
      </div>

      <p className="hidden xl:block absolute right-3 bottom-3 max-w-[230px] text-[11.5px] leading-snug text-ink-soft bg-paper/85 rounded-[12px] px-2.5 py-2"><strong className="text-ink">Mou-te:</strong> toca el terra per caminar, fletxes o WASD, botó dret per desplaçar la vista.</p>
      <p className="hidden xl:block absolute left-3 bottom-3 max-w-[240px] text-[11.5px] leading-snug text-ink-soft bg-paper/85 rounded-[12px] px-2.5 py-2">Personatges il·lustratius: no representen ningú real. Les bafarades mostren temes agregats i moderats.</p>

      <IdeaModal open={modal === 'idea'} onClose={() => setModal(null)} />
      <TopicsModal open={modal === 'topics'} onClose={() => setModal(null)} />
      <AvatarModal open={modal === 'avatar'} onClose={() => setModal(null)} />
    </div>
  )
}

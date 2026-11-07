import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipboardCheck, Mail, MessageCircle, MessageCircleQuestion, UserRound } from 'lucide-react'
import { Scene3D } from '../../components/Scene3D'
import { AvatarModal, DailyQuestion, FestaWeekPanel, IdeaModal, TopicsModal } from '../../components/Panels'
import { Modal } from '../../components/ui'
import { useApp } from '../../store/AppContext'
import type { SceneHandle } from '../../three/engine.js'

/**
 * La Plaça: opinions ràpides, no enquestes.
 * La Festa de la setmana compta persones que hi participen (pregunta del dia, +1 o idea) i es veu a l'escena:
 * garlandes al 25 %, bancs nous al 40 %, concert al 60 % i focs al 75 %.
 */
export default function WorkerPlaca() {
  const nav = useNavigate()
  const { pending, avatar, plazaWeek, reactTopic, toast } = useApp()
  const scene = useRef<SceneHandle | null>(null)
  const [modal, setModal] = useState<'idea' | 'topics' | 'avatar' | 'daily' | null>(null)
  const next = pending[0]
  const goSurvey = () => (next ? nav(`/e/${next.id}`) : toast('No tens cap enquesta pendent. Gràcies!'))
  const onStage = () => toast(plazaWeek.pct >= 60 ? 'El concert sona aquesta setmana gràcies a tothom qui ha opinat a La Plaça!' : 'El concert s’obre quan el 60% de la plantilla hagi participat a La Plaça aquesta setmana.')
  const answered = !!plazaWeek.myAnswer

  return (
    <div className="relative h-[calc(100dvh-65px-76px-env(safe-area-inset-bottom,0px))] md:h-[calc(100dvh-73px)]">
      <Scene3D ref={scene} kind="plaza" avatar={avatar} className="absolute inset-0" ariaLabel="La Plaça en 3D: font, terrassa, escenari i persones conversant"
        festa={plazaWeek.pct} reacted={plazaWeek.reacted} onReact={reactTopic}
        surveyTag={next ? `Enquesta nova · ${next.questions.reduce((a, q) => a + q.secs, 0)} s` : undefined}
        onAction={a => (a === 'survey' ? goSurvey() : a === 'idea' ? setModal('idea') : onStage())} />

      <div className="absolute left-3 top-3 w-[min(380px,calc(100%-80px))] flex flex-col gap-2 pointer-events-none">
        <FestaWeekPanel className="pointer-events-auto" />
        <div className="hidden lg:block pointer-events-auto bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-3.5"><DailyQuestion /></div>
      </div>
      <button onClick={() => setModal('avatar')} aria-label="El teu personatge" className="absolute right-3 top-3 w-12 h-12 rounded-[16px] bg-paper/95 border border-line shadow-lift grid place-items-center"><UserRound size={22} /></button>

      <div className="absolute left-3 right-3 bottom-3 flex flex-wrap justify-center gap-2">
        <button onClick={() => setModal('daily')} className={`lg:hidden ${answered ? 'btn-line shadow-lift' : 'btn-red'} !h-[52px] !px-5 !text-[15px] !rounded-[18px]`}>
          <MessageCircleQuestion size={20} aria-hidden />{answered ? 'Resultat d’avui' : 'Pregunta del dia'}
        </button>
        <button onClick={goSurvey} aria-label={next ? 'Respon l’enquesta' : 'Cap enquesta pendent'} className="btn-line lg:!bg-red lg:!text-white lg:!border-red !h-[52px] !rounded-[18px] shadow-lift">
          <ClipboardCheck size={19} aria-hidden /><span className="hidden lg:inline">{next ? 'Respon l’enquesta' : 'Cap enquesta pendent'}</span>
        </button>
        <button onClick={() => setModal('idea')} aria-label="Deixa una idea" className="btn-line !h-[52px] !rounded-[18px] shadow-lift"><Mail size={18} className="text-red" aria-hidden /><span className="hidden sm:inline">Deixa una idea</span></button>
        <button onClick={() => setModal('topics')} aria-label="Temes de la setmana" className="btn-line !h-[52px] !rounded-[18px] shadow-lift"><MessageCircle size={18} className="text-rain" aria-hidden /><span className="hidden sm:inline">Temes</span></button>
      </div>

      <p className="hidden xl:block absolute right-3 bottom-3 max-w-[230px] text-[11.5px] leading-snug text-ink-soft bg-paper/85 rounded-[12px] px-2.5 py-2"><strong className="text-ink">Mou-te:</strong> toca el terra per caminar, fletxes o WASD, botó dret per desplaçar la vista.</p>
      <p className="hidden xl:block absolute left-3 bottom-3 max-w-[240px] text-[11.5px] leading-snug text-ink-soft bg-paper/85 rounded-[12px] px-2.5 py-2">Personatges il·lustratius: no representen ningú real. Les bafarades mostren temes agregats i moderats.</p>

      <Modal open={modal === 'daily'} onClose={() => setModal(null)} title="La Plaça · avui"><DailyQuestion /></Modal>
      <IdeaModal open={modal === 'idea'} onClose={() => setModal(null)} />
      <TopicsModal open={modal === 'topics'} onClose={() => setModal(null)} />
      <AvatarModal open={modal === 'avatar'} onClose={() => setModal(null)} />
    </div>
  )
}

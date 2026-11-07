import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Scene3D, zonePins } from '../../components/Scene3D'
import { ZonePanel } from '../../components/Panels'
import { zoneByKey } from '../../data/mock'
import type { ZoneKey } from '../../data/types'
import { useApp } from '../../store/AppContext'
import { Meter } from '../../components/ui'

export default function WorkerWorld() {
  const nav = useNavigate()
  const { pending, toast } = useApp()
  const [zone, setZone] = useState<ZoneKey>('envasat')
  const [missions, setMissions] = useState(false)
  const z = zoneByKey('envasat')
  const go = () => (pending[0] ? nav(`/e/${pending[0].id}`) : toast('No tens cap enquesta pendent. Gràcies!'))
  return (
    <div className="relative h-[calc(100dvh-84px)]">
      <Scene3D kind="world" className="absolute inset-0" zones={zonePins()} initialZone={zone} onZone={k => setZone(k as ZoneKey)} ariaLabel="Damm World en 3D" />
      <div className="absolute left-3 right-3 top-3 flex gap-2 items-start pointer-events-none">
        <div className="pointer-events-auto bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-2.5"><h1 className="serif text-[24px] leading-none">Damm World</h1><p className="text-[11.5px] text-ink-muted mt-1">Toca una zona per veure com hi va</p></div>
        <button onClick={() => setMissions(m => !m)} aria-expanded={missions} className="pointer-events-auto ml-auto btn-ink !h-11 !rounded-[16px]">Missió{missions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>
      {missions && (
        <section className="absolute right-3 top-[72px] w-[min(340px,calc(100%-24px))] bg-ink text-white rounded-[22px] p-4 flex flex-col gap-2.5 shadow-lift">
          <div className="text-[11.5px] font-extrabold tracking-[.12em] uppercase text-[#E9D3A6]">Missió de l’equip</div>
          <div className="serif text-[22px] leading-tight">Que surti el sol a {z.name}</div>
          <Meter value={(z.participation / 60) * 100} thin className="!bg-white/20" />
          <div className="flex justify-between text-[12.5px] opacity-90"><span>Participació {z.participation}%</span><span>Objectiu 60%</span></div>
          <button onClick={go} className="btn-red !h-[48px]">Ajuda l’equip · enquesta de 45 s</button>
          <p className="text-[11.5px] opacity-80">Missions col·lectives: sense punts per resposta ni rànquings.</p>
        </section>
      )}
      <ZonePanel zone={zone} className="absolute left-3 right-3 bottom-3 sm:right-auto sm:w-[400px]" />
    </div>
  )
}

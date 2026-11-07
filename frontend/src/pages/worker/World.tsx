import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Scene3D, zonePins } from '../../components/Scene3D'
import { MissionsPanel, ZonePanel } from '../../components/Panels'
import { WEATHER } from '../../data/mock'
import type { ZoneKey } from '../../data/types'
import { useApp } from '../../store/AppContext'
import { PathIcon } from '../../components/ui'

export default function WorkerWorld() {
  const nav = useNavigate()
  const { pending, toast } = useApp()
  const [zone, setZone] = useState<ZoneKey>('envasat')
  const [missions, setMissions] = useState(false)
  const go = () => (pending[0] ? nav(`/e/${pending[0].id}`) : toast('No tens cap enquesta pendent. Gràcies!'))
  return (
    <div className="relative h-[calc(100dvh-84px)]">
      <Scene3D kind="world" className="absolute inset-0" zones={zonePins()} initialZone={zone} onZone={k => setZone(k as ZoneKey)} ariaLabel="Damm World en 3D" />

      <div className="absolute left-3 right-3 top-3 flex gap-2 items-start pointer-events-none">
        <div className="pointer-events-auto bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-2.5 flex items-center gap-3">
          <div><h1 className="serif text-[24px] leading-none">Damm World</h1><p className="text-[11.5px] text-ink-muted mt-1">Toca una zona per veure com hi va</p></div>
          <span className="hidden sm:flex items-center gap-2 border-l border-line pl-3 text-xs text-ink-muted"><PathIcon d={WEATHER.part.path} size={22} color={WEATHER.part.ink} /><span><strong className="serif text-xl text-ink font-normal">6,5</strong> clima general</span></span>
        </div>
        <button onClick={() => setMissions(m => !m)} aria-expanded={missions} className="lg:hidden pointer-events-auto ml-auto btn-ink !h-11 !rounded-[16px]">Missions{missions ? <ChevronUp size={16} /> : <ChevronDown size={16} />}</button>
      </div>

      <MissionsPanel onSurvey={go} className={`absolute right-3 top-[76px] lg:top-3 w-[min(330px,calc(100%-24px))] max-h-[calc(100%-100px)] overflow-y-auto ${missions ? 'flex' : 'hidden lg:flex'}`} />
      <ZonePanel zone={zone} className="absolute left-3 right-3 bottom-3 sm:right-auto sm:w-[400px]" />
      <div className="hidden xl:flex absolute left-1/2 -translate-x-1/2 bottom-3 gap-3.5 bg-paper/90 rounded-full px-4 py-2 text-xs font-semibold pointer-events-none">
        <span>Sol: favorable</span><span>Núvols: atenció</span><span>Pluja: risc</span><span>Boira: dades insuficients</span>
      </div>
    </div>
  )
}

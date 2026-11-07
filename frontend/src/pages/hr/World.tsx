import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Scene3D, zonePins } from '../../components/Scene3D'
import { ZonePanel } from '../../components/Panels'
import { MOODS } from '../../data/mock'
import type { ZoneKey } from '../../data/types'

// colors tal com es veuen els fars a l'escena
const BEACON = { happy: '#2E9E5B', uneasy: '#E3A21A', stressed: '#D83A2E', nodata: '#9AA3AE' }

export default function HRWorld() {
  const [q] = useSearchParams()
  const [zone, setZone] = useState<ZoneKey>((q.get('zona') as ZoneKey) || 'envasat')
  return (
    <div className="relative h-[calc(100dvh-64px)] lg:h-[100dvh]">
      <Scene3D kind="world" className="absolute inset-0" zones={zonePins()} initialZone={zone} onZone={z => setZone(z as ZoneKey)} ariaLabel="Damm World: fàbrica de cervesa en 3D amb un far al terrat de cada departament que indica l’emoció predominant, la participació i si hi ha alertes" />
      <div className="absolute left-4 top-4 bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-3 pointer-events-none">
        <h1 className="serif text-[26px] leading-none">Damm World</h1>
        <p className="text-xs text-ink-muted mt-1">Arrossega per girar · roda o dos dits per apropar-te · toca una zona</p>
      </div>
      <ZonePanel hr zone={zone} className="absolute left-4 right-4 bottom-4 sm:right-auto sm:w-[420px]" />
      <div className="hidden xl:flex flex-col gap-1.5 absolute right-4 bottom-4 bg-paper/90 rounded-[16px] px-4 py-2.5 text-xs font-semibold pointer-events-none">
        <div className="flex gap-3"><span className="text-ink-muted">Far:</span>{(['happy', 'uneasy', 'stressed', 'nodata'] as const).map(w => <span key={w} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: BEACON[w] }} />{MOODS[w].label}</span>)}</div>
        <div className="flex gap-3 text-ink-soft"><span>Got = participació (marca vermella: 60%)</span><span>⚠ = hi ha alertes</span></div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Scene3D, zonePins } from '../../components/Scene3D'
import { ZonePanel } from '../../components/Panels'
import { MOODS } from '../../data/mock'
import type { ZoneKey } from '../../data/types'

export default function HRWorld() {
  const [q] = useSearchParams()
  const [zone, setZone] = useState<ZoneKey>((q.get('zona') as ZoneKey) || 'envasat')
  return (
    <div className="relative h-[calc(100dvh-64px)] lg:h-screen">
      <Scene3D kind="world" className="absolute inset-0" zones={zonePins()} initialZone={zone} onZone={z => setZone(z as ZoneKey)} ariaLabel="Damm World: fàbrica de cervesa en 3D amb l’emoció predominant de cada equip" />
      <div className="absolute left-4 top-4 bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-3 pointer-events-none">
        <h1 className="serif text-[26px] leading-none">Damm World</h1>
        <p className="text-xs text-ink-muted mt-1">Arrossega per girar · roda o dos dits per apropar-te · toca una zona</p>
      </div>
      <ZonePanel hr zone={zone} className="absolute left-4 right-4 bottom-4 sm:right-auto sm:w-[420px]" />
      <div className="hidden xl:flex absolute right-4 bottom-4 gap-3 bg-paper/90 rounded-full px-4 py-2 text-xs font-semibold pointer-events-none">
        {(['happy', 'uneasy', 'stressed', 'nodata'] as const).map(w => <span key={w} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: MOODS[w].ink }} />{MOODS[w].label}</span>)}
      </div>
    </div>
  )
}

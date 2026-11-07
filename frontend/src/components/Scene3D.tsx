import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { mountScene, webglAvailable, type MountOptions, type SceneHandle } from '../three/engine.js'
import { HAIRS, SHIRTS, SKINS, WEATHER, ZONES } from '../data/mock'
import type { Avatar } from '../data/types'

export const avatarColors = (a: Avatar) => ({ skin: SKINS[a.skin], hair: HAIRS[a.hair], shirt: SHIRTS[a.shirt], style: a.style, logo: a.logo })

export const zonePins = () => ZONES.map(z => ({
  key: z.key,
  name: z.name,
  score: z.score != null ? z.score.toLocaleString('ca-ES', { minimumFractionDigits: 1 }) : z.key === 'jardi' ? '60%' : '?',
  weatherLabel: z.weatherLabel,
  bg: WEATHER[z.weather].bg,
  ink: WEATHER[z.weather].ink,
  path: WEATHER[z.weather].path,
}))

interface Props extends Omit<MountOptions, 'avatar'> {
  kind: 'plaza' | 'world'
  avatar?: Avatar
  className?: string
}

/** Contenidor de l'escena 3D. El motor es munta en entrar i s'allibera en sortir. */
export const Scene3D = forwardRef<SceneHandle | null, Props>(function Scene3D({ kind, avatar, className, ...opts }, ref) {
  const box = useRef<HTMLDivElement>(null)
  const handle = useRef<SceneHandle | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const [state, setState] = useState<'loading' | 'ready' | 'nogl'>('loading')

  useImperativeHandle(ref, () => handle.current as SceneHandle, [state])

  useEffect(() => {
    if (!webglAvailable()) { setState('nogl'); return }
    let cancelled = false
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve()
    Promise.race([fonts, new Promise(r => setTimeout(r, 1500))]).then(() => {
      // deixem pintar el missatge de càrrega abans de construir l'escena
      setTimeout(() => {
        if (cancelled || !box.current) return
        handle.current = mountScene(box.current, kind, {
          ...optsRef.current,
          avatar: avatar ? avatarColors(avatar) : undefined,
          onAction: a => optsRef.current.onAction?.(a),
          onZone: z => optsRef.current.onZone?.(z),
        })
        setState('ready')
      }, 30)
    })
    return () => { cancelled = true; handle.current?.dispose(); handle.current = null }
    // l'escena només es munta un cop per pantalla
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind])

  useEffect(() => { if (avatar && handle.current) handle.current.setAvatar(avatarColors(avatar)) }, [avatar])

  return (
    <div ref={box} className={className} style={{ position: 'relative', overflow: 'hidden', background: kind === 'world' ? '#9FC4D4' : '#CFE2EA' }}>
      {state === 'loading' && <div className="absolute inset-0 grid place-items-center serif text-2xl text-ink bg-cream z-10">{kind === 'plaza' ? 'Construint la plaça…' : 'Construint Damm World…'}</div>}
      {state === 'nogl' && <div className="absolute inset-0 grid place-items-center p-6 text-center text-ink-muted bg-cream z-10">Aquest navegador no permet gràfics 3D. Pots fer servir la resta de l’app amb normalitat.</div>}
    </div>
  )
})

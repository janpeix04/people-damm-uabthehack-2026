import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Globe } from 'lucide-react'
import { LANGS, useI18n } from '../i18n'
import { cn } from './ui'

/** Selector segmentat CA · ES · EN (barra lateral desplegada i franja mòbil). */
export function LanguageSegmented({ className, showLabel = true }: { className?: string; showLabel?: boolean }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {showLabel && <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-muted"><Globe size={15} aria-hidden />{t('common.language')}</span>}
      <div role="radiogroup" aria-label={t('common.language')} className="flex flex-1 rounded-[10px] bg-cream p-0.5">
        {LANGS.map(l => (
          <button
            key={l.code}
            type="button"
            role="radio"
            aria-checked={lang === l.code}
            lang={l.code}
            title={l.label}
            aria-label={l.label}
            onClick={() => setLang(l.code)}
            className={cn('flex-1 min-w-[38px] h-8 px-2 rounded-[8px] text-[12px] font-bold transition', lang === l.code ? 'bg-paper text-red-dk shadow-card' : 'text-ink-muted hover:text-ink')}
          >
            {l.short}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Menú desplegable compacte (globus + codi). Per a capçaleres i la barra lateral plegada. */
export function LanguageMenu({ className, placement = 'down', align = 'right', iconOnly = false }: { className?: string; placement?: 'up' | 'down'; align?: 'left' | 'right'; iconOnly?: boolean }) {
  const { lang, setLang, t } = useI18n()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<CSSProperties>({})
  const currentLang = LANGS.find(l => l.code === lang)!

  // El menú es renderitza en un portal amb posició fixa perquè no el retalli cap contenidor amb overflow (p. ex. la barra lateral).
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const r = ref.current?.getBoundingClientRect()
      if (!r) return
      const gap = 8
      setPos({
        ...(placement === 'up' ? { bottom: window.innerHeight - r.top + gap } : { top: r.bottom + gap }),
        ...(align === 'right' ? { right: window.innerWidth - r.right } : { left: r.left }),
      })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true) }
  }, [open, placement, align])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!ref.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${t('common.language')}: ${currentLang.label}`}
        title={t('common.language')}
        className={cn('grid grid-flow-col auto-cols-max place-items-center gap-1.5 rounded-[12px] text-ink-soft hover:bg-cream transition', iconOnly ? 'w-11 h-11 justify-center' : 'h-10 px-2.5 text-[13px] font-bold')}
      >
        <Globe size={iconOnly ? 20 : 17} aria-hidden />
        {!iconOnly && <>{currentLang.short}<ChevronDown size={14} aria-hidden className={cn('transition-transform', open && 'rotate-180')} /></>}
      </button>
      {open && createPortal(
        <div ref={menuRef} role="menu" style={pos} className="fixed z-[100] min-w-[168px] rounded-[14px] border border-line bg-paper p-1 shadow-lift">
          {LANGS.map(l => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={lang === l.code}
              lang={l.code}
              onClick={() => { setLang(l.code); setOpen(false) }}
              className={cn('w-full flex items-center gap-2.5 rounded-[10px] px-3 py-2 text-left text-[14px] font-semibold', lang === l.code ? 'bg-red-soft text-red-dk' : 'text-ink-soft hover:bg-cream')}
            >
              <span className="w-7 text-[11px] font-bold text-ink-muted">{l.short}</span>
              <span className="flex-1">{l.label}</span>
              {lang === l.code && <Check size={16} aria-hidden />}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}

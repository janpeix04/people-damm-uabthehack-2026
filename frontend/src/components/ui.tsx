import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { MOODS } from '../data/mock'
import type { Mood } from '../data/types'
import { useApp } from '../store/AppContext'

export const cn = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ')
export const fmt = (n: number, d = 1) => n.toLocaleString('ca-ES', { minimumFractionDigits: d, maximumFractionDigits: d })

/** Logotip de People Damm. `light` el mostra en blanc sobre fons de color. */
export function Logo({ size = 'md', light, className }: { size?: 'sm' | 'md' | 'lg' | 'full'; light?: boolean; className?: string }) {
  return (
    <img
      src="/logo-people-damm.png"
      alt="People Damm"
      draggable={false}
      className={cn(
        'shrink-0 select-none',
        size === 'full' ? 'w-full h-auto' : size === 'sm' ? 'w-auto h-[34px]' : size === 'md' ? 'w-auto h-[44px]' : 'w-auto h-[110px] sm:h-[140px]',
        light && 'brightness-0 invert',
        className,
      )}
    />
  )
}

export function Brand() {
  return <Logo />
}

export function PathIcon({ d, size = 20, color = 'currentColor', stroke = 2, className }: { d: string; size?: number; color?: string; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={d} />
    </svg>
  )
}

export function MoodBadge({ w, size = 46, icon = 24 }: { w: Mood; size?: number; icon?: number }) {
  const m = MOODS[w]
  return (
    <span className="grid place-items-center rounded-[14px] shrink-0" style={{ width: size, height: size, background: m.bg }}>
      <PathIcon d={m.path} size={icon} color={m.ink} />
    </span>
  )
}

export function Meter({ value, goal, className, thin }: { value: number; goal?: number; className?: string; thin?: boolean }) {
  return (
    <div className={cn('relative rounded-full bg-cream-dk', thin ? 'h-2' : 'h-3', className)} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
      <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-wine to-red transition-[width] duration-700" style={{ width: `${Math.min(100, value)}%` }} />
      {goal != null && <div className="absolute -top-1 -bottom-1 w-0.5 bg-ink rounded" style={{ left: `${goal}%` }} />}
    </div>
  )
}

export function FestaCard({ compact }: { compact?: boolean }) {
  const { festa } = useApp()
  return (
    <section className={cn('card flex flex-col gap-2', compact ? 'p-4' : 'p-5')} aria-label="Objectiu col·lectiu">
      <div className="flex justify-between items-baseline gap-2">
        <h2 className={cn('serif', compact ? 'text-[19px]' : 'text-[21px]')}>Festa de la plaça</h2>
        <strong className="text-sm tabular-nums">{Math.round(festa.pct)}%</strong>
      </div>
      <Meter value={festa.pct} goal={festa.goal} />
      <p className="text-[12.5px] text-ink-muted">
        {festa.missing > 0 ? <>Objectiu col·lectiu del 60% · falten <strong className="text-ink">{festa.missing}</strong> respostes per al concert</> : 'Concert desbloquejat!'}
      </p>
    </section>
  )
}

export function PrivacyNote({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-2.5 items-start rounded-[14px] bg-ok-bg text-ok-ink px-3 py-2.5 text-[12.5px] leading-snug', className)}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0 mt-px"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
      <span>{children}</span>
    </div>
  )
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    setTimeout(() => ref.current?.querySelector<HTMLElement>('button, textarea, input, a')?.focus(), 30)
    return () => prev?.focus?.()
  }, [open])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-3 sm:p-4 bg-[rgba(25,15,10,.42)]" onMouseDown={e => e.target === e.currentTarget && onClose()} onKeyDown={e => e.key === 'Escape' && onClose()}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} className={cn('bg-paper rounded-[24px] shadow-lift w-full max-h-[calc(100%-24px)] overflow-y-auto scroll-thin p-6 flex flex-col gap-4', wide ? 'max-w-2xl' : 'max-w-[540px]')}>
        <div className="flex justify-between items-center gap-3">
          <h2 className="serif text-[28px] leading-tight">{title}</h2>
          <button className="w-11 h-11 rounded-[14px] bg-cream grid place-items-center" onClick={onClose} aria-label="Tancar"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export const FACES: [string, string, string][] = [
  ['Molt bé', '#D7F0DE', 'M13 26 Q22 35 31 26'],
  ['Bé', '#E8F6EC', 'M15 27 Q22 31 29 27'],
  ['Normal', '#F1EEE8', 'M15 29 L29 29'],
  ['Malament', '#FBEEDD', 'M15 30 Q22 27 29 30'],
  ['Molt malament', '#FBE3E6', 'M14 31 Q22 24 30 31'],
]
export function Face({ i, size = 40 }: { i: number; size?: number }) {
  const f = FACES[i]
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden>
      <circle cx="22" cy="22" r="20" fill={f[1]} />
      <circle cx="15.5" cy="18" r="2.4" fill="#1F1A18" />
      <circle cx="28.5" cy="18" r="2.4" fill="#1F1A18" />
      <path d={f[2]} stroke="#1F1A18" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </svg>
  )
}

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    open: 'bg-ok-bg text-ok-ink', scheduled: 'bg-red-soft text-red-dk', draft: 'bg-cream-dk text-ink-soft', closed: 'bg-fog-bg text-fog',
  }
  const label: Record<string, string> = { open: 'Oberta', scheduled: 'Programada', draft: 'Esborrany', closed: 'Tancada' }
  return <span className={cn('chip', map[status])}>{label[status] ?? status}</span>
}

export const toneBg = (t: 'pos' | 'neg' | 'neu') => (t === 'pos' ? '#E3ECF8' : t === 'neg' ? '#FBEEDD' : '#EFE9E1')

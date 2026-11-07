import { useState } from 'react'
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, Factory, Home, Menu, MessageCircle, Sparkles, X } from 'lucide-react'
import { Brand, Logo, cn } from './ui'
import { useApp } from '../store/AppContext'

const NAV = [
  { to: '/rrhh', label: 'Inici', icon: Home, end: true },
  { to: '/rrhh/enquestes', label: 'Enquestes', icon: ClipboardList },
  { to: '/rrhh/crear', label: 'Crear enquesta', icon: Sparkles, tag: 'IA' },
  { to: '/rrhh/analisi', label: 'Anàlisi i insights', icon: BarChart3 },
  { to: '/rrhh/world', label: 'Damm World', icon: Factory, tag: '3D' },
  { to: '/rrhh/placa', label: 'La Plaça', icon: MessageCircle, tag: '3D' },
]

export default function HRLayout() {
  const [open, setOpen] = useState(false)
  const { surveys } = useApp()
  const loc = useLocation()
  const active = surveys.filter(s => s.status === 'open').length

  const nav = (
    <nav aria-label="Portal RRHH" className="flex flex-col gap-0.5">
      {NAV.map(n => (
        <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
          className={({ isActive }) => cn('flex items-center gap-3 px-3 py-2.5 rounded-[12px] text-[14.5px] font-semibold transition', isActive ? 'bg-red text-white' : 'text-ink-soft hover:bg-cream')}>
          {({ isActive }) => (<>
            <n.icon size={19} strokeWidth={2} aria-hidden />
            <span className="flex-1">{n.label}</span>
            {n.to === '/rrhh/enquestes' && active > 0 && <span className={cn('text-[11px] font-bold', isActive ? 'text-white' : 'text-red-dk')}>{active} actives</span>}
            {n.tag && <span className={cn('text-[11px] font-bold', isActive ? 'text-white' : 'text-red-dk')}>{n.tag}</span>}
          </>)}
        </NavLink>
      ))}
    </nav>
  )

  const footer = (
    <div className="mt-auto flex flex-col gap-3">
      <Link to="/app" className="flex items-center justify-between px-3.5 py-3 rounded-[14px] bg-cream text-[13.5px] font-bold">Veure com a treballador <span aria-hidden>→</span></Link>
    </div>
  )

  const fullBleed = loc.pathname.startsWith('/rrhh/world') || loc.pathname.startsWith('/rrhh/placa')

  return (
    <div className="min-h-full flex">
      <aside className="hidden lg:flex w-[264px] shrink-0 flex-col gap-6 bg-paper border-r border-line px-4 py-5 sticky top-0 h-screen overflow-y-auto scroll-thin">
        <div className="px-1.5 flex justify-center"><div className="w-[110px]"><Logo size="full" /></div></div>
        {nav}
        {footer}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line flex items-center justify-between px-4 h-16">
          <Brand />
          <button className="w-11 h-11 grid place-items-center rounded-[12px] bg-cream" onClick={() => setOpen(true)} aria-label="Obrir el menú"><Menu size={22} /></button>
        </header>
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}>
            <div className="absolute right-0 top-0 h-full w-[290px] max-w-[85vw] bg-paper p-4 flex flex-col gap-5 overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center"><span className="serif text-xl">Menú</span><button className="w-10 h-10 grid place-items-center rounded-[12px] bg-cream" onClick={() => setOpen(false)} aria-label="Tancar el menú"><X size={20} /></button></div>
              {nav}
              {footer}
            </div>
          </div>
        )}
        <main className={cn('flex-1 min-w-0', !fullBleed && 'px-4 sm:px-6 lg:px-9 py-6 lg:py-7')}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function PageHead({ eyebrow, title, sub, actions }: { eyebrow?: string; title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div className="min-w-0">
        {eyebrow && <div className="eyebrow !text-red mb-1.5">{eyebrow}</div>}
        <h1 className="serif text-[32px] sm:text-[36px] leading-[1.05]">{title}</h1>
        {sub && <p className="text-[15px] text-ink-muted mt-1.5 max-w-2xl">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  )
}

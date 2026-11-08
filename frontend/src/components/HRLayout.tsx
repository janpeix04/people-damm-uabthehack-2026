import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { BarChart3, ClipboardList, Factory, Home, Menu, MessageCircle, MessagesSquare, PanelLeftClose, PanelLeftOpen, Sparkles, X } from 'lucide-react'
import { Brand, Logo, cn } from './ui'
import { useApp } from '../store/AppContext'
import { SessionButton } from '../store/AuthContext'
import UserSite from './UserSite'
import { LanguageMenu, LanguageSegmented } from './LanguageSwitcher'
import { useT } from '../i18n'

const NAV = [
  { to: '/rrhh', label: 'common.navHome', icon: Home, end: true },
  { to: '/rrhh/enquestes', label: 'common.navSurveys', icon: ClipboardList },
  { to: '/rrhh/crear', label: 'common.navCreate', icon: Sparkles, tag: 'IA' },
  { to: '/rrhh/analisi', label: 'common.navAnalysis', icon: BarChart3 },
  { to: '/rrhh/directori', label: 'common.navDirectory', icon: MessagesSquare },
  { to: '/rrhh/world', label: 'common.navWorld', icon: Factory, tag: '3D' },
  { to: '/rrhh/placa', label: 'common.navPlaza', icon: MessageCircle, tag: '3D' },
]

export default function HRLayout() {
  const t = useT()
  const [open, setOpen] = useState(false)
  // barra lateral plegable a l'ordinador (es recorda entre visites)
  const [mini, setMini] = useState(() => { try { return localStorage.getItem('damm-hr-sidebar') === 'mini' } catch { return false } })
  useEffect(() => { try { localStorage.setItem('damm-hr-sidebar', mini ? 'mini' : 'full') } catch { /* sense emmagatzematge */ } }, [mini])
  const { hrSurveys: surveys } = useApp()
  const loc = useLocation()
  const active = surveys.filter(s => s.status === 'open').length

  // `compact` = barra plegada. L'estructura és la mateixa en tots dos estats perquè l'animació
  // d'amplada sigui fluida: la icona no es mou i el text (nowrap) es retalla i s'esvaeix.
  const nav = (compact = false) => (
    <nav aria-label={t('common.hrNavAria')} className="flex flex-col gap-0.5">
      {NAV.map(n => (
        <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)} title={compact ? t(n.label) : undefined} aria-label={compact ? t(n.label) : undefined}
          className={({ isActive }) => cn('flex items-center gap-3 h-11 px-3 rounded-[12px] overflow-hidden whitespace-nowrap text-[14.5px] font-semibold transition-colors', isActive ? 'bg-red text-white' : 'text-ink-soft hover:bg-cream')}>
          {({ isActive }) => (<>
            <n.icon size={20} strokeWidth={2} aria-hidden className="shrink-0" />
            <span className={cn('flex-1 min-w-0 flex items-center gap-2 transition-opacity', compact ? 'opacity-0 duration-150' : 'opacity-100 duration-300 delay-100')} aria-hidden={compact || undefined}>
              <span className="flex-1">{t(n.label)}</span>
              {n.to === '/rrhh/enquestes' && active > 0 && <span className={cn('text-[11px] font-bold', isActive ? 'text-white' : 'text-red-dk')}>{t('common.activeCount', { count: active })}</span>}
              {n.tag && <span className={cn('text-[11px] font-bold', isActive ? 'text-white' : 'text-red-dk')}>{n.tag}</span>}
            </span>
          </>)}
        </NavLink>
      ))}
    </nav>
  )

  const fullBleed = loc.pathname.startsWith('/rrhh/world') || loc.pathname.startsWith('/rrhh/placa')

  return (
    <div className={cn('flex bg-cream', fullBleed ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]')}>
      <div className="hidden lg:block shrink-0 sticky top-0 h-[100dvh] z-20">
        <aside className={cn('h-full flex flex-col gap-6 bg-paper border-r border-line py-5 px-4 overflow-x-hidden overflow-y-auto scroll-thin transition-[width] duration-300 ease-[cubic-bezier(.23,1,.32,1)]', mini ? 'w-[76px]' : 'w-[264px]')}>
          {/* Logotip: es fonen el complet i el petit, sense canviar de mida bruscament */}
          <div className="relative h-[62px] shrink-0">
            <div className={cn('absolute left-0 top-0 w-[232px] flex justify-center transition-opacity', mini ? 'opacity-0 duration-150' : 'opacity-100 duration-300 delay-100')} aria-hidden={mini || undefined}><div className="w-[110px]"><Logo size="full" /></div></div>
            <div className={cn('absolute left-0 top-0 w-11 h-full flex items-center justify-center transition-opacity', mini ? 'opacity-100 duration-300 delay-100' : 'opacity-0 duration-150')} aria-hidden={!mini || undefined}><Logo size="sm" className="max-w-none" /></div>
          </div>
          {nav(mini)}
          {/* Botó de plegar / desplegar (només icona), just a sobre del selector d'idioma */}
          <button type="button" onClick={() => setMini(m => !m)} aria-label={mini ? t('common.expandMenu') : t('common.hideMenu')} aria-expanded={!mini} title={mini ? t('common.expandMenu') : t('common.hideMenu')}
            className="mt-auto -mb-3 h-11 px-3 shrink-0 flex items-center gap-3 rounded-[12px] overflow-hidden whitespace-nowrap text-[14px] font-semibold text-ink-muted hover:bg-cream hover:text-ink transition-colors">
            {mini ? <PanelLeftOpen size={20} aria-hidden className="shrink-0" /> : <PanelLeftClose size={20} aria-hidden className="shrink-0" />}
            <span className={cn('transition-opacity', mini ? 'opacity-0 duration-150' : 'opacity-100 duration-300 delay-100')} aria-hidden>{t('common.hideMenu')}</span>
          </button>
          <div className="relative pt-4 border-t border-line shrink-0 min-h-[60px]">
            <div className={cn('w-[232px] transition-[opacity,visibility]', mini ? 'opacity-0 invisible duration-150' : 'opacity-100 visible duration-300 delay-100')}><LanguageSegmented className="px-1" /></div>
            <div className={cn('absolute left-0 top-4 transition-[opacity,visibility]', mini ? 'opacity-100 visible duration-300 delay-100' : 'opacity-0 invisible duration-150')}><LanguageMenu iconOnly placement="up" align="left" /></div>
          </div>
        </aside>
        {/* Vora dreta: clic per plegar / desplegar la barra */}
        <button
          type="button"
          onClick={() => setMini(m => !m)}
          aria-label={mini ? t('common.expandMenu') : t('common.hideMenu')}
          aria-expanded={!mini}
          title={mini ? t('common.expandMenu') : t('common.hideMenu')}
          className="group absolute top-0 -right-1.5 h-full w-3 cursor-ew-resize focus-visible:outline-none"
        >
          <span className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] rounded-full bg-transparent transition-colors group-hover:bg-red/40 group-focus-visible:bg-red" />
        </button>
      </div>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <div className="shrink-0 bg-paper border-b border-line px-4 py-2 flex justify-between gap-3"><UserSite /><SessionButton /></div>
        <header className="lg:hidden shrink-0 sticky top-0 z-30 bg-paper/95 backdrop-blur border-b border-line flex items-center justify-between px-4 h-16">
          <Brand />
          <button className="w-11 h-11 grid place-items-center rounded-[12px] bg-cream" onClick={() => setOpen(true)} aria-label={t('common.openMenu')}><Menu size={22} /></button>
        </header>
        {open && (
          <div className="lg:hidden fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}>
            <div className="page-enter absolute right-0 top-0 h-full w-[300px] max-w-[88vw] bg-paper p-4 flex flex-col gap-5 overflow-y-auto shadow-lift" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center"><span className="serif text-xl">{t('common.menu')}</span><button className="w-10 h-10 grid place-items-center rounded-[12px] bg-cream" onClick={() => setOpen(false)} aria-label={t('common.closeMenu')}><X size={20} /></button></div>
              {nav()}
              <div className="mt-auto pt-4 border-t border-line"><LanguageSegmented /></div>
            </div>
          </div>
        )}
        <main className={cn('flex-1 min-w-0', fullBleed && 'min-h-0 overflow-hidden', !fullBleed && 'px-4 sm:px-6 lg:px-9 py-6 lg:py-7')}>
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

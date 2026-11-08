import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardCheck, ClipboardList, Gift, Heart, Home, MessageCircle } from 'lucide-react'
import { cn, Logo } from './ui'
import { useApp } from '../store/AppContext'
import { SessionButton } from '../store/AuthContext'
import UserSite from './UserSite'
import DailyMood from './DailyMood'
import { LanguageMenu, LanguageSegmented } from './LanguageSwitcher'
import { useT } from '../i18n'

const TABS: { to: string; label: string; Icon: typeof Home }[] = [
  { to: '/app', label: 'common.navHome', Icon: Home },
  { to: '/app/enquestes', label: 'common.navSurveys', Icon: ClipboardList },
  { to: '/app/placa', label: 'common.navPlaza', Icon: MessageCircle },
  { to: '/app/estat-anim', label: 'Estat d’ànim', Icon: Heart },
  { to: '/app/recompenses', label: 'common.navRewards', Icon: Gift },
]

/**
 * App del treballador: enquestes, La Plaça i recompenses.
 * Inclou La Plaça (3D); sense accés a Damm World.
 */
export default function WorkerLayout() {
  const t = useT()
  const { pending, points, toast } = useApp()
  const nav = useNavigate()
  const location = useLocation()
  const fullBleed = location.pathname.startsWith('/app/placa')
  const answerNext = () => (pending.length ? nav(`/e/${pending[0].id}`) : toast(t('common.noPending')))

  return (
    <DailyMood><div className={cn('worker-theme flex flex-col bg-cream', fullBleed ? 'h-[100dvh] overflow-hidden' : 'min-h-[100dvh]')}>
      <header className="sticky top-0 z-40 shrink-0 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto h-16 md:h-[72px] px-4 md:px-6 flex items-center gap-6">
          <Link to="/app" className="flex items-center gap-2.5 shrink-0" aria-label={t('common.homeAria')}>
            <Logo yellow />
          </Link>
          <nav aria-label={t('common.mainNav')} className="hidden md:flex items-center gap-1 flex-1">
            {TABS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => cn('h-10 px-3.5 rounded-[12px] grid place-items-center text-sm font-bold transition', isActive ? 'bg-red-soft text-red-dk' : 'text-ink-muted hover:bg-cream hover:text-ink')}>
                {t(label)}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <LanguageMenu className="hidden md:block" />
            <SessionButton />
            <Link to="/app/recompenses" className="h-10 px-3 rounded-full bg-ink text-white text-sm font-extrabold flex items-center gap-1.5 tabular-nums" aria-label={t('common.points', { count: points })}>
              <Gift size={16} color="#FFD27A" aria-hidden />{points}
            </Link>
            <button onClick={answerNext} className="hidden md:inline-flex btn-red !h-10">
              <ClipboardCheck size={18} aria-hidden />
              {pending.length ? t('common.answerCount', { count: pending.length }) : t('common.upToDate')}
            </button>
          </div>
        </div>
      </header>
      <div className="shrink-0 border-b border-line bg-paper px-4 md:px-6 py-2"><div className="max-w-6xl mx-auto flex items-center justify-between gap-3"><UserSite /><LanguageSegmented showLabel={false} className="md:hidden shrink-0 w-[132px]" /></div></div>

      <main className={cn('flex-1 min-h-0', fullBleed ? 'overflow-hidden pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-0' : 'pb-[96px] md:pb-0')}>
        <div key={location.pathname} className="page-enter h-full"><Outlet /></div>
      </main>

      <footer className={cn('border-t border-line bg-paper', fullBleed ? 'hidden' : 'hidden md:block')}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center gap-6 text-[13px] text-ink-muted">
          <span>{t('common.footerPrivacy')}</span>
          <span className="flex items-center gap-4 whitespace-nowrap">
            <span className="eyebrow">{t('common.internalAccess')}</span>
            <Link to="/" className="font-bold hover:text-ink">{t('common.demoHome')}</Link>
            <Link to="/rrhh" className="font-bold hover:text-ink">{t('common.managerPeople')}</Link>
          </span>
        </div>
      </footer>

      <nav aria-label={t('common.nav')} className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-paper border-t border-line" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-[560px] mx-auto h-[76px] grid grid-cols-6 items-center px-1.5">
          {TABS.slice(0, 2).map(t => <Tab key={t.to} {...t} />)}
          <button
            onClick={answerNext}
            aria-label={pending.length ? t('common.answerAria', { count: pending.length }) : t('common.noPendingAria')}
            className="flex flex-col items-center gap-1 text-[10.5px] font-bold text-red active:scale-95 transition-transform"
          >
            <span className="relative w-14 h-14 -mt-7 rounded-full bg-red grid place-items-center shadow-red">
              <ClipboardCheck size={24} color="#171717" aria-hidden />
              {pending.length > 0 && <span className="absolute -right-0.5 -top-0.5 w-5 h-5 rounded-full bg-ink text-white text-[10.5px] font-extrabold grid place-items-center border-2 border-paper">{pending.length}</span>}
            </span>
            {t('common.answer')}
          </button>
          {TABS.slice(2).map(t => <Tab key={t.to} {...t} />)}
        </div>
      </nav>
    </div></DailyMood>
  )
}

function Tab({ to, label, Icon }: { to: string; label: string; Icon: typeof Home }) {
  const t = useT()
  return (
    <NavLink to={to} end={to === '/app'} className={({ isActive }) => cn('flex flex-col items-center gap-1 text-[10.5px] font-bold', isActive ? 'text-red' : 'text-ink-muted')}>
      <Icon size={22} strokeWidth={2} aria-hidden />{t(label)}
    </NavLink>
  )
}

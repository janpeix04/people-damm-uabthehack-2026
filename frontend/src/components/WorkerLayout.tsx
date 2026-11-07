import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { ClipboardCheck, ClipboardList, Gift, Home, MessageCircle } from 'lucide-react'
import { cn, Logo } from './ui'
import { useApp } from '../store/AppContext'
import { SessionButton } from '../store/AuthContext'
import UserSite from './UserSite'

const TABS: { to: string; label: string; Icon: typeof Home }[] = [
  { to: '/app', label: 'Inici', Icon: Home },
  { to: '/app/enquestes', label: 'Enquestes', Icon: ClipboardList },
  { to: '/app/placa', label: 'La Plaça', Icon: MessageCircle },
  { to: '/app/recompenses', label: 'Recompenses', Icon: Gift },
]

/**
 * App del treballador: enquestes, La Plaça i recompenses.
 * Inclou La Plaça (3D); sense accés a Damm World.
 */
export default function WorkerLayout() {
  const { pending, points, toast } = useApp()
  const nav = useNavigate()
  const location = useLocation()
  const fullBleed = location.pathname.startsWith('/app/placa')
  const answerNext = () => (pending.length ? nav(`/e/${pending[0].id}`) : toast('No tens cap enquesta pendent. Gràcies!'))

  return (
    <div className={cn('flex flex-col bg-cream', fullBleed ? 'h-[100dvh]' : 'min-h-[100dvh]')}>
      <header className="sticky top-0 z-40 shrink-0 bg-paper/90 backdrop-blur border-b border-line">
        <div className="max-w-6xl mx-auto h-16 md:h-[72px] px-4 md:px-6 flex items-center gap-6">
          <Link to="/app" className="flex items-center gap-2.5 shrink-0" aria-label="People Damm, inici">
            <Logo />
          </Link>
          <nav aria-label="Navegació principal" className="hidden md:flex items-center gap-1 flex-1">
            {TABS.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/app'} className={({ isActive }) => cn('h-10 px-3.5 rounded-[12px] grid place-items-center text-sm font-bold transition', isActive ? 'bg-red-soft text-red-dk' : 'text-ink-muted hover:bg-cream hover:text-ink')}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SessionButton />
            <Link to="/app/recompenses" className="h-10 px-3 rounded-full bg-ink text-white text-sm font-extrabold flex items-center gap-1.5 tabular-nums" aria-label={`${points} punts`}>
              <Gift size={16} color="#FFD27A" aria-hidden />{points}
            </Link>
            <button onClick={answerNext} className="hidden md:inline-flex btn-red !h-10">
              <ClipboardCheck size={18} aria-hidden />
              {pending.length ? `Respon (${pending.length})` : 'Al dia'}
            </button>
          </div>
        </div>
      </header>
      <div className="shrink-0 border-b border-line bg-paper px-4 md:px-6 py-2"><div className="max-w-6xl mx-auto"><UserSite /></div></div>

      <main className={cn('flex-1 min-h-0', fullBleed ? 'pb-[calc(76px+env(safe-area-inset-bottom,0px))] md:pb-0' : 'pb-[96px] md:pb-0')}>
        <div key={location.pathname} className="page-enter h-full"><Outlet /></div>
      </main>

      <footer className={cn('border-t border-line bg-paper', fullBleed ? 'hidden' : 'hidden md:block')}>
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center gap-6 text-[13px] text-ink-muted">
          <span>Enquestes anònimes: no guardem el teu nom, el dispositiu ni la ubicació.</span>
          <span className="flex items-center gap-4 whitespace-nowrap">
            <span className="eyebrow">Accés intern (demo)</span>
            <Link to="/" className="font-bold hover:text-ink">Inici demo</Link>
            <Link to="/rrhh" className="font-bold hover:text-ink">Manager i Persones</Link>
          </span>
        </div>
      </footer>

      <nav aria-label="Navegació" className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-paper border-t border-line" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-[560px] mx-auto h-[76px] grid grid-cols-5 items-center px-1.5">
          {TABS.slice(0, 2).map(t => <Tab key={t.to} {...t} />)}
          <button
            onClick={answerNext}
            aria-label={pending.length ? `Respondre enquesta. Pendents: ${pending.length}` : 'Cap enquesta pendent'}
            className="flex flex-col items-center gap-1 text-[10.5px] font-bold text-red active:scale-95 transition-transform"
          >
            <span className="relative w-14 h-14 -mt-7 rounded-full bg-red grid place-items-center shadow-red">
              <ClipboardCheck size={24} color="#fff" aria-hidden />
              {pending.length > 0 && <span className="absolute -right-0.5 -top-0.5 w-5 h-5 rounded-full bg-ink text-white text-[10.5px] font-extrabold grid place-items-center border-2 border-paper">{pending.length}</span>}
            </span>
            Respon
          </button>
          {TABS.slice(2).map(t => <Tab key={t.to} {...t} />)}
        </div>
      </nav>
    </div>
  )
}

function Tab({ to, label, Icon }: { to: string; label: string; Icon: typeof Home }) {
  return (
    <NavLink to={to} end={to === '/app'} className={({ isActive }) => cn('flex flex-col items-center gap-1 text-[10.5px] font-bold', isActive ? 'text-red' : 'text-ink-muted')}>
      <Icon size={22} strokeWidth={2} aria-hidden />{label}
    </NavLink>
  )
}

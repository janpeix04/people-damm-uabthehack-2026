import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { CheckCheck, ClipboardCheck, Factory, Home, MessageCircle } from 'lucide-react'
import { cn } from './ui'
import { useApp } from '../store/AppContext'

/** Barra inferior amb el botó d’enquesta sempre a un toc. */
export default function WorkerLayout() {
  const { pending, toast } = useApp()
  const nav = useNavigate()
  const tab = (to: string, label: string, Icon: typeof Home, end?: boolean) => (
    <NavLink to={to} end={end} className={({ isActive }) => cn('flex flex-col items-center gap-1 text-[10.5px] font-bold', isActive ? 'text-red' : 'text-ink-muted')}>
      <Icon size={22} strokeWidth={2} aria-hidden />{label}
    </NavLink>
  )
  return (
    <div className="min-h-full flex flex-col">
      <div className="flex-1 min-h-0 pb-[84px]"><Outlet /></div>
      <nav aria-label="Navegació" className="fixed inset-x-0 bottom-0 z-40 bg-paper border-t border-line" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="max-w-[560px] mx-auto h-[76px] grid grid-cols-5 items-center px-1.5">
          {tab('/app', 'Inici', Home, true)}
          {tab('/app/placa', 'La Plaça', MessageCircle)}
          <button
            onClick={() => (pending.length ? nav(`/e/${pending[0].id}`) : toast('No tens cap enquesta pendent. Gràcies!'))}
            aria-label={pending.length ? `Enquestes pendents: ${pending.length}` : 'Cap enquesta pendent'}
            className="flex flex-col items-center gap-1 text-[10.5px] font-bold text-red"
          >
            <span className="relative w-14 h-14 -mt-7 rounded-full bg-red grid place-items-center shadow-red">
              <ClipboardCheck size={24} color="#fff" aria-hidden />
              {pending.length > 0 && <span className="absolute -right-0.5 -top-0.5 w-5 h-5 rounded-full bg-ink text-white text-[10.5px] font-extrabold grid place-items-center border-2 border-paper">{pending.length}</span>}
            </span>
            Enquesta
          </button>
          {tab('/app/world', 'Damm World', Factory)}
          {tab('/app/hem-fet', 'Hem fet', CheckCheck)}
        </div>
      </nav>
    </div>
  )
}

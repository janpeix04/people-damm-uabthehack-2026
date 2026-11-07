import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ChevronRight, Gift } from 'lucide-react'
import { HAIRS, SHIRTS, SKINS, ZONES } from '../../data/mock'
import { useApp } from '../../store/AppContext'
import { FestaCard, Logo, PathIcon } from '../../components/ui'
import { AvatarModal } from '../../components/Panels'
import { WEATHER } from '../../data/mock'

export default function WorkerInici() {
  const { pending, avatar, points } = useApp()
  const [av, setAv] = useState(false)
  const next = pending[0]
  const env = ZONES[0]
  return (
    <div className="max-w-[560px] mx-auto px-4 pt-4 pb-6 flex flex-col gap-3.5">
      <header className="flex justify-between items-center">
        <Logo size="sm" />
        <button onClick={() => setAv(true)} aria-label="El teu personatge" className="w-11 h-11 rounded-[14px] border border-line bg-paper grid place-items-center">
          <svg width="30" height="30" viewBox="0 0 40 40" aria-hidden><circle cx="20" cy="15" r="9" fill={SKINS[avatar.skin]} /><path d="M11 13a9 9 0 0 1 18 0c-3-3-6-4-9-4s-6 1-9 4z" fill={HAIRS[avatar.hair]} /><circle cx="17" cy="15.5" r="1.2" fill="#1F1A18" /><circle cx="23" cy="15.5" r="1.2" fill="#1F1A18" /><path d="M8 38c1-8 6-12 12-12s11 4 12 12z" fill={SHIRTS[avatar.shirt]} /></svg>
        </button>
      </header>

      <div>
        <h1 className="serif text-[32px] leading-none">Hola!</h1>
        <p className="text-[15px] text-ink-muted mt-1">El que ens expliques fa canviar coses de debò.</p>
      </div>

      {next ? (
        <Link to={`/e/${next.id}`} className="flex flex-col gap-3 bg-red text-white rounded-[24px] p-[18px] shadow-[0_14px_30px_rgba(200,16,46,.32)]">
          <div className="flex justify-between items-center"><span className="text-[11.5px] font-extrabold tracking-[.12em] uppercase bg-white/20 rounded-full px-2.5 py-1">{pending.length === 1 ? 'Tens 1 enquesta' : `Tens ${pending.length} enquestes`}</span><span className="text-[12.5px] font-bold opacity-90">Tanca el {new Date(next.closesAt).toLocaleDateString('ca-ES', { day: 'numeric', month: 'short' })}</span></div>
          <div className="serif text-[26px] leading-[1.12]">{next.title}</div>
          <div className="flex gap-3.5 text-[13px] font-semibold opacity-95"><span>{next.questions.length} preguntes</span><span>{next.questions.reduce((a, q) => a + q.secs, 0)} s</span><span>Anònima</span></div>
          <span className="h-[50px] rounded-[15px] bg-white text-red text-base font-extrabold grid place-items-center">Començar</span>
        </Link>
      ) : (
        <div className="card p-5 flex gap-3 items-center"><span className="w-11 h-11 rounded-[14px] bg-ok-bg grid place-items-center"><Check size={22} className="text-ok" /></span><div><strong className="block">Estàs al dia</strong><span className="text-[13px] text-ink-muted">No tens cap enquesta pendent. Gràcies!</span></div></div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Link to="/app/placa" className="card overflow-hidden flex flex-col">
          <svg viewBox="0 0 170 92" className="w-full block" aria-hidden><rect width="170" height="92" fill="#CFE6F4" /><rect y="56" width="170" height="36" fill="#EBD8BA" /><rect x="6" y="26" width="34" height="32" fill="#F3E7D2" /><path d="M3 26 L23 14 L43 26z" fill="#C2512F" /><rect x="42" y="18" width="30" height="40" fill="#FFFFFF" /><rect x="74" y="28" width="40" height="30" fill="#E2B98F" /><path d="M71 28 L94 15 L117 28z" fill="#B5462B" /><rect x="116" y="22" width="48" height="36" fill="#F2E6D2" /><rect x="116" y="44" width="48" height="5" fill="#C8102E" /><ellipse cx="85" cy="74" rx="20" ry="6" fill="#DCD3C6" /><ellipse cx="85" cy="72" rx="16" ry="4" fill="#7FC6E0" /><circle cx="40" cy="70" r="4" fill="#EFC3A1" /><rect x="37" y="74" width="6" height="8" rx="3" fill="#C8102E" /><circle cx="130" cy="72" r="4" fill="#B57A52" /><rect x="127" y="76" width="6" height="8" rx="3" fill="#1E2A44" /></svg>
          <span className="px-3 pt-2.5 pb-3 flex flex-col gap-0.5"><strong className="text-[15px]">La Plaça</strong><span className="text-xs text-ink-muted">64 persones parlen dels descansos</span></span>
        </Link>
        <Link to="/app/world" className="card overflow-hidden flex flex-col">
          <svg viewBox="0 0 170 92" className="w-full block" aria-hidden><rect width="170" height="92" fill="#9FC6DA" /><path d="M85 30 L160 58 L85 86 L10 58z" fill="#8FC66B" /><path d="M85 86 L160 58 L160 64 L85 92z" fill="#8A6644" /><path d="M85 86 L10 58 L10 64 L85 92z" fill="#A57A50" /><rect x="40" y="26" width="7" height="30" fill="#D3D8DE" /><rect x="49" y="24" width="7" height="32" fill="#D3D8DE" /><rect x="58" y="26" width="7" height="30" fill="#D3D8DE" /><rect x="96" y="34" width="34" height="26" fill="#D9232B" /><rect x="74" y="44" width="16" height="16" fill="#F3E7C8" /><rect x="80" y="30" width="6" height="16" fill="#F3E7C8" /><path d="M83 22 l1.5 4 4 .3 -3 2.6 1 4 -3.5-2.2 -3.5 2.2 1-4 -3-2.6 4-.3z" fill="#E6B422" /><ellipse cx="120" cy="18" rx="14" ry="7" fill="#8E99A8" /><path d="M112 26 l-2 5 M120 26 l-2 5 M128 26 l-2 5" stroke="#2D5C9E" strokeWidth="1.6" strokeLinecap="round" /></svg>
          <span className="px-3 pt-2.5 pb-3 flex flex-col gap-0.5"><strong className="text-[15px]">Damm World</strong><span className="text-xs text-ink-muted flex items-center gap-1"><PathIcon d={WEATHER[env.weather].path} size={13} color={WEATHER[env.weather].ink} />{env.name}: {env.weatherLabel.toLowerCase()}</span></span>
        </Link>
      </div>

      <FestaCard compact />

      <Link to="/app/hem-fet" className="card p-3.5 flex gap-3 items-center">
        <span className="w-11 h-11 rounded-[14px] bg-ok-bg grid place-items-center shrink-0"><Check size={22} className="text-ok" strokeWidth={2.4} /></span>
        <span className="flex-1"><span className="text-[11.5px] font-extrabold text-ok tracking-[.06em] uppercase">Ens heu dit · Hem fet</span><br /><span className="text-sm font-bold leading-snug">Sala de descans climatitzada a Envasat</span></span>
        <ChevronRight size={18} className="text-ink-muted" />
      </Link>

      <Link to="/app/recompenses" className="rounded-[20px] bg-ink text-white p-3.5 flex gap-3 items-center">
        <span className="w-11 h-11 rounded-[14px] bg-white/10 grid place-items-center shrink-0"><Gift size={22} color="#FFD27A" /></span>
        <span className="flex-1"><span className="text-xs font-semibold opacity-80">Recompenses · demo</span><br /><span className="text-lg font-extrabold">{points} punts</span></span>
        <ChevronRight size={18} className="opacity-70" />
      </Link>

      <Link to="/rrhh" className="text-center text-xs font-semibold text-ink-muted py-2">Canviar a la vista de RRHH</Link>
      <AvatarModal open={av} onClose={() => setAv(false)} />
    </div>
  )
}

import { Link } from 'react-router-dom'
import { ArrowRight, BriefcaseBusiness, ClipboardCheck, UserRound } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { Logo } from '../../components/ui'

/** Selector de rol de la demo (no hi ha autenticació real). */
export default function Landing() {
  const { pending, surveys } = useApp()
  const demo = pending[0] ?? surveys.find(s => s.status === 'open')

  return (
    <main className="min-h-[100dvh] bg-ink text-white lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(420px,.75fr)]">
      <section className="relative min-h-[54svh] overflow-hidden lg:min-h-[100dvh]">
        <img
          src="/images/damm-pulse-hero.jpg"
          alt="Espigues d'ordi i llúpol sota la llum mediterrània"
          className="landing-hero-image absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,15,15,.56),rgba(15,15,15,.12)_66%,rgba(15,15,15,.34))]" />
        <div className="landing-grain absolute inset-0 opacity-30 mix-blend-soft-light" aria-hidden />

        <div className="relative z-10 flex min-h-[54svh] flex-col px-5 py-5 sm:px-8 sm:py-7 lg:min-h-[100dvh] lg:px-12 xl:px-16">
          <div className="flex items-center justify-between">
            <Logo light className="h-auto w-[112px] sm:w-[138px]" />
            <span className="hidden text-[11px] font-bold uppercase tracking-[.16em] text-white/75 sm:block">Portal de personal</span>
          </div>

          <div className="mt-auto max-w-[790px] pb-3 pt-16 sm:pb-6 lg:pb-12">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-[.18em] text-white/72">Escolta activa</p>
            <h1 className="serif text-[clamp(2.65rem,6.2vw,6.6rem)] leading-[.9] tracking-[-.045em]">
              <span className="block">Escoltar les persones.</span>
              <span className="block">Fer avançar Damm.</span>
            </h1>
            <p className="mt-5 max-w-[38rem] text-base leading-relaxed text-white/84 sm:text-lg">
              Un espai per escoltar, participar i convertir cada veu en millores visibles.
            </p>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-[46svh] flex-col overflow-hidden bg-red px-5 py-8 sm:px-8 lg:min-h-[100dvh] lg:justify-center lg:px-9 xl:px-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full border border-white/10" aria-hidden />

        <div className="relative mx-auto w-full max-w-[520px]">
          <p className="text-[11px] font-bold uppercase tracking-[.18em] text-white/72">Tria el teu perfil</p>
          <h2 className="serif mt-2 text-[clamp(2.35rem,4vw,4.2rem)] leading-[.94]">Com vols entrar?</h2>
          <p className="mt-3 max-w-[32rem] text-sm leading-relaxed text-white/78 sm:text-base">
            Cada modalitat té eines i permisos diferents.
          </p>

          <div className="mt-7 grid gap-3">
            <Link to="/rrhh" className="landing-entry group flex min-h-[128px] items-center gap-4 rounded-[20px] border border-white/32 bg-white p-4 text-ink shadow-lift transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_64px_rgba(55,0,9,.24)] sm:p-5" style={{ animationDelay: '320ms' }}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-red-soft text-red"><BriefcaseBusiness size={25} aria-hidden /></span>
              <span className="min-w-0 flex-1"><span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-red-dk">Manager / Persones</span><strong className="serif mt-1 block text-[26px] leading-none">Gestionar equips</strong><span className="mt-2 block text-[13px] leading-snug text-ink-muted">Enquestes, insights i accions de millora.</span></span>
              <ArrowRight className="shrink-0 text-red transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>

            <Link to="/app" className="landing-entry group flex min-h-[128px] items-center gap-4 rounded-[20px] border border-white/18 bg-ink p-4 shadow-lift transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_64px_rgba(55,0,9,.28)] sm:p-5" style={{ animationDelay: '410ms' }}>
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-white/12 text-white"><UserRound size={25} aria-hidden /></span>
              <span className="min-w-0 flex-1"><span className="text-[10px] font-extrabold uppercase tracking-[.14em] text-white/60">Persona treballadora</span><strong className="serif mt-1 block text-[26px] leading-none">Entrar al meu espai</strong><span className="mt-2 block text-[13px] leading-snug text-white/68">Enquestes, La Plaça i recompenses.</span></span>
              <ArrowRight className="shrink-0 text-white transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>

            {demo && (
              <Link to={`/e/${demo.id}`} className="landing-entry group mt-1 flex min-h-11 items-center justify-center gap-2 rounded-[14px] border border-white/28 px-4 text-sm font-bold text-white transition-colors hover:bg-white/10" style={{ animationDelay: '500ms' }}>
                <ClipboardCheck size={17} aria-hidden />Participar en una enquesta anònima
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            )}
          </div>
        </div>
      </section>
    </main>
  )
}

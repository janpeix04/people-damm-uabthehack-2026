import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BarChart3, Smartphone } from 'lucide-react'

const BUBBLES = [
  ['8%', '8px', '1.8s', '-.4s', '-8px'],
  ['17%', '11px', '2.2s', '-1.2s', '6px'],
  ['27%', '7px', '1.7s', '-.8s', '-4px'],
  ['38%', '10px', '2.4s', '-1.6s', '8px'],
  ['49%', '6px', '1.9s', '-.2s', '-5px'],
  ['59%', '12px', '2.5s', '-1.9s', '7px'],
  ['70%', '8px', '2.1s', '-1s', '-7px'],
  ['81%', '10px', '2.3s', '-1.5s', '5px'],
  ['91%', '7px', '1.8s', '-.6s', '-5px'],
] as const

const bubbleStyle = ([x, size, duration, delay, drift]: (typeof BUBBLES)[number]) => ({
  '--bubble-x': x,
  '--bubble-size': size,
  '--bubble-duration': duration,
  '--bubble-delay': delay,
  '--bubble-drift': drift,
}) as CSSProperties

/** Selector de rol de la demo (no hi ha autenticació real). */
export default function Landing() {
  return (
    <main className="people-access min-h-[100dvh] overflow-hidden bg-cream text-ink">
      <section className="relative mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12" aria-labelledby="people-damm-title">
        <div className="people-access-glow" aria-hidden />

        <div className="relative z-[1] flex w-full flex-col items-center">
          <h1 id="people-damm-title" className="sr-only">People Damm</h1>

          <div className="people-logo-stage" role="img" aria-label="El logotip de People Damm es revela quan la cervesa baixa">
            <img className="people-logo-final" src="/logo-people-damm.png" alt="" width="1665" height="944" draggable={false} />

            <div className="people-logo-liquid-mask" aria-hidden>
              <div className="people-logo-beer">
                <div className="people-logo-foam" />
                {BUBBLES.map((bubble, index) => <span key={index} className="people-logo-bubble" style={bubbleStyle(bubble)} />)}
              </div>
            </div>

            <div className="people-logo-shine-mask" aria-hidden>
              <div className="people-logo-shine" />
            </div>
          </div>

          <p className="people-access-copy mt-3 max-w-xl text-center text-[15px] leading-relaxed text-ink-muted sm:mt-4 sm:text-base">
            El clima laboral de Damm, de forma àgil, contínua i anònima. Prototip amb dades sintètiques.
          </p>

          <nav className="mt-8 grid w-full max-w-[820px] gap-4 sm:mt-10 sm:grid-cols-2" aria-label="Accessos de People Damm">
            <Link to="/rrhh" className="people-access-card group" style={{ '--card-delay': '2.62s' } as CSSProperties}>
              <span className="people-access-icon bg-red text-white"><BarChart3 size={23} strokeWidth={2} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <strong className="serif block text-[22px] leading-tight text-ink sm:text-[25px]">Portal RRHH</strong>
                <span className="mt-2 block text-[13.5px] leading-relaxed text-ink-muted">Crear enquestes, analitzar resultats i gestionar accions.</span>
              </span>
              <ArrowRight className="people-access-arrow text-red" size={21} aria-hidden />
            </Link>

            <Link to="/app" className="people-access-card group" style={{ '--card-delay': '2.69s' } as CSSProperties}>
              <span className="people-access-icon bg-ink text-white"><Smartphone size={23} strokeWidth={2} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <strong className="serif block text-[22px] leading-tight text-ink sm:text-[25px]">App del treballador</strong>
                <span className="mt-2 block text-[13.5px] leading-relaxed text-ink-muted">Enquestes, La Plaça i recompenses, des de qualsevol dispositiu.</span>
              </span>
              <ArrowRight className="people-access-arrow text-ink" size={21} aria-hidden />
            </Link>
          </nav>
        </div>
      </section>
    </main>
  )
}

import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

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

function AnimatedPeopleLogo() {
  return (
    <div className="people-logo-stage people-logo-stage--intro">
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
  )
}

/** Accés als espais de People Damm. */
export default function Landing() {
  return (
    <main className="people-access min-h-[100dvh] overflow-x-hidden bg-cream text-ink">
      <div className="people-intro" aria-hidden="true">
        <div className="people-intro-glow" />
        <AnimatedPeopleLogo />
      </div>

      <section className="people-options mx-auto flex min-h-[100dvh] w-full max-w-[980px] flex-col justify-center px-3 py-4 sm:px-6 sm:py-6 lg:px-8" aria-labelledby="people-damm-title">
        <header className="people-options-header">
          <h1 id="people-damm-title" className="sr-only">People Damm</h1>
          <img src="/logo-people-damm.png" alt="People Damm" width="1665" height="944" draggable={false} />
        </header>

        <nav className="people-options-grid" aria-label="Accessos de People Damm">
          <Link to="/rrhh" className="people-role-card people-role-card--rrhh" style={{ '--card-delay': '2.68s' } as CSSProperties}>
            <span className="people-role-visual" aria-hidden="true">
              <span className="people-role-halo" />
              <img src="/images/landing/portal-rrhh.png" alt="" width="1254" height="1254" draggable={false} />
            </span>

            <span className="people-role-copy">
              <strong className="people-role-title" aria-label="Portal RRHH">
                <span>Portal</span>
                <span>RRHH</span>
              </strong>
              <span className="people-role-action">
                Gestionar persones i equips
                <ArrowRight className="people-role-arrow" size={22} strokeWidth={2} aria-hidden="true" />
              </span>
            </span>
          </Link>

          <Link to="/app" className="people-role-card people-role-card--worker" style={{ '--card-delay': '2.76s' } as CSSProperties}>
            <span className="people-role-visual" aria-hidden="true">
              <span className="people-role-halo" />
              <img src="/images/landing/app-treballador.png" alt="" width="1254" height="1254" draggable={false} />
            </span>

            <span className="people-role-copy">
              <strong className="people-role-title people-role-title--worker" aria-label="App del treballador">
                <span>App del</span>
                <span>treballador</span>
              </strong>
              <span className="people-role-action">
                Participar, compartir i bescanviar punts
                <ArrowRight className="people-role-arrow" size={22} strokeWidth={2} aria-hidden="true" />
              </span>
            </span>
          </Link>
        </nav>
      </section>
    </main>
  )
}

import { Link } from 'react-router-dom'
import { BarChart3, ClipboardCheck, Smartphone } from 'lucide-react'
import { useApp } from '../../store/AppContext'
import { Logo } from '../../components/ui'

/** Selector de rol de la demo (no hi ha autenticació real). */
export default function Landing() {
  const { pending, surveys } = useApp()
  const demo = pending[0] ?? surveys.find(s => s.status === 'open')
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 py-10 gap-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <h1><Logo size="lg" /></h1>
        <p className="text-lg text-ink-muted max-w-xl">El clima laboral de Damm, de forma àgil, contínua i anònima. Prototip amb dades sintètiques.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3 w-full max-w-4xl">
        <Link to="/rrhh" className="card p-6 flex flex-col gap-3 hover:shadow-lift transition">
          <span className="w-12 h-12 rounded-[16px] bg-red grid place-items-center"><BarChart3 color="#fff" /></span>
          <strong className="serif text-2xl">Portal RRHH</strong>
          <span className="text-sm text-ink-muted">Crear enquestes amb IA, difondre-les, analitzar resultats i gestionar accions.</span>
        </Link>
        <Link to="/app" className="card p-6 flex flex-col gap-3 hover:shadow-lift transition">
          <span className="w-12 h-12 rounded-[16px] bg-ink grid place-items-center"><Smartphone color="#fff" /></span>
          <strong className="serif text-2xl">App del treballador</strong>
          <span className="text-sm text-ink-muted">Enquestes, “Hem fet” i recompenses. Responsive per a mòbil i escriptori.</span>
        </Link>
        {demo && (
          <Link to={`/e/${demo.id}`} className="card p-6 flex flex-col gap-3 hover:shadow-lift transition">
            <span className="w-12 h-12 rounded-[16px] bg-gold grid place-items-center"><ClipboardCheck color="#fff" /></span>
            <strong className="serif text-2xl">Enllaç d’enquesta</strong>
            <span className="text-sm text-ink-muted">El que s’obre en escanejar el QR o tocar l’enllaç de WhatsApp: sense iniciar sessió.</span>
          </Link>
        )}
      </div>
    </div>
  )
}

import { Scene3D } from '../../components/Scene3D'
import { PLAZA_TOPICS } from '../../data/mock'
import { useApp } from '../../store/AppContext'
import { FestaCard, toneBg } from '../../components/ui'

export default function HRPlaca() {
  const { ideas, toast } = useApp()
  return (
    <div className="flex flex-col xl:flex-row xl:h-screen">
      <div className="relative h-[60vh] xl:h-full xl:flex-1">
        <Scene3D kind="plaza" className="absolute inset-0" ariaLabel="La Plaça en 3D" onAction={a => a === 'stage' ? toast('El concert s’obre al 60% de participació') : toast('Vista de RRHH: les accions són per als treballadors')} />
        <div className="absolute left-4 top-4 bg-paper/95 border border-line rounded-[18px] shadow-lift px-4 py-3 pointer-events-none">
          <h1 className="serif text-[26px] leading-none">La Plaça</h1>
          <p className="text-xs text-ink-muted mt-1">Així la veuen els treballadors</p>
        </div>
      </div>
      <aside className="xl:w-[380px] shrink-0 bg-cream border-l border-line p-4 flex flex-col gap-4 xl:overflow-y-auto scroll-thin">
        <FestaCard compact />
        <section className="card p-4 flex flex-col gap-2">
          <h2 className="serif text-[21px]">Temes agregats</h2>
          {PLAZA_TOPICS.map(t => <div key={t.label} className="flex justify-between items-center rounded-[12px] px-3 py-2 text-sm" style={{ background: toneBg(t.tone) }}><span className="font-semibold">{t.label}</span><span className="text-xs text-ink-muted">{t.n} · {t.trend}</span></div>)}
        </section>
        <section className="card p-4 flex flex-col gap-2">
          <h2 className="serif text-[21px]">Bústia d’idees</h2>
          <p className="text-xs text-ink-muted">Moderació i anonimització automàtiques. RRHH només veu el text net, sense cap dada de qui l’ha escrit.</p>
          {ideas.length === 0 && <p className="text-sm text-ink-muted bg-cream rounded-[12px] p-3">Encara no hi ha idees noves. Prova-ho des de l’app del treballador (La Plaça → Deixa una idea).</p>}
          {ideas.map(i => (
            <div key={i.id} className="border border-cream-dk rounded-[12px] p-3 flex flex-col gap-1.5">
              <div className="flex justify-between gap-2 items-center"><span className="chip bg-cream text-ink-soft">{i.category}</span><span className={i.status === 'moderant' ? 'chip bg-warn-bg text-warn-ink' : 'chip bg-ok-bg text-ok-ink'}>{i.status === 'moderant' ? 'En moderació' : 'Publicada al tema'}</span></div>
              <p className="text-[13.5px] leading-snug">{i.text}</p>
            </div>
          ))}
        </section>
      </aside>
    </div>
  )
}

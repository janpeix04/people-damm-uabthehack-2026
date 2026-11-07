import { useState } from 'react'
import { useApp } from '../../store/AppContext'
import { PageHead } from '../../components/HRLayout'

function Toggle({ label, sub, on, set }: { label: string; sub: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <button aria-pressed={on} onClick={() => set(!on)} className="toggle flex items-center gap-3 p-3.5 w-full">
      <span className="flex-1"><strong className="block text-sm">{label}</strong><span className="text-xs text-ink-muted">{sub}</span></span>
      <span className={`w-11 h-6 rounded-full relative transition ${on ? 'bg-red' : 'bg-line'}`}><span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></span>
    </button>
  )
}

export default function Config() {
  const { resetDemo, toast } = useApp()
  const [min, setMin] = useState(10)
  const [opts, setOpts] = useState({ moderacio: true, anonim: true, aprovacio: true, festa: true, recompenses: false })
  const set = (k: keyof typeof opts) => (v: boolean) => setOpts(o => ({ ...o, [k]: v }))
  return (
    <div className="max-w-3xl flex flex-col gap-5">
      <PageHead title="Configuració" sub="Regles de privacitat, IA i participació. Valors de demostració: no es desen al servidor." />
      <section className="card p-5 flex flex-col gap-3">
        <h2 className="serif text-[22px]">Privacitat</h2>
        <label htmlFor="min" className="text-sm font-bold">Mínim de respostes per mostrar resultats d’una zona: {min}</label>
        <input id="min" type="range" min={5} max={20} value={min} onChange={e => setMin(+e.target.value)} className="accent-[#C8102E]" />
        <p className="text-xs text-ink-muted">Recomanat: 10 o més. Per sota, les mètriques s’oculten.</p>
        <Toggle label="Anonimització del text obert" sub="Treu noms, telèfons i dades personals abans d’analitzar" on={opts.anonim} set={set('anonim')} />
        <Toggle label="Moderació a la bústia de La Plaça" sub="Revisa el to i el contingut abans d’agregar-ho als temes" on={opts.moderacio} set={set('moderacio')} />
      </section>
      <section className="card p-5 flex flex-col gap-3">
        <h2 className="serif text-[22px]">IA</h2>
        <Toggle label="Aprovació humana obligatòria" sub="La IA proposa preguntes i accions; RRHH les publica" on={opts.aprovacio} set={set('aprovacio')} />
      </section>
      <section className="card p-5 flex flex-col gap-3">
        <h2 className="serif text-[22px]">Participació</h2>
        <Toggle label="Festa de la plaça" sub="Objectiu col·lectiu que desbloqueja millores a La Plaça" on={opts.festa} set={set('festa')} />
        <Toggle label="Recompenses (pendent de validar)" sub="Saldo de demostració separat de les respostes. Sense rànquings." on={opts.recompenses} set={set('recompenses')} />
      </section>
      <section className="card p-5 flex flex-wrap justify-between items-center gap-3">
        <div><h2 className="serif text-[22px]">Dades de la demo</h2><p className="text-xs text-ink-muted">Torna a l’estat inicial: enquestes, respostes, idees i personatge.</p></div>
        <button className="btn-line" onClick={() => { resetDemo(); toast('Demo restablerta') }}>Restablir la demo</button>
      </section>
    </div>
  )
}

import { useState } from 'react'
import { BellRing, Check, FileCheck2, MessagesSquare, RefreshCw, ShieldCheck, UsersRound } from 'lucide-react'
import { PageHead } from '../../components/HRLayout'
import TeamsDeliveryPreview from '../../components/TeamsDeliveryPreview'
import { useApp } from '../../store/AppContext'

const deliveries = [
  {
    icon: MessagesSquare,
    title: 'Invitació adaptativa',
    body: 'Presenta el títol, el temps estimat, la data límit i l’accés directe a l’enquesta.',
  },
  {
    icon: BellRing,
    title: 'Recordatori segmentat',
    body: 'Torna a avisar abans del tancament sense mostrar qui ha respost ni el contingut de les respostes.',
  },
  {
    icon: FileCheck2,
    title: 'Aprovació de persones',
    body: 'Les accions proposades arriben a RRHH perquè una persona les revisi, les editi o les descarti.',
  },
]

export default function Teams() {
  const { toast } = useApp()
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [selected, setSelected] = useState(true)

  const sync = () => {
    setSyncing(true)
    window.setTimeout(() => {
      setSyncing(false)
      setSynced(true)
      toast('Directori sintètic sincronitzat')
    }, 750)
  }

  return (
    <div className="max-w-6xl flex flex-col gap-5 md:gap-7">
      <PageHead
        title="Microsoft Teams"
        sub="Publica enquestes i recordatoris amb targetes adaptatives, mantenint l’anonimat i la identitat People Damm."
        actions={<span className="chip bg-ok-bg text-ok-ink"><Check size={13} aria-hidden />Mode demo segur</span>}
      />

      <section className="rounded-[18px] bg-ink text-white overflow-hidden">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
          <div className="p-5 sm:p-7 flex gap-4 items-start">
            <span className="w-12 h-12 rounded-[14px] bg-[#6264A7] grid place-items-center shrink-0"><MessagesSquare size={24} aria-hidden /></span>
            <div>
              <h2 className="serif text-[27px] leading-tight">Escolta Damm, dins de Teams</h2>
              <p className="mt-2 text-sm leading-relaxed text-white/75 max-w-2xl">El paquet del ZIP queda integrat amb manifest, bot de notificacions, targetes adaptatives i adaptador de directori. En local treballa exclusivament amb dades sintètiques.</p>
            </div>
          </div>
          <div className="grid grid-cols-3 border-t border-white/10 lg:border-t-0 lg:border-l">
            {[
              ['3', 'targetes'],
              ['727', 'identitats demo'],
              ['3', 'idiomes'],
            ].map(([value, label]) => (
              <div key={label} className="px-3 py-5 text-center border-l border-white/10 first:border-l-0">
                <strong className="serif text-[28px] block leading-none">{value}</strong>
                <span className="mt-1 block text-[11.5px] text-white/65">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <TeamsDeliveryPreview
        selected={selected}
        title="Pols d’equip i benestar"
        questions={4}
        closesAt="2026-11-21"
        onToggle={() => setSelected(value => !value)}
      />

      <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="card p-5 sm:p-6">
          <h2 className="serif text-[24px]">Què rep cada persona</h2>
          <div className="mt-4 grid gap-4">
            {deliveries.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3.5 items-start border-t border-line pt-4 first:border-t-0 first:pt-0">
                <span className="w-10 h-10 rounded-[12px] bg-red-soft text-red-dk grid place-items-center shrink-0"><Icon size={19} aria-hidden /></span>
                <div><h3 className="font-bold text-[15px]">{title}</h3><p className="mt-0.5 text-[13px] leading-relaxed text-ink-muted">{body}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-[12px] bg-cream text-red-dk grid place-items-center shrink-0"><UsersRound size={20} aria-hidden /></span>
            <div><h2 className="serif text-[24px] leading-tight">Directori i privacitat</h2><p className="mt-1 text-[13px] leading-relaxed text-ink-muted">El mode demo no consulta el tenant corporatiu ni envia notificacions reals.</p></div>
          </div>
          <div className="rounded-[14px] bg-cream px-4 py-3 text-[13px]">
            <strong className="block">{synced ? '727 identitats demo sincronitzades' : '727 identitats sintètiques disponibles'}</strong>
            <span className="text-ink-muted">Fàbriques, logística, comercial i oficines</span>
          </div>
          <div className="flex gap-2 items-start text-[12.5px] leading-relaxed text-ink-muted">
            <ShieldCheck size={17} className="text-red shrink-0 mt-px" aria-hidden />
            <span>El token de Microsoft Graph és només de servidor. Mai arriba al navegador ni a les respostes.</span>
          </div>
          <button onClick={sync} disabled={syncing} className="btn-ink !h-11 mt-auto">
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} aria-hidden />
            {syncing ? 'Sincronitzant...' : 'Provar sincronització demo'}
          </button>
        </section>
      </div>

      <section className="rounded-[16px] border border-warn bg-warn-bg px-4 py-3 text-[13px] leading-relaxed text-warn-ink">
        <strong>Activació real pendent:</strong> cal registrar l’app a Entra ID, obtenir consentiment administratiu per a Microsoft Graph, publicar el paquet al catàleg corporatiu i validar el DPIA.
      </section>
    </div>
  )
}

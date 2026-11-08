import { Link, useSearchParams } from 'react-router-dom'
import { ClipboardList, MessagesSquare, Sparkles, Users } from 'lucide-react'
import { MOODS, zoneByKey } from '../../data/mock'
import { useDepartments } from '../../api/departments'
import { useAuth } from '../../store/AuthContext'
import { useApp } from '../../store/AppContext'
import { fmt, Meter, PathIcon, MoodBadge } from '../../components/ui'
import { useI18n } from '../../i18n'
import { useDemoText } from '../../i18n/demo'

export default function HRInici() {
  const [params]=useSearchParams()
  const site=params.get('centre')||null
  const {departments,loading,error}=useDepartments(site)
  const {user}=useAuth()
  const { hrSurveys: surveys } = useApp()
  const { t, locale } = useI18n()
  const dx = useDemoText()
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const open = surveys.filter(s => s.status === 'open')
  // indicadors d'avui calculats a partir dels departaments (backend). El clima només fa servir
  // els departaments que superen el llindar de privacitat, ponderats per respostes.
  const headcount = departments.reduce((n, d) => n + d.headcount, 0)
  const responses = departments.reduce((n, d) => n + d.responses, 0)
  const scored = departments.filter(d => d.score != null)
  const scoredResponses = scored.reduce((n, d) => n + d.responses, 0)
  const climate = scoredResponses ? scored.reduce((n, d) => n + d.score! * d.responses, 0) / scoredResponses : null
  const climateMood = climate == null ? 'nodata' : climate >= 7 ? 'happy' : climate >= 5 ? 'uneasy' : 'stressed'
  // amb un centre el backend agrega diversos dies: la participació és la mitjana diària
  const days = departments[0]?.days ?? 1
  const participation = headcount ? Math.min(100, Math.round(100 * responses / (headcount * days))) : 0
  const ready = !loading || departments.length > 0
  const period = days === 1 ? t('home.periodToday') : t('home.periodDays', { n: days })
  const dash = '–'
  const kpis = [
    { label: t('home.kpiClimate'), value: ready && climate != null ? fmt(climate) : dash, note: climate != null ? t('home.kpiClimateNote', { period, n: scored.length }) : t('home.kpiClimateHidden'), w: climateMood as keyof typeof MOODS, Icon: null },
    { label: t('home.kpiParticipation'), value: ready ? `${participation}%` : dash, note: t('home.kpiParticipationNote', { headcount: headcount.toLocaleString(locale) }), w: null, Icon: Users },
    { label: t('home.kpiResponses'), value: ready ? responses.toLocaleString(locale) : dash, note: t('home.kpiResponsesNote', { period }), w: null, Icon: MessagesSquare },
    { label: t('home.kpiActive'), value: String(open.length), note: open.length ? t('home.kpiActiveFirstCloses', { date: shortDate(open.map(s => s.closesAt).sort()[0]) }) : t('home.kpiActiveNone'), w: null, Icon: ClipboardList },
  ]
  const firstName = user?.name?.trim().split(/\s+/)[0]
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-wrap justify-between items-start gap-3">
        <div className="min-w-0 flex flex-col gap-2">
          <h1 className="serif text-[34px] sm:text-[40px] leading-[1.05]">{firstName ? t('home.hrGreeting', { name: firstName }) : t('home.hrGreetingAnon')}</h1>
          <p className="text-base leading-relaxed text-ink-muted max-w-[620px]">{t('home.hrSummary')}</p>
        </div>
        <Link to="/rrhh/crear" className="btn-red"><Sparkles size={18} aria-hidden />{t('home.hrCreate')}</Link>
      </section>

      <section aria-label={t('home.hrKpisAria')} className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {kpis.map(k => (
          <div key={k.label} className="card p-4 flex gap-3.5 items-center">
            {k.w ? <MoodBadge w={k.w} /> : <span className="w-[46px] h-[46px] rounded-[14px] bg-red-soft grid place-items-center shrink-0">{k.Icon && <k.Icon size={22} className="text-red" aria-hidden />}</span>}
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink-muted">{k.label}</div>
              <div className="serif text-[30px] leading-tight tabular-nums">{k.value}</div>
              <div className="text-xs font-semibold text-ink-muted">{k.note}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-5 items-start">
        <section className="card p-5 flex-1 min-w-0 flex flex-col gap-3.5">
          <div className="flex flex-wrap justify-between items-end gap-2">
            <div><h2 className="serif text-2xl">{t('home.moodMap')}</h2><p className="text-[13px] text-ink-muted">{t('home.moodMapSub')}</p></div>
            <Link to="/rrhh/world" className="text-[13.5px] font-bold text-red-dk">{t('home.openWorld')}</Link>
          </div>
          <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(190px,1fr))]">
            {loading&&<p role="status">{t('home.loadingDepartments')}</p>}
            {error&&<p role="alert">{error}</p>}
            {departments.map(z => {
              const w = MOODS[z.mood]
              return (
                <Link to={`/rrhh/world?departament=${z.code}`} key={z.code} className="rounded-[16px] bg-white border-2 p-3.5 flex flex-col gap-2 hover:-translate-y-0.5 transition" style={{ borderColor:w.ink }}>
                  <div className="flex justify-between items-center gap-2"><span className="text-sm font-bold">{dx(z.name)}</span><PathIcon d={w.path} size={22} color={w.ink} /></div>
                  <div className="flex items-baseline gap-2"><span className="serif text-[26px] leading-none">{z.score != null ? fmt(z.score) : t('home.noData')}</span><span className="text-xs font-bold" style={{ color: w.ink }}>{t(`data.mood_${z.mood}`)}</span></div>
                  <div className="h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-ink" style={{ width: `${z.participation}%` }} /></div>
                  <div className="text-[11.5px] text-ink-soft">{t('home.deptPeople', { n: z.headcount, pct: z.participation })}</div>
                </Link>
              )
            })}
          </div>
          <p className="text-xs text-ink-muted">{t('home.deptFootnote')}</p>
        </section>

      </div>

      <section className="card p-5">
        <div className="flex justify-between items-center gap-2 mb-2"><h2 className="serif text-[22px]">{t('home.ongoingSurveys')}</h2><Link to="/rrhh/enquestes" className="text-[13.5px] font-bold text-red-dk">{t('home.seeAll')}</Link></div>
        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[720px] text-[13.5px]">
            <thead><tr className="text-left text-[11px] tracking-[.08em] uppercase text-ink-muted"><th className="py-2.5 px-2 font-bold">{t('home.colSurvey')}</th><th className="py-2.5 px-2 font-bold">{t('home.colAudience')}</th><th className="py-2.5 px-2 font-bold">{t('home.colChannels')}</th><th className="py-2.5 px-2 font-bold w-[200px]">{t('home.colParticipation')}</th><th className="py-2.5 px-2 font-bold">{t('home.colCloses')}</th></tr></thead>
            <tbody>
              {open.map(s => {
                const pct = Math.round((s.responses / s.target) * 100)
                return (
                  <tr key={s.id} className="border-t border-cream-dk">
                    <td className="py-3 px-2 font-bold"><Link to={`/rrhh/enquestes/${s.id}`} className="hover:text-red-dk">{dx(s.title)}</Link></td>
                    <td className="py-3 px-2 text-ink-muted">{s.zones.length >= 8 ? t('home.wholePlant') : s.zones.map(k => dx(zoneByKey(k).name)).join(', ')}</td>
                    <td className="py-3 px-2"><span className="flex flex-wrap gap-1">{s.channels.map(c => <span key={c} className="text-[11px] font-bold bg-cream rounded-md px-1.5 py-0.5">{t(`data.channel_${c}`).split(' ')[0]}</span>)}</span></td>
                    <td className="py-3 px-2"><div className="flex items-center gap-2"><Meter value={pct} thin className="flex-1" /><span className="text-xs font-bold tabular-nums">{pct}%</span></div></td>
                    <td className="py-3 px-2 text-ink-muted">{shortDate(s.closesAt)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

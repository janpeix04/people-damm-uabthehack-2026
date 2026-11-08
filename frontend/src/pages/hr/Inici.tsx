import { Link, useSearchParams } from 'react-router-dom'
import { Search, Sparkles } from 'lucide-react'
import { AI_RECS, MOODS, zoneByKey } from '../../data/mock'
import {useDepartments} from '../../api/departments'
import { useApp } from '../../store/AppContext'
import { PlazaCard, fmt, Meter, PathIcon, MoodBadge } from '../../components/ui'
import { useI18n } from '../../i18n'

export default function HRInici() {
  const [params]=useSearchParams()
  const {departments,loading,error}=useDepartments(params.get('centre')||null)
  const { hrSurveys: surveys, festa } = useApp()
  const { t, locale } = useI18n()
  const shortDate = (iso: string) => new Date(iso).toLocaleDateString(locale, { day: 'numeric', month: 'short' })
  const open = surveys.filter(s => s.status === 'open')
  const kpis = [
    { label: t('home.kpiClimate'), value: fmt(6.5), note: t('home.kpiClimateNote'), noteCls: 'text-[#B4261E]', w: 'uneasy' as const },
    { label: t('home.kpiParticipation'), value: `${Math.round(festa.pct)}%`, note: t('home.kpiParticipationNote'), noteCls: 'text-ink-muted', w: null },
    { label: t('home.kpiResponses'), value: (892 + festa.responses).toLocaleString(locale), note: t('home.kpiResponsesNote'), noteCls: 'text-ok', w: null },
    { label: t('home.kpiActive'), value: String(open.length), note: open.length ? t('home.kpiActiveFirstCloses', { date: shortDate(open.map(s => s.closesAt).sort()[0]) }) : t('home.kpiActiveNone'), noteCls: 'text-ink-muted', w: null },
  ]
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <label className="flex items-center gap-2.5 h-11 px-3.5 rounded-[14px] bg-paper border border-line flex-1 max-w-[380px] min-w-[200px]">
          <Search size={18} className="text-ink-muted" aria-hidden />
          <span className="sr-only">{t('home.hrSearch')}</span>
          <input type="search" placeholder={t('home.hrSearchPlaceholder')} className="bg-transparent outline-none text-sm font-medium flex-1 min-w-0" />
        </label>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-[13px] font-semibold text-ink-muted">{t('home.hrContext')}</span>
          <Link to="/rrhh/crear" className="btn-red"><Sparkles size={18} aria-hidden />{t('home.hrCreate')}</Link>
        </div>
      </div>

      <section className="flex flex-wrap gap-5 items-stretch">
        <div className="flex-[999_1_460px] min-w-0 flex flex-col justify-center gap-2">
          <h1 className="serif text-[34px] sm:text-[40px] leading-[1.05]">{t('home.hrGreeting')}</h1>
          <p className="text-base leading-relaxed text-ink-muted max-w-[620px]">{t('home.hrSummary')}</p>
        </div>
        <div className="flex-[1_1_340px] min-w-0"><PlazaCard /></div>
      </section>

      <section aria-label={t('home.hrKpisAria')} className="grid gap-3.5 grid-cols-[repeat(auto-fit,minmax(200px,1fr))]">
        {kpis.map(k => (
          <div key={k.label} className="card p-4 flex gap-3.5 items-center">
            {k.w ? <MoodBadge w={k.w} /> : <span className="w-[46px] h-[46px] rounded-[14px] bg-red-soft grid place-items-center shrink-0"><span className="w-2.5 h-2.5 rounded-full bg-red" /></span>}
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-ink-muted">{k.label}</div>
              <div className="serif text-[30px] leading-tight tabular-nums">{k.value}</div>
              <div className={`text-xs font-semibold ${k.noteCls}`}>{k.note}</div>
            </div>
          </div>
        ))}
      </section>

      <div className="flex flex-wrap gap-5 items-start">
        <section className="card p-5 flex-[999_1_560px] min-w-0 flex flex-col gap-3.5">
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
                  <div className="flex justify-between items-center gap-2"><span className="text-sm font-bold">{z.name}</span><PathIcon d={w.path} size={22} color={w.ink} /></div>
                  <div className="flex items-baseline gap-2"><span className="serif text-[26px] leading-none">{z.score != null ? fmt(z.score) : t('home.noData')}</span><span className="text-xs font-bold" style={{ color: w.ink }}>{t(`data.mood_${z.mood}`)}</span></div>
                  <div className="h-1.5 rounded-full bg-cream"><div className="h-full rounded-full bg-ink" style={{ width: `${z.participation}%` }} /></div>
                  <div className="text-[11.5px] text-ink-soft">{t('home.deptPeople', { n: z.headcount, pct: z.participation })}</div>
                </Link>
              )
            })}
          </div>
          <p className="text-xs text-ink-muted">{t('home.deptFootnote')}</p>
        </section>

        <aside className="flex-[1_1_320px] min-w-0 flex flex-col gap-4">
          <section className="card p-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-center"><h2 className="serif text-[21px]">{t('home.aiProposals')}</h2><span className="chip bg-red-soft text-red-dk">{t('home.approvalNeeded')}</span></div>
            {AI_RECS.map(r => (
              <div key={r.id} className="border border-cream-dk rounded-[14px] p-3 flex flex-col gap-1.5">
                <strong className="text-sm">{r.title}</strong>
                <span className="text-[12.5px] leading-snug text-ink-muted">{r.why}</span>
                <div className="flex gap-2 mt-0.5"><Link to={r.to} className="btn-ink !h-8 !px-3 !text-[12.5px] !rounded-[10px]">{r.cta}</Link><button className="btn-ghost !h-8 !px-2 !text-[12.5px]">{t('home.dismiss')}</button></div>
              </div>
            ))}
          </section>
          <section className="rounded-[20px] bg-warn-bg p-4 flex flex-col gap-1.5">
            <strong className="text-sm text-warn-ink">{t('home.representativeness')}</strong>
            <span className="text-[13px] leading-relaxed text-[#5A3A10]">{t('home.representativenessText')}</span>
          </section>
        </aside>
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
                    <td className="py-3 px-2 font-bold"><Link to={`/rrhh/enquestes/${s.id}`} className="hover:text-red-dk">{s.title}</Link></td>
                    <td className="py-3 px-2 text-ink-muted">{s.zones.length >= 8 ? t('home.wholePlant') : s.zones.map(k => zoneByKey(k).name).join(', ')}</td>
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

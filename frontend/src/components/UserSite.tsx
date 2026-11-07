import {MapPin} from 'lucide-react'
import {useAuth} from '../store/AuthContext'
export default function UserSite({className=''}:{className?:string}){
  const {user}=useAuth()
  if(!user)return null
  const label=user.site?.name||(user.role==='worker'?'Centre pendent d’assignar':'Àmbit corporatiu')
  return <label className={`flex items-center gap-2 min-w-0 ${className}`} title={user.site?`${user.site.name} · ${user.site.location}`:label}>
    <MapPin size={16} aria-hidden className="shrink-0 text-red"/>
    <span className="flex flex-col min-w-0"><span className="text-[10px] uppercase tracking-wide text-ink-muted">Centre assignat</span><select aria-label="Centre assignat al teu compte" value={user.site?.id||''} disabled className="bg-transparent text-xs sm:text-sm font-semibold text-ink truncate max-w-full disabled:opacity-100"><option value={user.site?.id||''}>{label}</option></select></span>
  </label>
}

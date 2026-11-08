import {MapPin} from 'lucide-react'
import {useAuth} from '../store/AuthContext'
import {useLocation,useSearchParams} from 'react-router-dom'
import {useSites} from '../api/departments'

function WorldSite({className}:{className:string}){
  const {user}=useAuth()
  const [params,setParams]=useSearchParams()
  const {sites,loading,error}=useSites()
  const value=params.get('centre')??user?.site?.code??''
  return <label className={`flex items-center gap-2 min-w-0 ${className}`}>
    <MapPin size={16} aria-hidden className="shrink-0 text-red"/>
    <span className="flex flex-col min-w-0"><span className="text-[10px] uppercase tracking-wide text-ink-muted">Centre</span>
      <select aria-label="Centre de Damm World" value={value} disabled={loading||!!error} onChange={event=>{const next=new URLSearchParams(params);next.set('centre',event.target.value);setParams(next,{replace:true})}} className="bg-transparent text-xs sm:text-sm font-semibold text-ink max-w-full min-w-0">
        <option value="">Tot el grup Damm</option>
        {value&&!sites.some(site=>site.code===value)&&<option value={value}>{user?.site?.name||value}</option>}
        {sites.map(site=><option key={site.code} value={site.code}>{site.name} · {site.location}</option>)}
      </select>
      {error&&<span role="alert" className="text-xs text-red">No s’han pogut carregar els centres</span>}
    </span>
  </label>
}
export default function UserSite({className=''}:{className?:string}){
  const {user}=useAuth()
  const location=useLocation()
  if(!user)return null
  if(user.role!=='worker'&&location.pathname.startsWith('/rrhh/world'))return <WorldSite className={className}/>
  const label=user.site?.name||(user.role==='worker'?'Centre pendent d’assignar':'Àmbit corporatiu')
  return <label className={`flex items-center gap-2 min-w-0 ${className}`} title={user.site?`${user.site.name} · ${user.site.location}`:label}>
    <MapPin size={16} aria-hidden className="shrink-0 text-red"/>
    <span className="flex flex-col min-w-0"><span className="text-[10px] uppercase tracking-wide text-ink-muted">Centre assignat</span><select aria-label="Centre assignat al teu compte" value={user.site?.id||''} disabled className="bg-transparent text-xs sm:text-sm font-semibold text-ink truncate max-w-full disabled:opacity-100"><option value={user.site?.id||''}>{label}</option></select></span>
  </label>
}

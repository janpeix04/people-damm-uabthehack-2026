import {MapPin} from 'lucide-react'
import {useAuth} from '../store/AuthContext'
import {useSearchParams} from 'react-router-dom'
import {useEffect} from 'react'
import {useSites} from '../api/departments'
import {useT} from '../i18n'

function HRSite({className}:{className:string}){
  const {user}=useAuth()
  const t=useT()
  const [params,setParams]=useSearchParams()
  const {sites,loading,error}=useSites()
  const storageKey=`hr-centre:${user?.id}`
  const value=params.get('centre')??sessionStorage.getItem(storageKey)??user?.site?.code??''
  useEffect(()=>{
    if(params.has('centre')){sessionStorage.setItem(storageKey,params.get('centre')||'');return}
    const next=new URLSearchParams(params);next.set('centre',value);setParams(next,{replace:true})
  },[params,setParams,storageKey,value])
  return <label className={`flex items-center gap-2 min-w-0 ${className}`}>
    <MapPin size={16} aria-hidden className="shrink-0 text-red"/>
    <span className="flex flex-col min-w-0"><span className="text-[10px] uppercase tracking-wide text-ink-muted">{t('common.siteLabel')}</span>
      <select aria-label={t('common.siteSelectAria')} title={t('common.siteSelectTitle')} value={value} disabled={loading||!!error} onChange={event=>{sessionStorage.setItem(storageKey,event.target.value);const next=new URLSearchParams(params);next.set('centre',event.target.value);setParams(next,{replace:true})}} className="bg-transparent text-xs sm:text-sm font-semibold text-ink max-w-full min-w-0 cursor-pointer">
        <option value="">{t('common.siteAllGroup')}</option>
        {value&&!sites.some(site=>site.code===value)&&<option value={value}>{user?.site?.name||value}</option>}
        {sites.map(site=><option key={site.code} value={site.code}>{site.name} · {site.location}</option>)}
      </select>
      {error&&<span role="alert" className="text-xs text-red">{t('common.siteLoadError')}</span>}
    </span>
  </label>
}
export default function UserSite({className=''}:{className?:string}){
  const {user}=useAuth();const t=useT()
  if(!user)return null
  if(user.role!=='worker')return <HRSite className={className}/>
  const label=user.site?.name||(user.role==='worker'?t('common.sitePending'):t('common.siteCorporate'))
  return <label className={`flex items-center gap-2 min-w-0 ${className}`} title={user.site?`${user.site.name} · ${user.site.location}`:label}>
    <MapPin size={16} aria-hidden className="shrink-0 text-red"/>
    <span className="flex flex-col min-w-0"><span className="text-[10px] uppercase tracking-wide text-ink-muted">{t('common.siteAssigned')}</span><select aria-label={t('common.siteAssignedAria')} value={user.site?.id||''} disabled className="bg-transparent text-xs sm:text-sm font-semibold text-ink truncate max-w-full disabled:opacity-100"><option value={user.site?.id||''}>{label}</option></select></span>
  </label>
}

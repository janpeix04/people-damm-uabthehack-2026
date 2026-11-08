import {createContext,useContext,useCallback,useEffect,useState,type ReactNode} from 'react'
import {Modal,cn} from './ui'
import {Check,Heart,ShieldCheck} from 'lucide-react'
import {useNavigate} from 'react-router-dom'
import ListeningSettings from './ListeningSettings'
import {listeningCall,type ListeningPrompt} from '../api/listening'
import {useApp} from '../store/AppContext'
import {translate,useT} from '../i18n'
import {useDemoText} from '../i18n/demo'

type State={day:string;answered:boolean;department_name:string}
async function call(action:string,body:object={}){
 const response=await fetch(`/api/app/${action}`,{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1'},body:JSON.stringify(body)})
 const data=await response.json()
 if(response.status===401)window.dispatchEvent(new Event('auth-expired'))
 if(!response.ok)throw new Error(data.error||translate('common.moodSaveError'))
 return data as State
}
const MOODS = [
  { value: 1, label: 'Molt malament', color: '#C8102E', soft: '#FBECEF', mouth: 'M14 31 Q22 23 30 31' },
  { value: 2, label: 'Malament', color: '#E46F2A', soft: '#FCEBDD', mouth: 'M15 30 Q22 25 29 30' },
  { value: 3, label: 'Normal', color: '#E8B321', soft: '#FFF4CC', mouth: 'M15 29 L29 29' },
  { value: 4, label: 'Bé', color: '#78A83B', soft: '#EDF5DF', mouth: 'M15 27 Q22 32 29 27' },
  { value: 5, label: 'Molt bé', color: '#2F7A4E', soft: '#E6F2EA', mouth: 'M14 26 Q22 35 30 26' },
] as const

type MoodContextValue={state:State|null;busy:boolean;error:string;retry:()=>void;save:(mood:number,department:boolean)=>Promise<boolean>}
const MoodContext=createContext<MoodContextValue|null>(null)

function MoodFace({item,size=46}:{item:(typeof MOODS)[number];size?:number}){
 return <svg className="mood-face h-9 w-9 sm:h-12 sm:w-12" width={size} height={size} viewBox="0 0 44 44" aria-hidden><circle cx="22" cy="22" r="20" fill={item.color}/><circle cx="15.5" cy="18" r="2.2" fill="white"/><circle cx="28.5" cy="18" r="2.2" fill="white"/><path d={item.mouth} stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round"/></svg>
}

export function DailyMoodPage(){
 const context=useContext(MoodContext)
 const [selected,setSelected]=useState<number|null>(null),[department,setDepartment]=useState(false)
 const state=context?.state
 useEffect(()=>{setSelected(null);setDepartment(false)},[state?.day])
 if(!context)return null
 const {busy,error,save,retry}=context
 const changed=selected!==null&&!state?.answered
 const canEdit=!!state&&!state.answered
 const mood=MOODS.find(item=>item.value===selected)
 return <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12 flex flex-col gap-7">
  <header className="flex items-start gap-4"><span className="hidden sm:grid w-12 h-12 rounded-2xl bg-red-soft place-items-center text-red-dk shrink-0"><Heart size={24}/></span><div><p className="eyebrow">El teu espai</p><h1 className="serif text-3xl sm:text-4xl mt-1">El meu estat d’ànim</h1><p className="text-sm text-ink-muted mt-2">Un moment per a tu. Comparteix com et sents, una vegada al dia i de manera voluntària.</p></div></header>
  <section className="card overflow-hidden" aria-label="Estat d’ànim d’avui">
   <div className="bg-red-soft/60 border-b border-line px-5 sm:px-7 py-4 flex items-center justify-between gap-3"><div><h2 className="font-bold">Com et sents avui?</h2><p className="text-xs text-ink-muted mt-1">{state?new Date(state.day+'T12:00:00').toLocaleDateString('ca-ES',{weekday:'long',day:'numeric',month:'long'}):'Carregant...'}</p></div>{state?.answered&&<span className="chip bg-white text-ink-soft gap-1"><Check size={13}/>Resposta registrada</span>}</div>
   <div className="p-5 sm:p-7 flex flex-col gap-6">
    {!state&&!error&&<p role="status">Carregant el teu estat...</p>}
    {!state?.answered&&<>
    <div className="grid grid-cols-5 gap-1.5 sm:gap-3" role="group" aria-label="Tria una careta">{MOODS.map(item=><button key={item.value} type="button" aria-pressed={selected===item.value} aria-label={item.label} disabled={!canEdit||busy} onClick={()=>setSelected(item.value)} className={cn('mood-choice relative min-w-0 rounded-2xl border-2 py-4 sm:py-5 px-1 flex flex-col items-center gap-3 disabled:opacity-50',selected===item.value?'shadow-card':'border-transparent hover:border-line')} style={{background:selected===item.value?item.soft:'transparent',borderColor:selected===item.value?item.color:undefined}}><MoodFace item={item} size={48}/><span className="text-[10px] sm:text-xs text-center break-words leading-tight font-semibold text-ink">{item.label}</span>{selected===item.value&&<span className="absolute top-1 right-1 rounded-full bg-white p-0.5 text-ink" aria-hidden><Check size={12}/></span>}</button>)}</div>
    <p className="text-sm text-center text-ink-soft" role="status">{mood?<><strong>{mood.label}</strong>{changed?' · Prem Enviar per registrar la resposta.':' · Una resposta voluntària al dia.'}</>:'Tria la cara que millor representa com et sents.'}</p>
    <div className="border-t border-line pt-5 flex flex-col gap-3"><div className="flex items-baseline justify-between gap-3"><span className="text-sm font-semibold">Departament</span><span className="text-sm text-ink-muted">{department?'Altres':state?.department_name||'...'}</span></div><label className="flex items-start gap-3 rounded-xl bg-cream/60 p-3 text-sm cursor-pointer"><input className="mt-0.5 accent-current" type="checkbox" checked={department} disabled={!canEdit||busy} onChange={event=>setDepartment(event.target.checked)}/><span>Prefereixo no especificar el departament</span></label></div>
    {error&&<div role="alert" className="rounded-xl bg-red-soft p-3 text-sm text-red-dk">{error}{!state&&<button className="btn-line ml-2" onClick={retry}>Reintentar</button>}</div>}
    <button className="btn-red self-stretch sm:self-end sm:min-w-[210px]" disabled={!canEdit||busy||!changed} onClick={()=>{if(selected!==null)void save(selected,department)}}>{busy?'Desant...':'Enviar el meu estat'}</button>
    </>}
    {state?.answered&&<div className="flex flex-col items-center text-center gap-3 py-5"><span className="grid place-items-center w-14 h-14 rounded-full bg-red-soft text-red-dk"><ShieldCheck size={28}/></span><h3 className="serif text-xl">Gràcies per compartir com et sents</h3><p className="text-sm text-ink-muted max-w-md">La resposta ja s’ha registrat. No la podem recuperar ni editar des del teu compte. Demà podràs tornar a participar.</p></div>}
   </div>
  </section>
  <p className="text-xs text-ink-muted flex items-start gap-2"><ShieldCheck size={16} className="shrink-0"/>El compte només conserva si has participat avui, sense guardar quina cara has triat. RRHH només veu resultats agregats amb mostra suficient.</p>
  <ListeningSettings />
 </div>
}

export default function DailyMood({children}:{children:ReactNode}){
 const navigate=useNavigate()
 const [reminder,setReminder]=useState<Extract<ListeningPrompt,{kind:'survey'}>|null>(null)
 const {toast}=useApp()
 const t=useT(),dx=useDemoText()
 const [state,setState]=useState<State|null>(null),[open,setOpen]=useState(false)
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const refresh=useCallback(()=>{
  if(document.visibilityState==='hidden')return
  call('mood-state').then(data=>{setState(data);setError('');}).catch(e=>setError(e.message))
 },[])
 useEffect(()=>{refresh();const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[refresh])
 useEffect(()=>{
  if(open||reminder)return
  let active=true,checking=false
  const check=async()=>{if(!active||checking||document.visibilityState==='hidden')return;checking=true;try{const {prompt}=await listeningCall<{prompt:ListeningPrompt|null}>({action:'prompt'});if(active&&prompt){if(prompt.kind==='mood')setOpen(true);else setReminder(prompt)}}catch{/* The manual listening page remains available when an automatic prompt cannot be checked. */}finally{checking=false}}
  void check();const timer=setInterval(check,60000);window.addEventListener('focus',check);document.addEventListener('visibilitychange',check)
  return()=>{active=false;clearInterval(timer);window.removeEventListener('focus',check);document.removeEventListener('visibilitychange',check)}
 },[open,reminder])
 const save=async(mood:number,department:boolean)=>{
  if(busy||!state||state.answered)return false
  setBusy(true);setError('')
  try{const data=await call('mood',{day:state.day,mood,unspecified:department,});setState(data);toast(t('common.moodSaved'));return true}
  catch(e){setError(e instanceof Error?e.message:t('common.connectionError'));return false}
  finally{setBusy(false)}
 }
 const dismiss=()=>setOpen(false)
 return <MoodContext.Provider value={{state,busy,error,retry:refresh,save}}>
  {children}
  <div className="worker-theme">
  <Modal open={open} onClose={dismiss} title={t('common.moodModalTitle')}>
   <div className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label={t('common.moodTodayAria')}>
    {MOODS.map(item=><button key={item.value} type="button" disabled={busy||!state||state.answered} aria-label={t(`common.mood${item.value}`)} aria-pressed={false} className="mood-choice min-w-0 rounded-2xl border-2 px-1 py-3 grid place-items-center disabled:opacity-50" style={{background:item.soft,borderColor:'transparent'}} onClick={async()=>{if(await save(item.value,false))setOpen(false)}}><svg className="mood-face" width="46" height="46" viewBox="0 0 44 44" aria-hidden><circle cx="22" cy="22" r="20" fill={item.color}/><circle cx="15.5" cy="18" r="2.2" fill="white"/><circle cx="28.5" cy="18" r="2.2" fill="white"/><path d={item.mouth} stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round"/></svg></button>)}
   </div>
   {error&&<p role="alert" className="text-sm text-red">{error}</p>}
   <button className="btn-line" disabled={busy} onClick={dismiss}>{t('common.notNow')}</button>
  </Modal>
  <Modal open={!!reminder} onClose={()=>setReminder(null)} title={t('common.reminderTitle')}>
   <p className="font-semibold">{dx(reminder?.title)}</p>
   <p className="text-sm text-ink-muted">{t('common.reminderBody')}</p>
   <div className="flex flex-wrap gap-2"><button className="btn-red" onClick={()=>{if(reminder){const survey=reminder.survey;setReminder(null);navigate(`/e/${survey}`)}}}>{t('common.reminderOpen')}</button><button className="btn-line" onClick={()=>setReminder(null)}>{t('common.notNow')}</button></div>
  </Modal>
  </div>
 </MoodContext.Provider>
}

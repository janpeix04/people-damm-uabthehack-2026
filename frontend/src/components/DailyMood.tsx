import {createContext,useContext,useCallback,useEffect,useState,type ReactNode} from 'react'
import {Modal} from './ui'
import {useAuth} from '../store/AuthContext'
import {useApp} from '../store/AppContext'

type State={day:string;answered:boolean;department_name:string;current_mood:number|null;unspecified:boolean;editable:boolean}
async function call(action:string,body:object={}){
 const response=await fetch(`/api/app/${action}`,{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1'},body:JSON.stringify(body)})
 const data=await response.json()
 if(response.status===401)window.dispatchEvent(new Event('auth-expired'))
 if(!response.ok)throw new Error(data.error||'No s’ha pogut guardar la resposta.')
 return data as State
}
const MOODS = [
  { value: 1, label: 'Molt malament', color: '#C8102E', soft: '#FBECEF', mouth: 'M14 31 Q22 23 30 31' },
  { value: 2, label: 'Malament', color: '#E46F2A', soft: '#FCEBDD', mouth: 'M15 30 Q22 25 29 30' },
  { value: 3, label: 'Normal', color: '#E8B321', soft: '#FFF4CC', mouth: 'M15 29 L29 29' },
  { value: 4, label: 'Bé', color: '#78A83B', soft: '#EDF5DF', mouth: 'M15 27 Q22 32 29 27' },
  { value: 5, label: 'Molt bé', color: '#2F7A4E', soft: '#E6F2EA', mouth: 'M14 26 Q22 35 30 26' },
] as const

type MoodContextValue={state:State|null;busy:boolean;error:string;unspecified:boolean;setUnspecified:(value:boolean)=>void;edit:()=>void;retry:()=>void}
const MoodContext=createContext<MoodContextValue|null>(null)

export function DailyMoodPage(){
 const value=useContext(MoodContext)
 if(!value)return null
 const {state,busy,error,unspecified,setUnspecified,edit,retry}=value
 const mood=MOODS.find(item=>item.value===state?.current_mood)
 return <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-6">
  <div><h1 className="serif text-3xl">El meu estat d’ànim</h1><p className="text-sm text-ink-muted mt-2">Comparteix com et sents avui. Pots modificar la resposta durant el mateix dia.</p></div>
  <section className="card p-5 sm:p-6 flex flex-col gap-5">
   <h2 className="serif text-2xl">Avui</h2>
   {!state&&!error&&<p role="status">Carregant l’estat d’ànim…</p>}
   {state&&<>
    {mood?<div className="flex items-center gap-4"><svg width="64" height="64" viewBox="0 0 44 44" aria-hidden><circle cx="22" cy="22" r="20" fill={mood.color}/><circle cx="15.5" cy="18" r="2.2" fill="white"/><circle cx="28.5" cy="18" r="2.2" fill="white"/><path d={mood.mouth} stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round"/></svg><strong>{mood.label}</strong></div>:<p>{state.answered?'Ja has compartit el teu estat avui.':'Encara no has indicat com et sents avui.'}</p>}
    <p className="text-sm">Departament: <strong>{unspecified?'Altres':state.department_name}</strong></p>
    <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={unspecified} disabled={busy||state.answered&&!state.editable} onChange={event=>setUnspecified(event.target.checked)}/>Prefereixo no especificar el departament</label>
    <p className="text-xs text-ink-muted">La selecció de departament es desa quan tries una careta. Damm World mostra resultats agregats amb almenys 10 respostes. Sense punts ni recompenses.</p>
    {state.answered&&!state.editable?<p className="text-sm text-ink-muted">Aquesta resposta es va guardar abans d’activar l’edició. Podràs editar les respostes noves.</p>:<button className="btn-red self-start" disabled={busy} onClick={edit}>{state.answered?'Editar estat d’ànim':'Indicar estat d’ànim'}</button>}
   </>}
   {error&&<div role="alert" className="text-sm text-red-dk">{error}<button className="btn-line ml-2" onClick={retry}>Reintentar</button></div>}
  </section>
 </div>
}

export default function DailyMood({children}:{children:ReactNode}){
 const {user}=useAuth()
 const {toast}=useApp()
 const dismissKey=`mood-dismissed:${user?.id}`
 const [state,setState]=useState<State|null>(null),[open,setOpen]=useState(false),[unspecified,setUnspecified]=useState(false)
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const refresh=useCallback(()=>{
  if(document.visibilityState==='hidden')return
  call('mood-state').then(data=>{setState(data);setUnspecified(!!data.unspecified);setError('');if(!data.answered){if(sessionStorage.getItem(dismissKey)!==data.day)setOpen(true)}}).catch(e=>setError(e.message))
 },[dismissKey])
 useEffect(()=>{refresh();const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[refresh])
 const dismiss=()=>{if(state)sessionStorage.setItem(dismissKey,state.day);setOpen(false)}
 return <MoodContext.Provider value={{state,busy,error,unspecified,setUnspecified,edit:()=>setOpen(true),retry:refresh}}>
  {children}
  <Modal open={open} onClose={dismiss} title="Com et sents avui?">
   <div className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label="Estat d’ànim d’avui">
    {MOODS.map(item=><button key={item.value} type="button" disabled={busy||!state} aria-label={item.label} aria-pressed={state?.current_mood===item.value} className="mood-choice min-w-0 rounded-2xl border-2 px-1 py-3 grid place-items-center disabled:opacity-50" style={{background:item.soft,borderColor:state?.current_mood===item.value?item.color:'transparent'}} onClick={async()=>{
      setBusy(true);setError('');try{const data=await call('mood',{day:state?.day,mood:item.value,unspecified,edit:!!state?.answered});setState(data);setOpen(false);toast('Resposta desada.')}catch(e){setError(e instanceof Error?e.message:'Error de connexió')}finally{setBusy(false)}
    }}><svg className="mood-face" width="46" height="46" viewBox="0 0 44 44" aria-hidden><circle cx="22" cy="22" r="20" fill={item.color}/><circle cx="15.5" cy="18" r="2.2" fill="white"/><circle cx="28.5" cy="18" r="2.2" fill="white"/><path d={item.mouth} stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round"/></svg></button>)}
   </div>
   {error&&<p role="alert" className="text-sm text-red">{error}</p>}
   <button className="btn-line" disabled={busy} onClick={dismiss}>Ara no</button>
  </Modal>
 </MoodContext.Provider>
}

import {useCallback,useEffect,useState} from 'react'
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

export default function DailyMood(){
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
 return <>
  <div className="border-b border-line bg-paper px-4 py-2 text-sm flex flex-wrap justify-center items-center gap-3">
   <span>{state?.answered?'El teu estat d’ànim d’avui': 'Com et sents avui?'}</span>
   <button className="font-bold text-red-dk disabled:opacity-50" disabled={!!state?.answered&&!state.editable} title={state?.answered&&!state.editable?'Les respostes antigues no es poden editar. La de demà sí.':undefined} onClick={()=>{setOpen(true);if(!state)refresh()}}>{state?.answered?'Editar estat d’ànim':'Indicar estat d’ànim'}</button>
   <details className="text-xs text-ink-muted"><summary className="cursor-pointer">Departament: {unspecified?'Altres':state?.department_name||'...'}</summary><label className="flex items-center gap-2 py-2"><input type="checkbox" checked={unspecified} disabled={busy} onChange={event=>setUnspecified(event.target.checked)}/>Prefereixo no especificar el departament</label></details>
   {error&&!open&&<span role="alert" className="text-red-dk">{error}</span>}
  </div>
  <Modal open={open} onClose={dismiss} title="Com et sents avui?">
   <div className="grid grid-cols-5 gap-1.5 sm:gap-2" aria-label="Estat d’ànim d’avui">
    {MOODS.map(item=><button key={item.value} type="button" disabled={busy||!state} aria-label={item.label} aria-pressed={state?.current_mood===item.value} className="mood-choice min-w-0 rounded-2xl border-2 px-1 py-3 grid place-items-center disabled:opacity-50" style={{background:item.soft,borderColor:state?.current_mood===item.value?item.color:'transparent'}} onClick={async()=>{
      setBusy(true);setError('');try{const data=await call('mood',{day:state?.day,mood:item.value,unspecified,edit:!!state?.answered});setState(data);setOpen(false);toast('Resposta desada.')}catch(e){setError(e instanceof Error?e.message:'Error de connexió')}finally{setBusy(false)}
    }}><svg className="mood-face" width="46" height="46" viewBox="0 0 44 44" aria-hidden><circle cx="22" cy="22" r="20" fill={item.color}/><circle cx="15.5" cy="18" r="2.2" fill="white"/><circle cx="28.5" cy="18" r="2.2" fill="white"/><path d={item.mouth} stroke="white" strokeWidth="2.3" fill="none" strokeLinecap="round"/></svg></button>)}
   </div>
   {error&&<p role="alert" className="text-sm text-red">{error}</p>}
   <button className="btn-line" disabled={busy} onClick={dismiss}>Ara no</button>
  </Modal>
 </>
}

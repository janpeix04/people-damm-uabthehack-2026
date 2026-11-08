import {useCallback,useEffect,useState} from 'react'
import {Modal} from './ui'
import {useAuth} from '../store/AuthContext'
import {useApp} from '../store/AppContext'

type State={day:string;answered:boolean;department_name:string}
async function call(action:string,body:object={}){
 const response=await fetch(`/api/app/${action}`,{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1'},body:JSON.stringify(body)})
 const data=await response.json()
 if(response.status===401)window.dispatchEvent(new Event('auth-expired'))
 if(!response.ok)throw new Error(data.error||'No s’ha pogut guardar la resposta.')
 return data as State
}
const faces=[['😞','Molt malament'],['🙁','Malament'],['😐','Normal'],['🙂','Bé'],['😄','Molt bé']]

export default function DailyMood(){
 const {user}=useAuth()
 const {toast}=useApp()
 const dismissKey=`mood-dismissed:${user?.id}`
 const [state,setState]=useState<State|null>(null),[open,setOpen]=useState(false),[unspecified,setUnspecified]=useState(false)
 const [busy,setBusy]=useState(false),[error,setError]=useState('')
 const refresh=useCallback(()=>{
  if(document.visibilityState==='hidden')return
  call('mood-state').then(data=>{setState(data);setError('');if(!data.answered){if(sessionStorage.getItem(dismissKey)!==data.day)setOpen(true)}else setOpen(false)}).catch(e=>setError(e.message))
 },[dismissKey])
 useEffect(()=>{refresh();const timer=setInterval(refresh,60000);window.addEventListener('focus',refresh);document.addEventListener('visibilitychange',refresh);return()=>{clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh)}},[refresh])
 const dismiss=()=>{if(state)sessionStorage.setItem(dismissKey,state.day);setOpen(false)}
 return <>
  {!state?.answered&&<div className="border-b border-line bg-paper px-4 py-2 text-sm flex flex-wrap justify-center items-center gap-3" role="status">
   {error||'Com et sents avui? Comparteix-ho si et ve de gust.'}
   <button className="font-bold text-red" onClick={()=>{setOpen(true);if(!state)refresh()}}>Indicar estat d’ànim</button>
  </div>}
  <Modal open={open} onClose={dismiss} title="Com et sents avui?">
   <p className="text-sm text-ink-muted">Una resposta voluntària al dia. Sense punts ni recompenses. Damm World mostra l’estat d’ànim agregat del teu centre i departament quan hi ha almenys 10 respostes.</p>
   <div className="grid grid-cols-5 gap-2">{faces.map(([face,label],index)=><button key={label} disabled={busy||!state} aria-label={label} className="rounded-2xl border border-line p-2 hover:bg-cream focus-visible:ring-2 focus-visible:ring-red disabled:opacity-50 flex flex-col items-center gap-2" onClick={async()=>{setBusy(true);setError('');try{const data=await call('mood',{day:state?.day,mood:index+1,unspecified});setState(data);setOpen(false);toast('Gràcies per compartir com et sents avui.')}catch(e){setError(e instanceof Error?e.message:'Error de connexió')}finally{setBusy(false)}}}><span className="text-3xl sm:text-4xl" aria-hidden>{face}</span><span className="text-xs">{label}</span></button>)}</div>
   <p className="text-xs text-ink-muted">Departament: {unspecified?'Altres':state?.department_name||'Carregant…'}</p>
   <label className="flex gap-2 items-center text-sm"><input type="checkbox" checked={unspecified} disabled={busy} onChange={event=>setUnspecified(event.target.checked)}/>Prefereixo no especificar el departament</label>
   {error&&<p role="alert" className="text-sm text-red">{error}</p>}
   <button className="btn-line" disabled={busy} onClick={dismiss}>Ara no</button>
  </Modal>
 </>
}

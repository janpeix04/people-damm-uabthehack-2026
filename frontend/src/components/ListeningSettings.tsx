import {useEffect,useState} from 'react'
import {listeningCall,type ListeningPreferences} from '../api/listening'

export default function ListeningSettings(){
 const [prefs,setPrefs]=useState<ListeningPreferences|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState('')
 useEffect(()=>{let active=true;listeningCall<ListeningPreferences>({action:'state'}).then(p=>{if(active)setPrefs(p)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 const save=async(pauseDays:0|7)=>{if(!prefs)return;setBusy(true);setError('');setSaved('');try{setPrefs(await listeningCall<ListeningPreferences>({action:'preferences',mood_frequency:prefs.mood_frequency,survey_reminders:prefs.survey_reminders,pauseDays}));setSaved(pauseDays?'Avisos pausats durant 7 dies.':'Preferències desades.')}catch(e){setError(e instanceof Error?e.message:'Error de connexió')}finally{setBusy(false)}}
 return <section className="card p-5 sm:p-6 flex flex-col gap-4" aria-label="Preferències d’avisos">
  <h2 className="serif text-2xl">Avisos i freqüència</h2><p className="text-sm text-ink-muted">Com a màxim, un avís automàtic al dia entre estat d’ànim i consultes. Sempre pots respondre voluntàriament des de l’app.</p>
  {!prefs&&!error&&<p role="status">Carregant preferències…</p>}
  {prefs&&<>
   <label className="text-sm font-bold">Recordar-me l’estat d’ànim<select className="input mt-1" disabled={busy} value={prefs.mood_frequency} onChange={event=>setPrefs({...prefs,mood_frequency:event.target.value as ListeningPreferences['mood_frequency']})}><option value="daily">Com a màxim una vegada al dia</option><option value="weekly">Com a màxim una vegada cada 7 dies</option><option value="off">Només quan jo hi entri</option></select></label>
   <label className="text-sm flex items-start gap-2"><input type="checkbox" disabled={busy} checked={prefs.survey_reminders} onChange={event=>setPrefs({...prefs,survey_reminders:event.target.checked})}/>Permetre recordatoris de consultes pendents dins la web</label>
   <p className="text-xs text-ink-muted">Màxim dos recordatoris per consulta i almenys 48 hores entre ells. No s’envien correus ni notificacions fora de la web.</p>
   {prefs.paused_until&&new Date(prefs.paused_until)>new Date()&&<p className="text-sm">Avisos pausats fins al {new Date(prefs.paused_until).toLocaleDateString('ca-ES')}.</p>}
   <div className="flex flex-wrap gap-2"><button className="btn-red" disabled={busy} onClick={()=>void save(0)}>{prefs.paused_until&&new Date(prefs.paused_until)>new Date()?'Desar i reprendre avisos':'Desar preferències'}</button><button className="btn-line" disabled={busy} onClick={()=>void save(7)}>Pausar avisos 7 dies</button></div>
  </>}
  {error&&<p role="alert" className="text-sm text-red-dk">{error}</p>}{saved&&<p role="status" className="text-sm text-ok-ink">{saved}</p>}
 </section>
}

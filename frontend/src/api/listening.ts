export interface ListeningPreferences {mood_frequency:'daily'|'weekly'|'off';survey_reminders:boolean;paused_until:string|null}
export type ListeningPrompt={kind:'mood'}|{kind:'survey';survey:string;title:string}
export async function listeningCall<T>(body:object):Promise<T>{
 const response=await fetch('/api/app/listening',{method:'POST',headers:{'Content-Type':'application/json','X-App-Request':'1'},body:JSON.stringify(body),signal:AbortSignal.timeout(15000)})
 if(response.status===401)window.dispatchEvent(new Event('auth-expired'))
 const data=await response.json();if(!response.ok)throw new Error(data.error||'No s’han pogut carregar les preferències.');return data as T
}

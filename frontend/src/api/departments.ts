import {useEffect,useState} from 'react'
export interface DepartmentOverview {code:string;name:string;headcount:number;responses:number;threshold:number;score:number|null;participants:number;participation:number;mood:'happy'|'uneasy'|'stressed'|'nodata';period:string|null}
export interface SiteSummary {code:string;name:string;location:string;type:string;category:string;headcount:number}

function useGet<T>(url:string,fallback:T,errorText:string){
 const [data,setData]=useState<T>(fallback),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null)
 useEffect(()=>{let active=true;const controller=new AbortController();setLoading(true);fetch(url,{signal:controller.signal}).then(async r=>{if(r.status===401)window.dispatchEvent(new Event('auth-expired'));const body=await r.json();if(!r.ok)throw new Error(body.error||errorText);if(active){setData(body);setError(null)}}).catch(e=>{if(active&&e.name!=='AbortError')setError(e.message)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false;controller.abort()}},[url])
 return {data,loading,error}
}
/** Departaments de tot el grup o, amb `site`, només d'aquell centre (la nota s'amaga per sota del llindar de privacitat). */
export function useDepartments(site?:string|null){
 const {data,loading,error}=useGet<DepartmentOverview[]>(site?`/api/hr/departments?site=${encodeURIComponent(site)}`:'/api/hr/departments',[],'Error carregant departaments')
 return {departments:data,loading,error}
}
/** Centres amb persones assignades, del més gran al més petit. */
export function useSites(){
 const {data,loading,error}=useGet<SiteSummary[]>('/api/hr/sites',[],'Error carregant centres')
 return {sites:data,loading,error}
}

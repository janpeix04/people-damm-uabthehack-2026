import {useCallback,useEffect,useState} from 'react'

export interface AnalyticsFilters {survey:string;site:string;department:string;shift:string;channel:string;dateRange:string}
export interface AnalyticsGroup {code:string;label:string;count:number;pct:number;score:number|null}
export interface AnalyticsQuestion {id:string;text:string;version:number;type:string;dimension:string;totalAnswers:number;isSuppressed:boolean;avgScore:number|null;distribution:{label:string;count:number;pct:number}[];shifts:AnalyticsGroup[]}
export interface AnalyticsData {
 source:'postgres';generatedAt:string;filters:AnalyticsFilters;
 forms:{id:string;title:string;responses:number;target:number;threshold:number}[];
 form:AnalyticsData['forms'][number]|null;
 options:{departments:{code:string;label:string}[];shifts:{code:string;label:string}[];channels:{code:string;label:string}[]};
 stats:{totalResponses:number;target:number;participationRate:number|null;threshold:number;isSuppressed:boolean;suppressionReason:string|null;avgScore:number|null;avgDurationSecs:number|null;
 channelBreakdown:AnalyticsGroup[];shiftBreakdown:AnalyticsGroup[];departmentBreakdown:AnalyticsGroup[];timeline:AnalyticsGroup[];
 dimensions:{label:string;count:number;score:number}[];questions:AnalyticsQuestion[];textResponses:number;notes:string[]}|null;
}
export function analyticsQuery(filters:AnalyticsFilters){return new URLSearchParams(Object.entries(filters).filter(([,v])=>v)).toString()}
export function useSurveyAnalytics(filters:AnalyticsFilters){
 const query=analyticsQuery(filters)
 const [result,setResult]=useState<{query:string;data:AnalyticsData}|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[version,setVersion]=useState(0)
 const refresh=useCallback(()=>setVersion(v=>v+1),[])
 useEffect(()=>{const controller=new AbortController();setLoading(true);setError('');fetch(`/api/hr/analytics?${query}`,{signal:controller.signal}).then(async response=>{
   if(response.status===401)window.dispatchEvent(new Event('auth-expired'))
   const data=await response.json();if(!response.ok)throw new Error(data.error||'No s’ha pogut carregar l’anàlisi.');if(!controller.signal.aborted)setResult({query,data})
 }).catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
 return()=>controller.abort()},[query,version])
 useEffect(()=>{const timer=setInterval(refresh,30000);const focus=()=>{if(document.visibilityState!=='hidden')refresh()};window.addEventListener('focus',focus);return()=>{clearInterval(timer);window.removeEventListener('focus',focus)}},[refresh])
 return {data:result?.query===query?result.data:null,error,loading,refresh}
}
export async function downloadAnalytics(filters:AnalyticsFilters){
 const response=await fetch(`/api/hr/analytics.csv?${analyticsQuery(filters)}`)
 if(!response.ok){const data=await response.json();throw new Error(data.error||'No s’ha pogut exportar el CSV.')}
 const url=URL.createObjectURL(await response.blob());const a=document.createElement('a');a.href=url;a.download='damm-analytics.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)
}

import {useState} from 'react'
import {useSearchParams} from 'react-router-dom'
import {PanelRightOpen, X} from 'lucide-react'
import {Scene3D} from '../../components/Scene3D'
import {MOODS} from '../../data/mock'
import {cn,fmt,Meter,PathIcon} from '../../components/ui'
import {useDepartments,useSites} from '../../api/departments'
import {useAuth} from '../../store/AuthContext'

// edificis antics de l'escena que pertanyen a cada departament (enllaços antics amb ?zona=)
const AREAS:Record<string,string[]>={fabrica:['envasat','malta','coccio','fermentacio'],logistica:['logistica'],comercial:['comercial'],oficina:['oficines'],others:['others']}
// colors tal com es veuen els fars a l'escena
const BEACON={happy:'#2E9E5B',uneasy:'#E3A21A',stressed:'#D83A2E',nodata:'#9AA3AE'} as const

export default function HRWorld(){
 const [q]=useSearchParams()
 const {user}=useAuth()
 // centre: el de l'enllaç, si no el centre assignat a la persona de RRHH, i si no tot el grup
 const site=q.get('centre')??user?.site?.code??''
 const {sites}=useSites()
 const {departments,loading,error}=useDepartments(site||null)
 const [selected,setSelected]=useState(q.get('departament')||Object.keys(AREAS).find(k=>AREAS[k].includes(q.get('zona')||''))||'fabrica')
 const [panelOpen,setPanelOpen]=useState(false)
 // només la primera càrrega bloqueja la pàgina: en canviar de centre l'escena es manté muntada
 if(loading&&!departments.length)return <p role="status" className="p-6">Carregant departaments…</p>
 if(error&&!departments.length)return <p role="alert" className="p-6">{error}</p>
 const siteInfo=sites.find(s=>s.code===site)
 const absent=(d:{headcount:number;responses:number})=>!!site&&d.headcount===0&&d.responses===0
 // si el departament triat no existeix en aquest centre, es mostra el més gran dels que sí que hi són
 const picked=departments.find(d=>d.code===selected)
 const department=picked&&!absent(picked)?picked:[...departments].sort((a,b)=>b.headcount-a.headcount).find(d=>!absent(d))||picked||departments[0]
 const pins=departments.filter(d=>AREAS[d.code]).map(d=>({key:d.code,name:d.name,score:d.score===null?'?':fmt(d.score),moodLabel:MOODS[d.mood].label,mood:d.mood,bg:MOODS[d.mood].bg,ink:MOODS[d.mood].ink,path:MOODS[d.mood].path,participation:d.participation,alerts:d.mood==='stressed'?1:0,absent:absent(d)}))
 if(!department)return <p className="p-6">No hi ha departaments disponibles.</p>
 const mood=MOODS[department.mood]
 const here=siteInfo?siteInfo.name:'tot el grup'
 return <div className="relative flex h-full min-h-0 overflow-hidden">
  <div className="relative flex-1 min-w-0 min-h-0">
   <Scene3D kind="world" className="absolute inset-0" zones={pins} initialZone={department.code} onZone={code=>{if(code===department.code)return;setSelected(code);setPanelOpen(true)}} ariaLabel={`Damm World: departaments de ${here}, amb un far a cada edifici que indica l’emoció predominant i la participació`}/>
   <div className="absolute left-3 top-3 sm:left-4 sm:top-4 bg-paper/95 border border-line rounded-[16px] px-4 py-3 w-[min(340px,calc(100%-76px))]">
    <h1 className="serif text-[24px] leading-none">Damm World</h1>
    <p className="text-xs text-ink-muted mt-1.5">{loading?'Actualitzant…':siteInfo?`${siteInfo.type} · ${siteInfo.headcount} persones`:'Arrossega per girar · toca un edifici'}</p>
   </div>
   <button className="sm:hidden absolute right-3 top-3 btn-line !w-11 !px-0 bg-paper" aria-label="Obrir panell de departaments" aria-expanded={panelOpen} aria-controls="world-departments" onClick={()=>setPanelOpen(true)}><PanelRightOpen size={20}/></button>
  </div>
  <aside id="world-departments" aria-label="Departaments de Damm World" className={cn('absolute right-0 top-0 bottom-0 z-20 w-[min(320px,88vw)] sm:relative sm:inset-auto sm:w-[280px] xl:w-[320px] shrink-0 min-h-0 overflow-y-auto border-l border-line bg-white p-4 flex-col gap-5',panelOpen?'flex':'hidden sm:flex')}>
   <header className="flex items-center justify-between gap-2"><div><h2 className="serif text-xl">Departaments</h2><p className="text-xs text-ink-muted">{siteInfo?`${siteInfo.name} (${siteInfo.location})`:'Tot el grup Damm'}</p></div><button className="sm:hidden btn-line !w-9 !h-9 !px-0" aria-label="Tancar panell" onClick={()=>setPanelOpen(false)}><X size={18}/></button></header>
   <nav aria-label="Selecciona un departament" className="grid grid-cols-2 gap-2">{departments.map(d=><button key={d.code} aria-pressed={department.code===d.code} className={cn(department.code===d.code?'btn-ink !h-10 !px-2 !text-xs':'btn-line !h-10 !px-2 !text-xs',absent(d)&&department.code!==d.code&&'opacity-50')} onClick={()=>setSelected(d.code)}>{d.name}</button>)}</nav>
   {absent(department)
    ?<section className="border-t-2 border-line pt-4 flex flex-col gap-2"><p className="eyebrow">Departament seleccionat</p><h3 className="serif text-2xl">{department.name}</h3><p className="text-sm text-ink-soft">{siteInfo?.name} no té persones de {department.name} assignades. Tria un altre centre o mira tot el grup.</p></section>
    :<section className="border-t-2 pt-4 flex flex-col gap-4" style={{borderColor:mood.ink}}>
     <div className="flex justify-between gap-3"><div><p className="eyebrow">Departament seleccionat</p><h3 className="serif text-2xl mt-1">{department.name}</h3></div><PathIcon d={mood.path} color={mood.ink} size={28}/></div>
     <p className="text-sm"><strong>{department.score===null?'Sense dades publicables':fmt(department.score)+' / 10'}</strong> · {mood.label}</p>
     <div><div className="flex justify-between gap-2 text-sm mb-2"><span>Participació</span><strong>{department.participation}%</strong></div><Meter value={department.participation}/></div>
     <p className="text-sm">{department.headcount} persones · {department.responses} respostes</p>
     <p className="text-xs leading-relaxed text-ink-muted">{department.days>1?`Estat d’ànim dels darrers ${department.days} dies`:'Estat d’ànim d’avui'}{siteInfo?`, només ${siteInfo.name}`:''}. {department.score===null?`Resultat ocult: calen almenys ${department.threshold} respostes${siteInfo?' en aquest centre':''} per protegir l’anonimat.`:'Mitjana de les cinc caretes, expressada de 0 a 10. Es renova cada dia.'}</p>
    </section>}
   <div className="mt-auto border-t border-line pt-3 flex flex-col gap-1.5 text-xs text-ink-soft">
    <div className="flex flex-wrap gap-x-3 gap-y-1"><span className="font-semibold text-ink">Far:</span>{(['happy','uneasy','stressed','nodata'] as const).map(w=><span key={w} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{background:BEACON[w]}}/>{MOODS[w].label}</span>)}</div>
    <span>Got = participació · ⚠ = alerta</span>
   </div>
  </aside>
 </div>
}

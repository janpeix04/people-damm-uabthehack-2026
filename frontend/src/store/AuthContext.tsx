import {createContext,useContext,useEffect,useState,type ReactNode} from 'react'
import {Navigate,useLocation} from 'react-router-dom'
export interface UserSite {id:string;code:string;name:string;location:string}
export interface AuthUser {id:string;email:string;name:string;role:'worker'|'hr_admin'|'hr_analyst';site:UserSite|null}
async function request(path:string,body?:object){
  const r=await fetch(`/api/auth/${path}`,{method:body?'POST':'GET',headers:{'Content-Type':'application/json','X-App-Request':'1'},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(15000)})
  const data=await r.json();if(!r.ok)throw new Error(data.error||'No s’ha pogut iniciar sessió.');return data
}
const AuthContext=createContext<{user:AuthUser|null;loading:boolean;error:string|null;refresh:()=>Promise<void>;signIn:(email:string,password:string)=>Promise<void>;signOut:()=>Promise<void>}|null>(null)
export function AuthProvider({children}:{children:ReactNode}){
  const [user,setUser]=useState<AuthUser|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState<string|null>(null)
  const refresh=async()=>{setLoading(true);try{setUser((await request('session')).user);setError(null)}catch{setUser(null);setError('No es pot connectar amb el servidor.')}finally{setLoading(false)}}
  useEffect(()=>{void refresh();const expired=()=>{setUser(null)};window.addEventListener('auth-expired',expired);return()=>window.removeEventListener('auth-expired',expired)},[])
  return <AuthContext.Provider value={{user,loading,error,refresh,signIn:async(email,password)=>{const data=await request('login',{email,password});setUser(data.user);setError(null)},signOut:async()=>{await request('logout',{});setUser(null)}}}>{children}</AuthContext.Provider>
}
export function useAuth(){const value=useContext(AuthContext);if(!value)throw new Error('AuthProvider missing');return value}
export function RequireAuth({hr=false,children}:{hr?:boolean;children:ReactNode}){
  const {user,loading,error,refresh}=useAuth();const location=useLocation()
  if(loading)return <p role="status" className="p-8">Comprovant sessió…</p>
  if(error)return <div role="alert" className="p-8">{error} <button className="btn-line" onClick={()=>void refresh()}>Reintentar</button></div>
  if(!user)return <Navigate to="/login" state={{from:location.pathname}} replace/>
  if(hr?user.role==='worker':user.role!=='worker')return <Navigate to={user.role==='worker'?'/app':'/rrhh'} replace/>
  return <>{children}</>
}
export function SessionButton(){const {user,signOut}=useAuth();const [error,setError]=useState('');return <div className="flex gap-2 items-center text-xs"><span>{user?.name}</span><button className="btn-line !h-9" onClick={async()=>{try{await signOut()}catch{setError('No s’ha pogut tancar sessió. Torna-ho a provar.')}}}>Sortir</button>{error&&<span role="alert">{error}</span>}</div>}

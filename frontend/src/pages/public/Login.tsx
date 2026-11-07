import {useState} from 'react'
import {Link,Navigate,useLocation} from 'react-router-dom'
import {useAuth} from '../../store/AuthContext'
import {ArrowLeft, ArrowRight, Eye, EyeOff} from 'lucide-react'
export default function Login(){
  const {user,loading,signIn}=useAuth();const location=useLocation()
  const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('')
  const [showPassword,setShowPassword]=useState(false)
  const hr=typeof location.state?.from==='string'&&location.state.from.startsWith('/rrhh')
  if(loading)return <p className="p-8">Comprovant sessió…</p>
  if(user){const from=location.state?.from;const prefix=user.role==='worker'?'/app':'/rrhh';const target=typeof from==='string'&&(from===prefix||from.startsWith(prefix+'/')||(user.role==='worker'&&from.startsWith('/e/')))?from:prefix;return <Navigate to={target} replace/>}
  return <main className="people-login min-h-[100dvh] bg-cream text-ink px-4 py-6 sm:px-6 sm:py-10">
    <div className="mx-auto w-full max-w-[980px]">
      <header className="flex items-center justify-between gap-5 mb-6 sm:mb-10">
        <Link to="/" aria-label="People Damm, inici" className="shrink-0"><img src="/logo-people-damm.png" alt="People Damm" width="1665" height="944" className="block w-[132px] sm:w-[172px] h-auto object-contain" /></Link>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-ink"><ArrowLeft size={16} aria-hidden/>Tornar a l’inici</Link>
      </header>
      <section className="people-login-panel" aria-labelledby="login-title">
        <aside className={`people-login-visual ${hr?'people-login-visual--hr':''}`}>
          <div className="people-login-halo" aria-hidden/>
          <img src={hr?'/images/landing/portal-rrhh.png':'/images/landing/app-treballador.png'} alt="" width="1254" height="1254" className="people-login-character"/>
          <div className="people-login-caption"><span className="eyebrow">People Damm</span><h2>{hr?'Portal RRHH':'El teu espai'}</h2><p>{hr?'Escoltar millor, actuar abans.':'La teva veu també mou Damm.'}</p></div>
        </aside>
        <div className="people-login-form-wrap">
          <form className="flex flex-col gap-5" onSubmit={async e=>{e.preventDefault();setBusy(true);setError('');try{await signIn(email,password)}catch(e){setError(e instanceof Error?e.message:'Error de connexió')}finally{setBusy(false)}}}>
            <div className="mb-1"><p className="eyebrow !text-red mb-2">{hr?'Accés al portal RRHH':'Benvingut de nou'}</p><h1 id="login-title" className="serif text-[30px] sm:text-[36px] leading-tight">Inicia sessió</h1><p className="text-sm text-ink-muted mt-2">Entra amb el teu compte de People Damm.</p></div>
            <label htmlFor="login-email" className="text-sm font-semibold">Correu electrònic<input id="login-email" className="input mt-2 !h-12 !bg-white" type="email" autoComplete="username" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} /></label>
            <div><label htmlFor="login-password" className="text-sm font-semibold">Contrasenya</label><div className="relative mt-2"><input id="login-password" className="input !h-12 !pr-12 !bg-white" type={showPassword?'text':'password'} autoComplete="current-password" required maxLength={128} value={password} onChange={e=>setPassword(e.target.value)} /><button type="button" aria-label={showPassword?'Amagar contrasenya':'Mostrar contrasenya'} aria-pressed={showPassword} className="absolute right-1 top-1 h-10 w-10 grid place-items-center rounded-lg text-ink-muted hover:bg-cream" onClick={()=>setShowPassword(s=>!s)}>{showPassword?<EyeOff size={18}/>:<Eye size={18}/>}</button></div></div>
            {error&&<p role="alert" className="text-sm text-red-dk bg-red-soft p-3 rounded-xl">{error}</p>}
            <button disabled={busy} className="btn-red !h-12 !shadow-none mt-1">{busy?'Entrant…':'Entrar'}<ArrowRight size={17} aria-hidden/></button>
            <p className="text-xs leading-relaxed text-ink-muted pt-2 border-t border-line">Necessites accés? Demana el teu compte a l’administrador.</p>
          </form>
        </div>
      </section>
    </div>
  </main>
}

import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
import { AuthProvider, RequireAuth, useAuth } from './store/AuthContext'
import { I18nProvider, useT } from './i18n'
import Login from './pages/public/Login'
import HRLayout from './components/HRLayout'
import WorkerLayout from './components/WorkerLayout'
import Landing from './pages/public/Landing'
import Enquesta from './pages/public/Enquesta'
import Cartell from './pages/public/Cartell'
import HRInici from './pages/hr/Inici'
import Enquestes from './pages/hr/Enquestes'
import Detall from './pages/hr/Detall'
import Crear from './pages/hr/Crear'
import Analisi from './pages/hr/Analisi'
import Teams from './pages/hr/Teams'
import WorkerInici from './pages/worker/Inici'
import WorkerEnquestes from './pages/worker/Enquestes'
import Recompenses from './pages/worker/Recompenses'

// Les pantalles 3D carreguen three.js només quan cal.
const HRWorld = lazy(() => import('./pages/hr/World'))
const HRPlaca = lazy(() => import('./pages/hr/Placa'))
const WorkerPlaca = lazy(() => import('./pages/worker/Placa'))

function Loading() {
  const t = useT()
  return (
  <div className="min-h-[60vh] grid place-items-center px-6" role="status" aria-label={t('common.loading')}>
    <div className="w-full max-w-sm rounded-[16px] border border-line bg-paper p-6 shadow-card">
      <div className="skeleton-bar h-4 w-24" />
      <div className="skeleton-bar mt-5 h-9 w-4/5" />
      <div className="skeleton-bar mt-3 h-3 w-full" />
      <div className="skeleton-bar mt-2 h-3 w-2/3" />
    </div>
  </div>
  )
}

export default function App() {
  return <I18nProvider><AuthProvider><AuthenticatedApp /></AuthProvider></I18nProvider>
}
function AuthenticatedApp() {
  const {user}=useAuth()
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppProvider key={user?.id || 'anonymous'}>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/e/:id" element={<RequireAuth><Enquesta /></RequireAuth>} />
            <Route path="/cartell/:id" element={<RequireAuth hr><Cartell /></RequireAuth>} />
            <Route path="/rrhh" element={<RequireAuth hr><HRLayout /></RequireAuth>}>
              <Route index element={<HRInici />} />
              <Route path="enquestes" element={<Enquestes />} />
              <Route path="enquestes/:id" element={<Detall />} />
              <Route path="crear" element={<Crear />} />
              <Route path="analisi" element={<Analisi />} />
              <Route path="directori" element={<Teams />} />
              <Route path="teams" element={<Navigate to="/rrhh/directori" replace />} />
              <Route path="world" element={<HRWorld />} />
              <Route path="placa" element={<HRPlaca />} />
            </Route>
            <Route path="/app" element={<RequireAuth><WorkerLayout /></RequireAuth>}>
              <Route index element={<WorkerInici />} />
              <Route path="enquestes" element={<WorkerEnquestes />} />
              <Route path="placa" element={<WorkerPlaca />} />
              <Route path="recompenses" element={<Recompenses />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppProvider>
    </HashRouter>
  )
}

import { lazy, Suspense } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppProvider } from './store/AppContext'
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
import WorkerInici from './pages/worker/Inici'
import HemFet from './pages/worker/HemFet'
import Recompenses from './pages/worker/Recompenses'

// Les pantalles 3D carreguen three.js només quan cal.
const HRWorld = lazy(() => import('./pages/hr/World'))
const HRPlaca = lazy(() => import('./pages/hr/Placa'))
const WorkerPlaca = lazy(() => import('./pages/worker/Placa'))
const WorkerWorld = lazy(() => import('./pages/worker/World'))

const Loading = () => <div className="h-full min-h-[60vh] grid place-items-center serif text-2xl">Carregant…</div>

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/e/:id" element={<Enquesta />} />
            <Route path="/cartell/:id" element={<Cartell />} />
            <Route path="/rrhh" element={<HRLayout />}>
              <Route index element={<HRInici />} />
              <Route path="enquestes" element={<Enquestes />} />
              <Route path="enquestes/:id" element={<Detall />} />
              <Route path="crear" element={<Crear />} />
              <Route path="analisi" element={<Analisi />} />
              <Route path="world" element={<HRWorld />} />
              <Route path="placa" element={<HRPlaca />} />
            </Route>
            <Route path="/app" element={<WorkerLayout />}>
              <Route index element={<WorkerInici />} />
              <Route path="placa" element={<WorkerPlaca />} />
              <Route path="world" element={<WorkerWorld />} />
              <Route path="hem-fet" element={<HemFet />} />
              <Route path="recompenses" element={<Recompenses />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </HashRouter>
    </AppProvider>
  )
}

import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import AppLayout from './components/layout/AppLayout'
import Toast from './components/ui/Toast'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import ClientList from './pages/Clients/ClientList'
import ClientDetail from './pages/Clients/ClientDetail'
import ProjectList from './pages/Projects/ProjectList'
import ProjectDetail from './pages/Projects/ProjectDetail'
import KanbanBoard from './pages/Board/KanbanBoard'
import FinanceDashboard from './pages/Finance/FinanceDashboard'
import InvoiceDetail from './pages/Finance/InvoiceDetail'
import Settings from './pages/Settings/Settings'

function PrivateRoute({ children }) {
  const session = useAuthStore((state) => state.session)
  const loading = useAuthStore((state) => state.loading)

  if (loading) return <div className="page">Cargando...</div>
  if (!session) return <Navigate to="/login" replace />
  return children
}

function App() {
  const init = useAuthStore((state) => state.init)

  useEffect(() => {
    init()
  }, [init])

  return (
    <>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/clients" element={<ClientList />} />
          <Route path="/clients/:id" element={<ClientDetail />} />
          <Route path="/projects" element={<ProjectList />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/board" element={<KanbanBoard />} />
          <Route path="/finance" element={<FinanceDashboard />} />
          <Route path="/finance/invoices/:id" element={<InvoiceDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  )
}

export default App

import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/useAuthStore'
import { useCurrentUser } from './hooks/useCurrentUser'
import AppLayout from './components/layout/AppLayout'
import Toast from './components/ui/Toast'
import Skeleton from './components/ui/Skeleton'
import Landing from './pages/Landing/Landing'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import ClientList from './pages/Clients/ClientList'
import ClientDetail from './pages/Clients/ClientDetail'
import ProjectList from './pages/Projects/ProjectList'
import ProjectDetail from './pages/Projects/ProjectDetail'
import KanbanBoard from './pages/Board/KanbanBoard'
import FinanceDashboard from './pages/Finance/FinanceDashboard'
import InvoiceDetail from './pages/Finance/InvoiceDetail'
import AccountList from './pages/Accounts/AccountList'
import DocList from './pages/Docs/DocList'
import Team from './pages/Team/Team'
import Profile from './pages/Profile/Profile'
import Settings from './pages/Settings/Settings'
import ContentCalendar from './pages/Content/ContentCalendar'
import CampaignList from './pages/Campaigns/CampaignList'
import MediaLibrary from './pages/Media/MediaLibrary'
import CalendarPage from './pages/Calendar/CalendarPage'
import AdsOverview from './pages/Ads/AdsOverview'
import CampaignMetricsDetail from './pages/Ads/CampaignMetricsDetail'

function FullPageLoading() {
  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Skeleton width="120px" height="14px" />
    </div>
  )
}

function PrivateRoute({ children }) {
  const session = useAuthStore((state) => state.session)
  const loading = useAuthStore((state) => state.loading)

  if (loading) return <FullPageLoading />
  if (!session) return <Navigate to="/login" replace />
  return children
}

function RoleRoute({ roles, children }) {
  const { data: currentUser, isLoading } = useCurrentUser()

  if (isLoading) return <FullPageLoading />
  if (!currentUser || !roles.includes(currentUser.role)) {
    return <Navigate to="/app" replace />
  }
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
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <AppLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="clients" element={<RoleRoute roles={['owner', 'pm']}><ClientList /></RoleRoute>} />
          <Route path="clients/:id" element={<RoleRoute roles={['owner', 'pm']}><ClientDetail /></RoleRoute>} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="board" element={<KanbanBoard />} />
          <Route path="finance" element={<RoleRoute roles={['owner']}><FinanceDashboard /></RoleRoute>} />
          <Route path="finance/invoices/:id" element={<RoleRoute roles={['owner']}><InvoiceDetail /></RoleRoute>} />
          <Route path="accounts" element={<RoleRoute roles={['owner']}><AccountList /></RoleRoute>} />
          <Route path="content" element={<ContentCalendar />} />
          <Route path="campaigns" element={<CampaignList />} />
          <Route path="ads" element={<AdsOverview />} />
          <Route path="ads/:id" element={<CampaignMetricsDetail />} />
          <Route path="media" element={<MediaLibrary />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="docs" element={<DocList />} />
          <Route path="team" element={<RoleRoute roles={['owner', 'pm']}><Team /></RoleRoute>} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<RoleRoute roles={['owner']}><Settings /></RoleRoute>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
    </>
  )
}

export default App

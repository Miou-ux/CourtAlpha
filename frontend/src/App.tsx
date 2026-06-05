import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { useDashboardData } from './hooks/useDashboardData'
import { BacktestPage } from './pages/BacktestPage'
import { LivePage } from './pages/LivePage'
import { LoginPage } from './pages/LoginPage'
import { ParisPage } from './pages/ParisPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { Top5Page } from './pages/Top5Page'
import { TopProbasPage } from './pages/TopProbasPage'
import { TrackingPage } from './pages/TrackingPage'

function AppRoutes({ data }: { data: ReturnType<typeof useDashboardData> }) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Navigate to="/live" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live"
        element={
          <ProtectedRoute>
            <LivePage scanned={data.meta?.n_scanned ?? 0} bootstrapLoading={data.loading} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paris"
        element={
          <ProtectedRoute>
            <ParisPage
              picks={data.picks}
              scanned={data.meta?.n_scanned ?? 0}
              loading={data.loading}
              onBetSuccess={data.refetchAll}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/top5"
        element={
          <ProtectedRoute>
            <Top5Page picks={data.top5} pool={data.meta?.n_matches_today ?? 0} loading={data.loading} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/top-probas"
        element={
          <ProtectedRoute>
            <TopProbasPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/portfolio"
        element={
          <ProtectedRoute>
            <PortfolioPage
              summary={data.portfolio}
              bets={data.bets}
              loading={data.loading}
              onRefresh={data.refetchAll}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/backtest"
        element={
          <ProtectedRoute adminOnly>
            <BacktestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/tracking"
        element={
          <ProtectedRoute adminOnly>
            <TrackingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute adminOnly>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

function App() {
  const location = useLocation()
  const data = useDashboardData()
  const isLogin = location.pathname === '/login'

  if (isLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-white">
        <div className="w-full max-w-md">
          <AppRoutes data={data} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-white md:grid md:grid-cols-[280px_1fr]">
      <Sidebar counts={{ live: data.matches.length, paris: data.picks.length, top5: data.top5.length }} />
      <div className="min-w-0">
        <Header meta={data.meta} portfolio={data.portfolio} />
        <main className="px-4 py-5 md:px-6 md:py-6">
          {data.error && (
            <p className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{data.error}</p>
          )}
          <AppRoutes data={data} />
        </main>
      </div>
    </div>
  )
}

export default App

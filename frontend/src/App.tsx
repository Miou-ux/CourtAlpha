import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Header } from './components/layout/Header'
import { MobileBottomNav } from './components/layout/MobileBottomNav'
import { Sidebar } from './components/layout/Sidebar'
import { useDashboardData } from './hooks/useDashboardData'
import { BacktestPage } from './pages/BacktestPage'
import { LivePage } from './pages/LivePage'
import { LoginPage } from './pages/LoginPage'
import { ParisPage } from './pages/ParisPage'
import { PortfolioPage } from './pages/PortfolioPage'
import { ProfilePage } from './pages/ProfilePage'
import { SettingsPage } from './pages/SettingsPage'
import { FrequentationPage } from './pages/FrequentationPage'
import { OneDayOnePickPage } from './pages/OneDayOnePickPage'
import { usePageSeo } from './hooks/usePageSeo'
import { usePageViewAnalytics } from './hooks/usePageViewAnalytics'
import { Top5Page } from './pages/Top5Page'
import { TopProbasPage } from './pages/TopProbasPage'
import { TrackingPage } from './pages/TrackingPage'
import { PricingPage } from './pages/PricingPage'
import { MethodoPage } from './pages/MethodoPage'
import { OneDayOnePickArchivePage } from './pages/OneDayOnePickArchivePage'

function ResetTokenRedirect() {
  const location = useLocation()
  const token = new URLSearchParams(location.search).get('reset_token')
  if (token && location.pathname !== '/login') {
    return <Navigate to={`/login?reset_token=${encodeURIComponent(token)}`} replace />
  }
  return null
}

function AppRoutes({ data }: { data: ReturnType<typeof useDashboardData> }) {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/1-day-1-pick" replace />} />
      <Route
        path="/pricing"
        element={
          <ProtectedRoute requireAuth={false}>
            <PricingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/live"
        element={
          <ProtectedRoute premiumOnly>
            <LivePage scanned={data.meta?.n_scanned ?? 0} bootstrapLoading={data.loading} />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paris"
        element={
          <ProtectedRoute premiumOnly>
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
          <ProtectedRoute premiumOnly>
            <Top5Page
              picks={data.top5}
              pool={data.meta?.n_matches_today ?? 0}
              loading={data.loading}
              onBetSuccess={data.refetchAll}
            />
          </ProtectedRoute>
        }
      />
      <Route
        path="/1-day-1-pick"
        element={
          <ProtectedRoute requireAuth={false}>
            <OneDayOnePickPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/1-day-1-pick/archive"
        element={
          <ProtectedRoute requireAuth={false}>
            <OneDayOnePickArchivePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/1-day-1-pick/archive/:yearMonth"
        element={
          <ProtectedRoute requireAuth={false}>
            <OneDayOnePickArchivePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/methodo"
        element={
          <ProtectedRoute requireAuth={false}>
            <MethodoPage />
          </ProtectedRoute>
        }
      />
      <Route path="/methodologie" element={<Navigate to="/methodo" replace />} />
      <Route path="/track-record" element={<Navigate to="/1-day-1-pick" replace />} />
      <Route path="/top1-historique" element={<Navigate to="/1-day-1-pick" replace />} />
      <Route
        path="/top-probas"
        element={
          <ProtectedRoute premiumOnly>
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
        path="/frequentation"
        element={
          <ProtectedRoute adminOnly>
            <FrequentationPage />
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
  usePageSeo()
  usePageViewAnalytics()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const isLogin = location.pathname === '/login'

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = mobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileNavOpen])

  if (isLogin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg px-4 py-10 text-white">
        <ResetTokenRedirect />
        <div className="w-full max-w-md">
          <AppRoutes data={data} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg text-white md:grid md:grid-cols-[280px_1fr]">
      <ResetTokenRedirect />
      {mobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          aria-label="Fermer le menu"
          onClick={() => setMobileNavOpen(false)}
        />
      )}
      <Sidebar
        counts={{ live: data.matches.length, paris: data.picks.length, top5: data.top5.length }}
        mobileOpen={mobileNavOpen}
        onNavigate={() => setMobileNavOpen(false)}
      />
      <div className="flex min-h-screen min-w-0 flex-col">
        <Header
          meta={data.meta}
          portfolio={data.portfolio}
          showBankroll={!!data.user}
          onMenuClick={() => setMobileNavOpen(true)}
        />
        <main className="flex-1 px-3 py-4 pb-20 sm:px-4 sm:py-5 md:px-6 md:py-6 md:pb-6">
          {data.error && (
            <p className="mb-4 rounded-xl border border-danger/40 bg-danger/10 px-4 py-3 text-sm text-danger">{data.error}</p>
          )}
          <AppRoutes data={data} />
        </main>
        <MobileBottomNav onMenuClick={() => setMobileNavOpen(true)} />
      </div>
    </div>
  )
}

export default App

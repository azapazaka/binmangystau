// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, Navigate, Outlet, RouterProvider, useLocation } from 'react-router'
import './index.css'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Pages
import AdminMapPage from '@/pages/admin/AdminMapPage'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminWasteContainersPage from '@/pages/admin/AdminWasteContainersPage'
import LoginPage from '@/pages/auth/LoginPage'
import LandingPage from '@/pages/LandingPage'
import CitizenHomePage from '@/pages/citizen/CitizenHomePage'
import CitizenMapPage from '@/pages/citizen/CitizenMapPage'
import CitizenMyReportsPage from '@/pages/citizen/CitizenMyReportsPage'
import CitizenSettingsPage from '@/pages/citizen/CitizenSettingsPage'
import CitizenVerifyPage from '@/pages/citizen/CitizenVerifyPage'
import ReportWizard from '@/pages/citizen/ReportWizard'

function RequireAuth({ role }: { role: 'citizen' | 'admin' }) {
  const { user, loading } = useAuth()
  const loc = useLocation()

  if (loading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Загрузка…</div>
  }

  if (!user) return <Navigate to={`/login/${role}`} state={{ from: loc }} replace />
  if (user.role !== role) return <Navigate to={`/login/${user.role}`} replace />

  if (role === 'citizen') return <Outlet />

  return (
    <AppShell role={role}>
      <Outlet />
    </AppShell>
  )
}

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/login/:role', element: <LoginPage /> },
  {
    element: <RequireAuth role="admin" />,
    children: [
      { path: '/admin', element: <AdminOverview /> },
      { path: '/admin/map', element: <AdminMapPage /> },
      { path: '/admin/waste', element: <AdminWasteContainersPage /> },
    ],
  },
  {
    element: <RequireAuth role="citizen" />,
    children: [
      { path: '/citizen', element: <CitizenHomePage /> },
      { path: '/citizen/map', element: <CitizenMapPage /> },
      { path: '/citizen/report', element: <ReportWizard /> },
      { path: '/citizen/my-reports', element: <CitizenMyReportsPage /> },
      { path: '/citizen/verify', element: <CitizenVerifyPage /> },
      { path: '/citizen/profile', element: <CitizenSettingsPage /> },
      { path: '/citizen/settings', element: <CitizenSettingsPage /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)

// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, Navigate, Outlet, useLocation } from 'react-router'
import './index.css'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// Pages
import LoginPage from '@/pages/auth/LoginPage'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminMapPage from '@/pages/admin/AdminMapPage'
import ReportWizard from '@/pages/citizen/ReportWizard'
import { AppShell } from '@/components/layout/AppShell'

function RequireAuth({ role }: { role: 'citizen' | 'admin' }) {
  const { user, loading } = useAuth()
  const loc = useLocation()
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-400">Загрузка…</div>
  if (!user) return <Navigate to={`/login/${role}`} state={{ from: loc }} replace />
  if (user.role !== role) return <Navigate to={`/login/${user.role}`} replace />
  return <AppShell role={role}><Outlet /></AppShell>
}

const router = createBrowserRouter([
  { path: '/',                    element: <Navigate to="/admin" replace /> },
  { path: '/login/:role',         element: <LoginPage /> },
  {
    element: <RequireAuth role="admin" />,
    children: [
      { path: '/admin',           element: <AdminOverview /> },
      { path: '/admin/map',       element: <AdminMapPage /> },
    ],
  },
  {
    element: <RequireAuth role="citizen" />,
    children: [
      { path: '/citizen/report',     element: <ReportWizard /> },
      { path: '/citizen/my-reports', element: <div className="p-8 text-slate-500">Мои обращения — скоро</div> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>
)

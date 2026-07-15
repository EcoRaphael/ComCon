// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from '@/lib/AuthContext'
import { ToastProvider } from '@/lib/ToastContext'
import { useAuth }       from '@/lib/AuthContext'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import LoginPage      from '@/components/auth/LoginPage'
import AppLayout      from '@/components/layout/AppLayout'
import DriverLayout   from '@/components/driver/DriverLayout'

// Commuter pages
import Home       from '@/components/pages/Home'
import RoutesPage from '@/components/pages/Routes'
import MyRides    from '@/components/pages/MyRides'
import Profile    from '@/components/pages/Profile'

// Driver pages
import DriverDashboard from '@/components/driver/DriverDashboard'
import DriverBookings  from '@/components/driver/DriverBookings'
import DriverSchedule  from '@/components/driver/DriverSchedule'
import DriverProfile   from '@/components/driver/DriverProfile'

// Role-based redirect after login
function RoleRedirect() {
  const { profile, loadingAuth } = useAuth()
  if (loadingAuth || !profile) return null
  if (profile.role === 'driver') return <Navigate to="/driver" replace />
  return <Navigate to="/" replace />
}

// Commuter wrapper
function CommuterPage({ children }) {
  return (
    <ProtectedRoute allowedRole="customer">
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

// Driver wrapper
function DriverPage({ children }) {
  return (
    <ProtectedRoute allowedRole="driver">
      <DriverLayout>{children}</DriverLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<LoginPage />} />

          {/* Commuter routes */}
          <Route path="/"           element={<CommuterPage><Home /></CommuterPage>} />
          <Route path="/routes"     element={<CommuterPage><RoutesPage /></CommuterPage>} />
          <Route path="/my-rides"   element={<CommuterPage><MyRides /></CommuterPage>} />
          <Route path="/profile"    element={<CommuterPage><Profile /></CommuterPage>} />

          {/* Driver routes */}
          <Route path="/driver"          element={<DriverPage><DriverDashboard /></DriverPage>} />
          <Route path="/driver/bookings" element={<DriverPage><DriverBookings /></DriverPage>} />
          <Route path="/driver/schedule" element={<DriverPage><DriverSchedule /></DriverPage>} />
          <Route path="/driver/profile"  element={<DriverPage><DriverProfile /></DriverPage>} />

          {/* Fallback — redirect based on role */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
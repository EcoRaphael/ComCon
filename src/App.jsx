// src/App.jsx
import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from '@/lib/AuthContext'
import { ToastProvider } from '@/lib/ToastContext'
import { useAuth }       from '@/lib/AuthContext'
import { supabase }      from '@/lib/supabase/client'

import ProtectedRoute from '@/components/auth/ProtectedRoute'
import LoginPage      from '@/components/auth/LoginPage'
import AppLayout      from '@/components/layout/AppLayout'
import DriverLayout   from '@/components/driver/DriverLayout'
import DriverDocumentUpload from '@/components/driver/DriverDocumentUpload'
import Spinner from '@/components/ui/Spinner'

// Commuter pages
import Home       from '@/components/pages/Home'
import RoutesPage from '@/components/pages/Routes'
import MyRides    from '@/components/pages/MyRides'
import CityMap    from '@/components/pages/CityMap'
import Profile    from '@/components/pages/Profile'

// Driver pages
import DriverDashboard from '@/components/driver/DriverDashboard'
import DriverBookings  from '@/components/driver/DriverBookings'
import DriverSchedule  from '@/components/driver/DriverSchedule'
import DriverMap       from '@/components/driver/DriverMap'
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

// Driver wrapper — also gates on document upload. Documents can't be
// uploaded during registration anymore (see LoginPage.jsx/
// DriverDocumentUpload.jsx for why — no active session exists until
// admin confirms the account), so this is where that actually happens:
// the first time a newly-confirmed driver logs in, before they can
// reach any other driver page.
function DriverPage({ children }) {
  const { profile } = useAuth()
  const [checking,   setChecking]   = useState(true)
  const [needsDocs,  setNeedsDocs]  = useState(false)
  const [missingRow, setMissingRow] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    let cancelled = false
    // .maybeSingle() (not .single()) — a driver row genuinely might not
    // exist yet for some accounts (e.g. if registration partially failed
    // before this row got created). .single() THROWS when zero rows
    // match, which — with no .catch() below — left `checking` stuck
    // true forever: an infinite loading spinner, never reaching either
    // the upload screen or the dashboard. .maybeSingle() returns
    // data: null instead, so this can actually respond to that case.
    supabase
      .from('drivers')
      .select('license_photo_path')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('[DriverPage] failed to check driver row:', error)
          setChecking(false)
          return
        }
        if (!data) {
          // No drivers row at all for this account — registration didn't
          // fully complete. Surface this clearly instead of silently
          // showing the upload screen, which would look like it works
          // but fail to save (nothing to .update() against).
          setMissingRow(true)
          setChecking(false)
          return
        }
        setNeedsDocs(!data.license_photo_path)
        setChecking(false)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[DriverPage] unexpected error checking driver row:', err)
        setChecking(false)
      })
    return () => { cancelled = true }
  }, [profile?.id])

  return (
    <ProtectedRoute allowedRole="driver">
      {checking ? (
        <Spinner fullScreen label="Loading..." />
      ) : missingRow ? (
        <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-5 text-center">
          <p className="text-navy font-black text-lg mb-2">Something's not right with your account</p>
          <p className="text-sub text-sm max-w-sm">
            We couldn't find your driver profile. This can happen if registration didn't fully complete —
            please contact LTO Calbayog admin so they can look into it.
          </p>
        </div>
      ) : needsDocs ? (
        <DriverDocumentUpload onComplete={() => setNeedsDocs(false)} />
      ) : (
        <DriverLayout>{children}</DriverLayout>
      )}
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
          <Route path="/map"        element={<CommuterPage><CityMap /></CommuterPage>} />
          <Route path="/profile"    element={<CommuterPage><Profile /></CommuterPage>} />

          {/* Driver routes */}
          <Route path="/driver"          element={<DriverPage><DriverDashboard /></DriverPage>} />
          <Route path="/driver/bookings" element={<DriverPage><DriverBookings /></DriverPage>} />
          <Route path="/driver/schedule" element={<DriverPage><DriverSchedule /></DriverPage>} />
          <Route path="/driver/map"      element={<DriverPage><DriverMap /></DriverPage>} />
          <Route path="/driver/profile"  element={<DriverPage><DriverProfile /></DriverPage>} />

          {/* Fallback — redirect based on role */}
          <Route path="*" element={<RoleRedirect />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
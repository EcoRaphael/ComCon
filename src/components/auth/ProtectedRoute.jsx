// src/components/auth/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'
import { useAuth }  from '@/lib/AuthContext'
import Spinner      from '@/components/ui/Spinner'

export default function ProtectedRoute({ children, allowedRole }) {
  const { isLoggedIn, loadingAuth, profile } = useAuth()

  if (loadingAuth)  return <Spinner fullScreen label="Loading CommuterConnect..." />
  if (!isLoggedIn)  return <Navigate to="/login" replace />
  if (!profile)     return <Spinner fullScreen label="Loading your profile..." />

  // Role check — redirect to correct section if wrong role
  if (allowedRole && profile.role !== allowedRole) {
    if (profile.role === 'driver')   return <Navigate to="/driver" replace />
    if (profile.role === 'customer') return <Navigate to="/"       replace />
    return <Navigate to="/login" replace />
  }

  return children
}
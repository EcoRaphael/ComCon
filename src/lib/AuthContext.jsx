// src/lib/AuthContext.jsx
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,        setSession]       = useState(undefined)
  const [profile,        setProfile]       = useState(null)
  const [loadingAuth,    setLoadingAuth]   = useState(true)

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return }
    const { data } = await supabase
      .from('users')
      .select('id, name, email, phone, address, role, status')
      .eq('id', userId)
      .single()
    if (data) {
      setProfile(data)
      try { localStorage.setItem('cc-commuter-profile', JSON.stringify(data)) } catch {}
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setSession(session); return
        }
        setSession(session ?? null)
        if (session?.user?.id) {
          // Try cache first
          try {
            const cached = localStorage.getItem('cc-commuter-profile')
            if (cached) {
              const p = JSON.parse(cached)
              if (p?.id === session.user.id) { setProfile(p); setLoadingAuth(false) }
            }
          } catch {}
          fetchProfile(session.user.id).finally(() => setLoadingAuth(false))
        } else {
          setProfile(null)
          setLoadingAuth(false)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    // Check role
    const { data: row } = await supabase
      .from('users').select('role, status').eq('id', data.user.id).single()
    if (!row) { await supabase.auth.signOut(); throw new Error('Account not found.') }
    if (row.role === 'admin') { await supabase.auth.signOut(); throw new Error('Use the Admin Panel to log in as administrator.') }
    if (row.status === 'suspended') { await supabase.auth.signOut(); throw new Error('Your account has been suspended. Contact the administrator.') }
    return data
  }, [])

  const signUp = useCallback(async (form) => {
    // 1. Create Supabase Auth user with metadata so we can access it on trigger
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name:    form.name,
          phone:   form.phone    || null,
          address: form.address  || null,
        }
      }
    })
    if (error) throw error

    const userId = data?.user?.id
    if (!userId) throw new Error('Signup failed — no user ID returned.')

    // 2. Insert into users table with all form fields
    const { error: rowError } = await supabase.from('users').insert({
      id:      userId,
      name:    form.name.trim(),
      email:   form.email.trim().toLowerCase(),
      phone:   form.phone?.trim()   || null,
      address: form.address?.trim() || null,
      role:    'customer',
      status:  'active',
    })

    // If RLS blocks direct insert, try upsert instead
    if (rowError) {
      console.warn('[signUp] insert failed, trying upsert:', rowError.message)
      const { error: upsertError } = await supabase.from('users').upsert({
        id:      userId,
        name:    form.name.trim(),
        email:   form.email.trim().toLowerCase(),
        phone:   form.phone?.trim()   || null,
        address: form.address?.trim() || null,
        role:    'customer',
        status:  'active',
      })
      if (upsertError) throw upsertError
    }

    return data
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setProfile(null)
    try { localStorage.removeItem('cc-commuter-profile') } catch {}
  }, [])

  const isLoggedIn   = !!session
  const isCustomer   = profile?.role === 'customer'
  const isDriver     = profile?.role === 'driver'

  return (
    <AuthContext.Provider value={{
      session, profile, setProfile,
      loadingAuth, isLoggedIn, isCustomer, isDriver,
      signIn, signUp, signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
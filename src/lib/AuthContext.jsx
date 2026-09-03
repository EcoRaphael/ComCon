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
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, phone, address, role, status')
      .eq('id', userId)
      .maybeSingle()
    if (error) {
      console.error('[AuthContext] failed to fetch profile:', error)
      return
    }
    if (data) {
      setProfile(data)
      try { localStorage.setItem('cc-commuter-profile', JSON.stringify(data)) } catch {}
    } else {
      console.warn('[AuthContext] no matching users row for authenticated id:', userId)
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
          // Show cached profile instantly for a fast first paint, but do
          // NOT mark auth as "loaded" from the cache alone — loadingAuth
          // only flips once the fresh fetch below actually resolves.
          // Setting it false here too was the bug: ProtectedRoute gates
          // rendering purely on loadingAuth, so the app would render
          // immediately with stale cached data (old status, old role, old
          // profile fields) and only silently self-correct once the real
          // fetch landed a moment later — visible as "wrong data on first
          // login" whenever the cache was out of date.
          try {
            const cached = localStorage.getItem('cc-commuter-profile')
            if (cached) {
              const p = JSON.parse(cached)
              if (p?.id === session.user.id) setProfile(p)
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

  // Registration is split into two steps so the profile row only gets
  // created AFTER the person actually verifies their email via OTP —
  // otherwise an unverified signup would already have a fully active
  // account, defeating the point of requiring verification at all.

  // Step 1: create the (unconfirmed) auth user — this is what triggers
  // Supabase to send the verification email. No profile row yet.
  const startSignUp = useCallback(async (form) => {
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
    if (!data?.user?.id) throw new Error('Signup failed — no user ID returned.')
    return data
  }, [])

  // Step 2: verify the 6-digit code the person received by email. Only
  // on success do we actually create the users-table profile row — this
  // is the real enforcement point, not just a UI nicety.
  const verifySignUpOtp = useCallback(async (form, token) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email: form.email,
      token,
      type: 'signup',
    })
    if (error) throw error

    const userId = data?.user?.id
    if (!userId) throw new Error('Verification succeeded but no user ID was returned.')

    const { error: rowError } = await supabase.from('users').insert({
      id:          userId,
      name:        form.name.trim(),
      email:       form.email.trim().toLowerCase(),
      phone:       form.phone?.trim()   || null,
      address:     form.address?.trim() || null,
      address_lat: form.addressLat ?? null,
      address_lng: form.addressLng ?? null,
      role:    'customer',
      status:  'active',
    })

    // If RLS blocks direct insert, try upsert instead
    if (rowError) {
      console.warn('[verifySignUpOtp] insert failed, trying upsert:', rowError.message)
      const { error: upsertError } = await supabase.from('users').upsert({
        id:          userId,
        name:        form.name.trim(),
        email:       form.email.trim().toLowerCase(),
        phone:       form.phone?.trim()   || null,
        address:     form.address?.trim() || null,
        address_lat: form.addressLat ?? null,
        address_lng: form.addressLng ?? null,
        role:    'customer',
        status:  'active',
      })
      if (upsertError) throw upsertError
    }

    return data
  }, [])

  // Lets the person request a new code if theirs expired or didn't
  // arrive — Supabase applies its own rate limiting to this internally.
  const resendSignUpOtp = useCallback(async (email) => {
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) throw error
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
      startSignUp, verifySignUpOtp, resendSignUpOtp, signOut,
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
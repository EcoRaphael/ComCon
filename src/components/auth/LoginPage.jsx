// src/components/auth/LoginPage.jsx
import { useState, useRef, useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Eye, EyeOff, UserCircle2, Bike, ArrowLeft, CheckCircle2, Camera, Image, X, Mail } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import CameraCapture from '@/components/ui/CameraCapture'
import { supabase } from '@/lib/supabase/client'


// ── Wrong Portal Screen ─────────────────────────────────────────
function WrongPortalScreen({ wrongRole, onGoCorrect, onBack }) {
  const isDriver = wrongRole === 'driver'
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green to-green flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl text-center">

          {/* Icon */}
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5 ${
            isDriver ? 'bg-orange-50' : 'bg-blue-50'
          }`}>
            {isDriver
              ? <Bike size={38} className="text-cta" />
              : <UserCircle2 size={38} className="text-blue-500" />
            }
          </div>

          <h2 className="text-xl font-black text-navy mb-2">Wrong Portal</h2>
          <p className="text-sub text-sm leading-relaxed mb-1">
            This account is registered as a{' '}
            <span className={`font-black ${isDriver ? 'text-cta' : 'text-blue-500'}`}>
              {isDriver ? 'Driver' : 'Commuter'}
            </span>.
          </p>
          <p className="text-sub text-sm leading-relaxed mb-7">
            Please sign in through the{' '}
            <span className={`font-black ${isDriver ? 'text-cta' : 'text-blue-500'}`}>
              {isDriver ? 'Driver Portal' : 'Commuter Portal'}
            </span>{' '}instead.
          </p>

          {/* Go to correct portal */}
          <button
            onClick={onGoCorrect}
            className={`w-full py-3.5 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 mb-3 ${
              isDriver ? 'bg-cta hover:opacity-90' : 'bg-blue-600 hover:bg-blue-700'
            } transition-all`}
          >
            {isDriver ? <Bike size={16} /> : <UserCircle2 size={16} />}
            Go to {isDriver ? 'Driver' : 'Commuter'} Portal
          </button>

          {/* Back to role selector */}
          <button
            onClick={onBack}
            className="w-full py-3 text-sub font-semibold text-sm rounded-2xl bg-surface hover:bg-border transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} /> Back to Role Selector
          </button>
        </div>

        <p className="text-white/30 text-xs mt-8 text-center">CommuterConnect © 2026 · Calbayog City</p>
      </div>
    </div>
  )
}

// ── Role Selector Screen ────────────────────────────────────────
function RoleSelector({ onSelect }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green to-green flex flex-col items-center justify-center p-5">

      {/* Brand */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-white tracking-tighter">
          Commuter<span className="text-cta">Connect</span>
        </h1>
        <p className="text-white/60 text-xs uppercase tracking-widest font-bold mt-1">
          Calbayog City Transport
        </p>
      </div>

      <p className="text-white/80 text-sm font-semibold mb-5 uppercase tracking-widest">
        I am a...
      </p>

      <div className="w-full max-w-sm flex flex-col gap-4">

        {/* Commuter card */}
        <button
          onClick={() => onSelect('commuter')}
          className="group w-full bg-white rounded-3xl p-6 shadow-2xl flex items-center gap-5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #1565C0, #1976D2)' }}>
            <UserCircle2 size={30} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-lg font-black text-navy">Commuter</p>
            <p className="text-sub text-xs mt-0.5">Book rides around Calbayog City</p>
          </div>
          <svg className="text-sub group-hover:text-navy transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>

        {/* Driver card */}
        <button
          onClick={() => onSelect('driver')}
          className="group w-full bg-white rounded-3xl p-6 shadow-2xl flex items-center gap-5 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        >
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #E84C27, #F05A30)' }}>
            <Bike size={30} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-lg font-black text-navy">Driver</p>
            <p className="text-sub text-xs mt-0.5">Manage trips and earn with your vehicle</p>
          </div>
          <svg className="text-sub group-hover:text-navy transition-colors" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </div>

      <p className="text-white/30 text-xs mt-10">CommuterConnect © 2026 · Calbayog City</p>
    </div>
  )
}

// ── Shared field helpers ────────────────────────────────────────
function Field({ label, type = 'text', placeholder, value, onChange, disabled, accent }) {
  const [show, setShow] = useState(false)
  const isPass = type === 'password'
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-widest text-sub ml-1">{label}</label>
      <div className="relative mt-1.5">
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`w-full h-11 px-4 bg-surface border-2 border-transparent rounded-2xl outline-none text-sm font-medium text-navy transition-all ${accent} pr-${isPass ? '11' : '4'}`}
        />
        {isPass && (
          <button type="button" tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sub p-1"
            onClick={() => setShow(p => !p)}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  )
}

// ── Commuter Auth Panel ─────────────────────────────────────────
function CommuterPanel({ onBack, onSwitch }) {
  const { signIn, startSignUp, verifySignUpOtp, resendSignUpOtp } = useAuth()
  const { toast } = useToast()
  const navigate  = useNavigate()

  const [tab,        setTab]        = useState('login')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [done,       setDone]       = useState(false)
  // 'form' -> collecting registration details, 'otp' -> awaiting the
  // 6-digit code just emailed to them
  const [step,        setStep]        = useState('form')
  const [otp,         setOtp]         = useState('')
  const [resending,   setResending]   = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [wrongRole,  setWrongRole]  = useState(() => {
    const v = sessionStorage.getItem('cc-wrong-role-commuter')
    if (v) { sessionStorage.removeItem('cc-wrong-role-commuter'); return v }
    return null
  })

  const markWrongRole = (r) => {
    sessionStorage.setItem('cc-wrong-role-commuter', r)
    setWrongRole(r)
  }

  const [lf, setLf] = useState({ email: '', password: '' })
  const [rf, setRf] = useState({ name: '', email: '', phone: '', address: '', password: '', confirm: '' })

  const accent = 'focus:border-blue-400'

  // Countdown for the resend-code button, so people can't hammer it
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  if (wrongRole) return (
    <WrongPortalScreen
      wrongRole={wrongRole}
      onGoCorrect={() => { setWrongRole(null); onSwitch('driver') }}
      onBack={() => setWrongRole(null)}
    />
  )

  const handleLogin = async (e) => {
    e.preventDefault(); setError('')
    if (!lf.email || !lf.password) { setError('Fill in all fields.'); return }
    setLoading(true)
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: lf.email.trim(), password: lf.password
      })
      if (signInError) throw signInError
      const { data: row } = await supabase
        .from('users').select('role, status').eq('id', authData.user.id).single()
      if (!row) { await supabase.auth.signOut(); throw new Error('Account not found.') }
      if (row.status === 'suspended') {
        await supabase.auth.signOut()
        throw new Error('Your account has been suspended. Contact the administrator.')
      }
      if (row.role === 'admin') {
        await supabase.auth.signOut()
        throw new Error('Use the Admin Panel to sign in as administrator.')
      }
      if (row.role !== 'customer') {
        // Sign out synchronously so AuthContext doesn't redirect away
        await supabase.auth.signOut()
        // NOW set wrong role — component stays mounted because role is still 'commuter'
        setWrongRole('driver')
        return
      }
      navigate('/', { replace: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // Step 1 of registration: create the (unconfirmed) account, which
  // triggers Supabase to email a 6-digit code, then move to the OTP step.
  const handleRegister = async (e) => {
    e.preventDefault(); setError('')
    if (!rf.name || !rf.email || !rf.password) { setError('Name, email and password are required.'); return }
    if (rf.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    if (rf.password !== rf.confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await startSignUp(rf)
      setStep('otp')
      setResendCooldown(30)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  // Step 2: verify the code — the profile row only gets created here,
  // on success, not back in handleRegister.
  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setError('')
    if (otp.trim().length !== 6) { setError('Enter the 6-digit code from your email.'); return }
    setLoading(true)
    try {
      await verifySignUpOtp(rf, otp.trim())
      setDone(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setResending(true); setError('')
    try {
      await resendSignUpOtp(rf.email)
      toast('A new code has been sent to your email.')
      setResendCooldown(30)
    } catch (err) { setError(err.message) }
    finally { setResending(false) }
  }

  if (step === 'otp' && !done) return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green to-green flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl">
        <div className="text-center mb-5">
          <Mail size={44} className="text-blue-500 mx-auto mb-3" />
          <h2 className="text-xl font-black text-navy mb-1">Check Your Email</h2>
          <p className="text-sub text-sm">
            We sent a 6-digit code to <span className="font-bold text-navy">{rf.email}</span>
          </p>
        </div>
        <form onSubmit={handleVerifyOtp} className="space-y-3">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            disabled={loading}
            className="w-full text-center text-2xl font-black tracking-[0.5em] py-3 border-2 border-border rounded-2xl focus:border-blue-400 outline-none"
          />
          {error && <p className="text-red-600 text-xs text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-3 text-white font-black text-sm uppercase tracking-widest rounded-2xl disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #1565C0, #1976D2)' }}
          >
            {loading ? 'Verifying...' : 'Verify & Create Account'}
          </button>
        </form>
        <div className="text-center mt-4 space-y-2">
          <button
            onClick={handleResendOtp}
            disabled={resending || resendCooldown > 0}
            className="text-xs font-bold text-blue-600 disabled:text-sub disabled:cursor-not-allowed"
          >
            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : resending ? 'Sending...' : 'Resend code'}
          </button>
          <br />
          <button onClick={() => { setStep('form'); setOtp(''); setError('') }} className="text-xs text-sub">
            Wrong email? Go back
          </button>
        </div>
      </div>
    </div>
  )

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green to-green flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center">
        <CheckCircle2 size={52} className="text-blue-500 mx-auto mb-4" />
        <h2 className="text-xl font-black text-navy mb-2">Email Verified!</h2>
        <p className="text-sub text-sm">Your account is ready, <span className="font-bold text-navy">{rf.name}</span>.</p>
        <button onClick={() => navigate('/', { replace: true })}
          className="mt-6 w-full py-3 text-white font-black text-sm uppercase tracking-widest rounded-2xl"
          style={{ background: 'linear-gradient(135deg, #1565C0, #1976D2)' }}>
          Continue
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green to-green flex flex-col items-center justify-center p-5">

      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold transition-colors mb-5">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <UserCircle2 size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">
              Commuter<span className="text-cta">Connect</span>
            </h1>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Commuter Portal</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-2xl p-1 mb-5">
          {[['login','Sign In'], ['register','Sign Up']].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'bg-white text-navy shadow-sm' : 'text-sub'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            ⚠️ {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <Field label="Email" type="email" placeholder="you@email.com" value={lf.email}
              onChange={e => setLf(p => ({ ...p, email: e.target.value }))} disabled={loading} accent={accent} />
            <Field label="Password" type="password" placeholder="••••••••" value={lf.password}
              onChange={e => setLf(p => ({ ...p, password: e.target.value }))} disabled={loading} accent={accent} />
            <button type="submit" disabled={loading}
              className="w-full py-3.5 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #1565C0, #1976D2)' }}>
              {loading ? <Spinner size={20} /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <Field label="Full Name *" placeholder="Juan dela Cruz" value={rf.name}
              onChange={e => setRf(p => ({ ...p, name: e.target.value }))} disabled={loading} accent={accent} />
            <Field label="Email *" type="email" placeholder="juan@email.com" value={rf.email}
              onChange={e => setRf(p => ({ ...p, email: e.target.value }))} disabled={loading} accent={accent} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone" placeholder="+63 9XX XXX XXXX" value={rf.phone}
                onChange={e => setRf(p => ({ ...p, phone: e.target.value }))} disabled={loading} accent={accent} />
              <Field label="Address" placeholder="Brgy., Calbayog" value={rf.address}
                onChange={e => setRf(p => ({ ...p, address: e.target.value }))} disabled={loading} accent={accent} />
            </div>
            <Field label="Password *" type="password" placeholder="Min. 8 characters" value={rf.password}
              onChange={e => setRf(p => ({ ...p, password: e.target.value }))} disabled={loading} accent={accent} />
            <Field label="Confirm Password *" type="password" placeholder="Repeat password" value={rf.confirm}
              onChange={e => setRf(p => ({ ...p, confirm: e.target.value }))} disabled={loading} accent={accent} />
            <button type="submit" disabled={loading}
              className="w-full py-3.5 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
              style={{ background: 'linear-gradient(135deg, #1565C0, #1976D2)' }}>
              {loading ? <Spinner size={20} /> : 'Create Account'}
            </button>
          </form>
        )}

        <p className="text-center text-sub text-xs font-medium mt-5">Calbayog City Transport Service</p>
      </div>

      <p className="text-white/30 text-xs mt-8">CommuterConnect © 2026 · Calbayog City</p>
    </div>
  )
}

// ── Driver Auth Panel ───────────────────────────────────────────
const VEHICLE_TYPES = ['Tricycle', 'Multicab', 'Timbol']

function DriverPanel({ onBack, onSwitch }) {
  const { signIn, signUp } = useAuth()
  const navigate  = useNavigate()

  const [tab,        setTab]        = useState('login')
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const [done,       setDone]       = useState(false)
  const [wrongRole,  setWrongRole]  = useState(() => {
    const v = sessionStorage.getItem('cc-wrong-role-driver')
    if (v) { sessionStorage.removeItem('cc-wrong-role-driver'); return v }
    return null
  })

  const markWrongRole = (r) => {
    sessionStorage.setItem('cc-wrong-role-driver', r)
    setWrongRole(r)
  }

  const [lf, setLf] = useState({ email: '', password: '' })
  const [rf, setRf] = useState({
    name: '', email: '', phone: '', address: '',
    vehicleType: '', route: '',
    password: '', confirm: ''
  })

  // Document photos — driver's license, OR (Official Receipt), CR
  // (Certificate of Registration). Each field holds { file, previewUrl }.
  // Two explicit options are offered per document: an in-app camera
  // capture (CameraCapture.jsx, using getUserMedia) and a plain gallery
  // file picker. A single <input type="file" accept="image/*"> that
  // *hopes* the OS surfaces a camera option isn't reliable — desktop
  // browsers largely ignore the `capture` attribute, and behavior varies
  // across mobile browsers/webviews — so "take a photo" needed to be a
  // real, guaranteed feature rather than something left to chance.
  const [docs, setDocs] = useState({ license: null, or: null, cr: null })
  const [cameraFor, setCameraFor] = useState(null) // which doc key the camera modal is open for
  const MAX_DOC_MB = 8

  const setDoc = (key, file, previewUrl) => {
    setError('')
    setDocs(prev => {
      if (prev[key]?.previewUrl) URL.revokeObjectURL(prev[key].previewUrl)
      return { ...prev, [key]: { file, previewUrl } }
    })
  }

  const handleDocSelect = (key, file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG or PNG).')
      return
    }
    if (file.size > MAX_DOC_MB * 1024 * 1024) {
      setError(`That image is too large — please keep it under ${MAX_DOC_MB}MB.`)
      return
    }
    setDoc(key, file, URL.createObjectURL(file))
  }

  const handleCameraCapture = (file, previewUrl) => {
    setDoc(cameraFor, file, previewUrl)
    setCameraFor(null)
  }

  // If getUserMedia fails (permission denied, no camera, etc.), the
  // camera modal offers "choose from gallery instead" — this triggers a
  // shared hidden file input for whichever doc key the camera was open
  // for, captured via closure at the moment the modal was opened.
  const galleryFallbackRef = useRef(null)
  const handleFallbackToGallery = () => {
    const key = cameraFor
    setTimeout(() => {
      const input = galleryFallbackRef.current
      if (input) {
        input.dataset.forKey = key
        input.click()
      }
    }, 50)
  }

  const clearDoc = (key) => {
    setDocs(prev => {
      if (prev[key]?.previewUrl) URL.revokeObjectURL(prev[key].previewUrl)
      return { ...prev, [key]: null }
    })
  }

  const accent = 'focus:border-orange-400'

  if (wrongRole) return (
    <WrongPortalScreen
      wrongRole={wrongRole}
      onGoCorrect={() => { setWrongRole(null); onSwitch('commuter') }}
      onBack={() => setWrongRole(null)}
    />
  )

  const handleLogin = async (e) => {
    e.preventDefault(); setError('')
    if (!lf.email || !lf.password) { setError('Fill in all fields.'); return }
    setLoading(true)
    try {
      const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
        email: lf.email.trim(), password: lf.password
      })
      if (signInError) throw signInError
      const { data: row } = await supabase
        .from('users').select('role, status').eq('id', authData.user.id).single()
      if (!row) throw new Error('Account not found.')
      if (row.status === 'suspended') {
        await supabase.auth.signOut()
        throw new Error('Your account has been suspended. Contact LTO Calbayog.')
      }
      if (row.role !== 'driver') {
        markWrongRole('customer')        // set BEFORE signOut to survive re-render
        supabase.auth.signOut()          // fire-and-forget, no await
        return
      }
      navigate('/driver', { replace: true })
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const handleRegister = async (e) => {
    e.preventDefault(); setError('')
    if (!rf.name || !rf.email || !rf.password || !rf.vehicleType)
      return setError('Name, email, password, and vehicle type are required.')
    if (rf.password.length < 8) return setError('Password must be at least 8 characters.')
    if (rf.password !== rf.confirm) return setError('Passwords do not match.')
    if (!docs.license || !docs.or || !docs.cr)
      return setError('Please upload photos of your License, OR, and CR — admin needs these to verify your account.')
    setLoading(true)
    try {
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: rf.email.trim(),
        password: rf.password,
      })
      if (signUpError) throw signUpError
      const userId = authData?.user?.id
      if (!userId) throw new Error('Signup failed — no user ID.')

      const { error: userErr } = await supabase.from('users').upsert({
        id: userId, name: rf.name.trim(),
        email: rf.email.trim().toLowerCase(),
        phone: rf.phone?.trim() || null,
        address: rf.address?.trim() || null,
        role: 'driver', status: 'active',
      })
      if (userErr) throw userErr

      // plate is NOT NULL + UNIQUE in the schema, but we no longer collect
      // it here — admin reads the real plate off the License/OR/CR photos
      // and sets it when reviewing the application (see Drivers.jsx). This
      // placeholder is unique (derived from the new user's own UUID) so it
      // satisfies the constraint without colliding with anyone else, and
      // is clearly recognizable as "not a real plate yet" wherever it's
      // displayed until admin fills in the actual one.
      const placeholderPlate = `PENDING-${userId.slice(0, 8).toUpperCase()}`

      const { error: driverErr } = await supabase.from('drivers').insert({
        user_id: userId, name: rf.name.trim(),
        plate: placeholderPlate,
        vehicle_type: rf.vehicleType,
        route: rf.route?.trim() || '',
        license_no: '',
        status: 'inactive', verified: false,
        rating: 0, trips: 0, earnings: 0,
        color: '#E84C27',
      })
      if (driverErr) throw driverErr

      // Upload the 3 document photos to the driver's own storage folder,
      // then record the resulting paths on their drivers row so admin can
      // pull up signed URLs to review them before verifying.
      const uploadDoc = async (key, file) => {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${userId}/${key}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('driver-documents')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (uploadErr) throw new Error(`Failed to upload ${key.toUpperCase()} photo: ${uploadErr.message}`)
        return path
      }

      const [licensePath, orPath, crPath] = await Promise.all([
        uploadDoc('license', docs.license.file),
        uploadDoc('or', docs.or.file),
        uploadDoc('cr', docs.cr.file),
      ])

      const { error: pathErr } = await supabase.from('drivers')
        .update({
          license_photo_path: licensePath,
          or_photo_path: orPath,
          cr_photo_path: crPath,
        })
        .eq('user_id', userId)
      if (pathErr) throw pathErr

      setDone(true)
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  const inputCls = `w-full h-11 px-4 mt-1.5 bg-surface border-2 border-transparent ${accent} rounded-2xl outline-none text-sm font-medium text-navy transition-all`
  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-sub ml-1"

  if (done) return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green to-green flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl text-center">
        <CheckCircle2 size={52} className="text-cta mx-auto mb-4" />
        <h2 className="text-xl font-black text-navy mb-2">Application Submitted!</h2>
        <p className="text-sub text-sm leading-relaxed">Your driver registration is pending review by <span className="font-bold text-navy">LTO Calbayog admin</span>, who will confirm your plate and license number from your uploaded documents. You'll be notified once verified.</p>
        <button onClick={() => { setDone(false); setTab('login'); setLf(p => ({ ...p, email: rf.email })) }}
          className="mt-6 w-full py-3 text-white font-black text-sm uppercase tracking-widest rounded-2xl bg-cta">
          Back to Sign In
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-dark via-green to-green flex flex-col items-center justify-center p-5">

      {/* Header */}
      <div className="w-full max-w-sm mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-semibold transition-colors mb-5">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Bike size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tighter">
              Commuter<span className="text-cta">Connect</span>
            </h1>
            <p className="text-white/60 text-[10px] uppercase tracking-widest font-bold">Driver Portal</p>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">

        {/* Tabs */}
        <div className="flex gap-1 bg-surface rounded-2xl p-1 mb-5">
          {[['login','Sign In'], ['register','Register']].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === t ? 'bg-white text-navy shadow-sm' : 'text-sub'
              }`}>
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
            ⚠️ {error}
          </div>
        )}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} placeholder="driver@email.com"
                value={lf.email} onChange={e => setLf(p => ({ ...p, email: e.target.value }))} disabled={loading} />
            </div>
            <div>
              <label className={labelCls}>Password</label>
              <input type="password" className={inputCls} placeholder="••••••••"
                value={lf.password} onChange={e => setLf(p => ({ ...p, password: e.target.value }))} disabled={loading} />
            </div>
            <p className="text-sub text-[10px] text-center">Your account must be verified by admin before first login.</p>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 bg-cta hover:opacity-90 transition-opacity mt-1">
              {loading ? <Spinner size={20} /> : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">

            <p className="text-[10px] font-black uppercase tracking-widest text-cta border-b border-orange-100 pb-1">Personal Info</p>
            <div>
              <label className={labelCls}>Full Name *</label>
              <input className={inputCls} placeholder="Juan dela Cruz"
                value={rf.name} onChange={e => setRf(p => ({ ...p, name: e.target.value }))} disabled={loading} />
            </div>
            <div>
              <label className={labelCls}>Email *</label>
              <input type="email" className={inputCls} placeholder="driver@email.com"
                value={rf.email} onChange={e => setRf(p => ({ ...p, email: e.target.value }))} disabled={loading} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>Phone</label>
                <input className={inputCls} placeholder="09XX XXX XXXX"
                  value={rf.phone} onChange={e => setRf(p => ({ ...p, phone: e.target.value }))} disabled={loading} />
              </div>
              <div>
                <label className={labelCls}>Address</label>
                <input className={inputCls} placeholder="Brgy., Calbayog"
                  value={rf.address} onChange={e => setRf(p => ({ ...p, address: e.target.value }))} disabled={loading} />
              </div>
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-cta border-b border-orange-100 pb-1 pt-1">Vehicle Info</p>
            <p className="text-[11px] text-sub -mt-1">
              Plate and license numbers aren't needed here — admin reads them off your License/OR/CR photos below when reviewing your application.
            </p>
            <div>
              <label className={labelCls}>Vehicle Type *</label>
              <select className={inputCls + " cursor-pointer"}
                value={rf.vehicleType} onChange={e => setRf(p => ({ ...p, vehicleType: e.target.value }))} disabled={loading}>
                <option value="">Select...</option>
                {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Route</label>
              <input className={inputCls} placeholder="Rawis–Maybog"
                value={rf.route} onChange={e => setRf(p => ({ ...p, route: e.target.value }))} disabled={loading} />
            </div>

            <p className="text-[10px] font-black uppercase tracking-widest text-cta border-b border-orange-100 pb-1 pt-1">Verification Documents</p>
            <p className="text-[11px] text-sub -mt-1">
              Take a photo or upload from your gallery — admin reviews these before approving your account.
            </p>
            {[
              { key: 'license', label: "Driver's License *" },
              { key: 'or',      label: 'OR (Official Receipt) *' },
              { key: 'cr',      label: 'CR (Certificate of Registration) *' },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                {docs[key] ? (
                  <div className="mt-1.5 flex items-center gap-3 bg-surface rounded-2xl p-2.5">
                    <img src={docs[key].previewUrl} alt={label} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                    <p className="flex-1 text-xs font-semibold text-navy truncate">{docs[key].file.name}</p>
                    <button type="button" onClick={() => clearDoc(key)} disabled={loading}
                      className="p-1.5 text-sub hover:text-red-600 flex-shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1.5 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCameraFor(key)}
                      disabled={loading}
                      className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border rounded-2xl text-sub text-xs font-bold hover:border-orange-300 hover:text-cta transition-colors"
                    >
                      <Camera size={16} />
                      Take Photo
                    </button>
                    <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border rounded-2xl text-sub text-xs font-bold cursor-pointer hover:border-orange-300 hover:text-cta transition-colors">
                      <Image size={16} />
                      Gallery
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={loading}
                        onChange={e => handleDocSelect(key, e.target.files?.[0])}
                      />
                    </label>
                  </div>
                )}
              </div>
            ))}

            <p className="text-[10px] font-black uppercase tracking-widest text-cta border-b border-orange-100 pb-1 pt-1">Account</p>
            <div>
              <label className={labelCls}>Password * (min. 8 chars)</label>
              <input type="password" className={inputCls} placeholder="••••••••"
                value={rf.password} onChange={e => setRf(p => ({ ...p, password: e.target.value }))} disabled={loading} />
            </div>
            <div>
              <label className={labelCls}>Confirm Password *</label>
              <input type="password" className={inputCls} placeholder="Repeat password"
                value={rf.confirm} onChange={e => setRf(p => ({ ...p, confirm: e.target.value }))} disabled={loading} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3.5 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 bg-cta hover:opacity-90 transition-opacity">
              {loading ? <Spinner size={20} /> : 'Submit Application'}
            </button>
          </form>
        )}

        <p className="text-center text-sub text-xs font-medium mt-5">Calbayog City Transport Service</p>
      </div>

      <p className="text-white/30 text-xs mt-8">CommuterConnect © 2026 · Calbayog City</p>

      {cameraFor && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraFor(null)}
          onFallbackToGallery={handleFallbackToGallery}
        />
      )}
      <input
        ref={galleryFallbackRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const key = e.target.dataset.forKey
          handleDocSelect(key, e.target.files?.[0])
          e.target.value = '' // reset so selecting the same file again still fires onChange
        }}
      />
    </div>
  )
}

// ── Main LoginPage ──────────────────────────────────────────────
export default function LoginPage() {
  const { isLoggedIn, loadingAuth, profile } = useAuth()
  // Store role in sessionStorage so signOut() doesn't reset it back to null
  const [role, setRole] = useState(() => sessionStorage.getItem('cc-login-role') || null)

  const selectRole = (r) => {
    sessionStorage.setItem('cc-login-role', r || '')
    setRole(r)
  }

  if (loadingAuth) return <Spinner fullScreen label="Loading..." />

  // Already fully logged in with no portal selected — redirect to correct section
  if (isLoggedIn && profile && !role) {
    if (profile.role === 'driver')   return <Navigate to="/driver" replace />
    if (profile.role === 'customer') return <Navigate to="/" replace />
  }

  if (!role)               return <RoleSelector onSelect={selectRole} />
  if (role === 'commuter') return <CommuterPanel onBack={() => selectRole(null)} onSwitch={selectRole} />
  if (role === 'driver')   return <DriverPanel   onBack={() => selectRole(null)} onSwitch={selectRole} />
}
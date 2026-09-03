// src/components/driver/DriverProfile.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { User, Mail, Phone, Lock, Save, Edit3, LogOut, RefreshCw, AlertTriangle, ShieldCheck, Wallet } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import AvatarPicker from '@/components/ui/AvatarPicker'

const PAYMENT_METHODS = [
  { key: 'cash',  label: 'Cash',  icon: '💵' },
  { key: 'gcash', label: 'GCash', icon: '📱' },
  { key: 'maya',  label: 'Maya',  icon: '💳' },
]

export default function DriverProfile() {
  const { profile, setProfile, signOut } = useAuth()
  const { toast } = useToast()

  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [showPw,   setShowPw]   = useState(false)
  const [savingPw, setSavingPw] = useState(false)
  const [pwError,  setPwError]  = useState('')

  const [form,   setForm]   = useState({ name: profile?.name || '', phone: profile?.phone || '' })
  const [pwForm, setPwForm] = useState({ next: '', confirm: '' })

  // Payment methods live on the drivers row, not the shared users/profile
  // row, so they need their own fetch — independent of the name/phone
  // editing above.
  const [paymentMethods,     setPaymentMethods]     = useState([])
  const [editingPayment,     setEditingPayment]     = useState(false)
  const [pendingPayment,     setPendingPayment]     = useState([])
  const [savingPayment,      setSavingPayment]      = useState(false)
  const [loadingPayment,     setLoadingPayment]     = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    supabase
      .from('drivers')
      .select('payment_methods')
      .eq('user_id', profile.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('[DriverProfile] failed to fetch payment methods:', error)
        setPaymentMethods(data?.payment_methods || [])
        setLoadingPayment(false)
      })
      .catch((err) => {
        console.error('[DriverProfile] unexpected error fetching payment methods:', err)
        setLoadingPayment(false)
      })
  }, [profile?.id])

  const togglePendingPayment = (key) => {
    setPendingPayment(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    )
  }

  const handleSavePayment = async () => {
    if (pendingPayment.length === 0) {
      toast('Select at least one payment method.', 'error')
      return
    }
    setSavingPayment(true)
    try {
      const { error } = await supabase.from('drivers')
        .update({ payment_methods: pendingPayment })
        .eq('user_id', profile.id)
      if (error) throw error
      setPaymentMethods(pendingPayment)
      toast('Payment methods updated!', 'success')
      setEditingPayment(false)
    } catch (err) {
      toast('Failed to update: ' + err.message, 'error')
    } finally {
      setSavingPayment(false)
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Name is required', 'error'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('users')
        .update({ name: form.name, phone: form.phone })
        .eq('id', profile.id)
      if (error) throw error
      if (setProfile) setProfile(p => ({ ...p, ...form }))
      try {
        const cached = JSON.parse(localStorage.getItem('cc-commuter-profile') || '{}')
        localStorage.setItem('cc-commuter-profile', JSON.stringify({ ...cached, ...form }))
      } catch {}
      toast('Profile updated!', 'success')
      setEditing(false)
    } catch (err) { toast(err.message, 'error') }
    finally { setSaving(false) }
  }

  const handleChangePw = async () => {
    setPwError('')
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters.'); return }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return }
    setSavingPw(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next })
      if (error) throw error
      toast('Password changed!', 'success')
      setPwForm({ next: '', confirm: '' })
      setShowPw(false)
    } catch (err) { setPwError(err.message) }
    finally { setSavingPw(false) }
  }

  const initials = profile?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'DR'

  return (
    <div className="page-enter px-4 py-5 space-y-4 pb-8">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-dark to-green rounded-2xl p-5 flex items-center gap-4">
        <AvatarPicker profile={profile} size={64} initials={initials} />
        <div>
          <p className="text-white font-black text-lg">{profile?.name}</p>
          <p className="text-white/60 text-sm">{profile?.email}</p>
          <div className="flex gap-2 mt-1.5">
            <span className="bg-white/20 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <ShieldCheck size={9} /> Driver
            </span>
          </div>
        </div>
      </div>

      {/* Profile info */}
      <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-sub uppercase tracking-wider">Profile Information</p>
          <button onClick={() => { setEditing(e=>!e); setForm({ name: profile?.name||'', phone: profile?.phone||'' }) }}
            className="flex items-center gap-1 text-xs font-bold text-green">
            <Edit3 size={12} /> {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>
        {editing ? (
          <div className="space-y-3">
            <div>
              <label className="field-label">Full Name</label>
              <input className="field-input" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Phone</label>
              <input className="field-input" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} placeholder="+63 9XX XXX XXXX" />
            </div>
            <button onClick={handleSave} disabled={saving}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <><Save size={14}/> Save</>}
            </button>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden">
            {[
              { icon: <User size={13}/>,  label: 'Name',  val: profile?.name  || '—' },
              { icon: <Mail size={13}/>,  label: 'Email', val: profile?.email || '—' },
              { icon: <Phone size={13}/>, label: 'Phone', val: profile?.phone || 'Not set' },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex items-center justify-between px-4 py-3 ${i < arr.length-1 ? 'border-b border-border' : ''}`}>
                <span className="flex items-center gap-2 text-xs text-sub font-bold uppercase tracking-wider">{row.icon} {row.label}</span>
                <span className="text-sm text-navy font-medium">{row.val}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-sub uppercase tracking-wider flex items-center gap-1.5">
            <Wallet size={13} /> Payment Methods
          </p>
          {!loadingPayment && (
            <button
              onClick={() => {
                setEditingPayment(e => !e)
                setPendingPayment(paymentMethods)
              }}
              className="flex items-center gap-1 text-xs font-bold text-green"
            >
              <Edit3 size={12} /> {editingPayment ? 'Cancel' : 'Edit'}
            </button>
          )}
        </div>

        {loadingPayment ? (
          <div className="flex justify-center py-6"><Spinner size={22} /></div>
        ) : editingPayment ? (
          <div className="space-y-3">
            <p className="text-xs text-sub">Select every method you accept — commuters see this before booking with you.</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map(({ key, label, icon }) => {
                const selected = pendingPayment.includes(key)
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => togglePendingPayment(key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-colors ${
                      selected ? 'border-green bg-green-light text-green' : 'border-border text-sub hover:border-green/30'
                    }`}
                  >
                    <span className="text-lg">{icon}</span>
                    {label}
                  </button>
                )
              })}
            </div>
            <button onClick={handleSavePayment} disabled={savingPayment}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {savingPayment ? <RefreshCw size={14} className="animate-spin" /> : <><Save size={14}/> Save</>}
            </button>
          </div>
        ) : paymentMethods.length === 0 ? (
          <p className="text-xs text-sub">No payment methods set yet — tap Edit to add some.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {PAYMENT_METHODS.filter(m => paymentMethods.includes(m.key)).map(({ key, label, icon }) => (
              <span key={key} className="flex items-center gap-1.5 bg-green-light text-green text-xs font-bold px-3 py-1.5 rounded-full">
                {icon} {label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl shadow-sm border border-border/50 p-5">
        <button onClick={() => { setShowPw(s=>!s); setPwError('') }}
          className="flex items-center gap-2 text-sm font-bold text-sub hover:text-navy w-full">
          <Lock size={15} /> {showPw ? 'Cancel' : 'Change Password'}
        </button>
        {showPw && (
          <div className="mt-4 space-y-3 pt-4 border-t border-border">
            {pwError && (
              <div className="flex gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                <AlertTriangle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{pwError}</p>
              </div>
            )}
            <div>
              <label className="field-label">New Password</label>
              <input className="field-input" type="password" placeholder="Min. 8 characters"
                value={pwForm.next} onChange={e => setPwForm(p=>({...p,next:e.target.value}))} />
            </div>
            <div>
              <label className="field-label">Confirm Password</label>
              <input className="field-input" type="password" placeholder="Repeat password"
                value={pwForm.confirm} onChange={e => setPwForm(p=>({...p,confirm:e.target.value}))} />
            </div>
            <button onClick={handleChangePw} disabled={savingPw}
              className="btn-primary w-full py-2.5 flex items-center justify-center gap-2">
              {savingPw ? <RefreshCw size={14} className="animate-spin"/> : <><Lock size={14}/> Update Password</>}
            </button>
          </div>
        )}
      </div>

      <button onClick={signOut}
        className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-red-200 text-red-600 bg-red-50 font-bold text-sm hover:bg-red-100 transition-colors">
        <LogOut size={16} /> Sign Out
      </button>
    </div>
  )
}
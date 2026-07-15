// src/components/pages/MyRides.jsx
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { MapPin, Star, Clock, X, Ban, Flag, AlertTriangle } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

const STATUS_COLORS = {
  pending:   'badge-amber',
  ongoing:   'badge-blue',
  completed: 'badge-green',
  cancelled: 'badge-red',
}

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(s => (
        <button key={s} onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)} onMouseLeave={() => setHover(0)}
          className="transition-transform active:scale-90">
          <Star size={32} className={s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-border'} />
        </button>
      ))}
    </div>
  )
}

export default function MyRides() {
  const { profile } = useAuth()
  const { toast }   = useToast()

  const [bookings,  setBookings]  = useState([])
  const [loading,   setLoading]   = useState(true)
  const [filter,    setFilter]    = useState('all')

  // Rating modal
  const [ratingTarget, setRatingTarget] = useState(null)
  const [stars,        setStars]        = useState(0)
  const [comment,      setComment]      = useState('')
  const [submitting,   setSubmitting]   = useState(false)

  // Cancel modal
  const [cancelTarget, setCancelTarget] = useState(null)
  const [cancelling,   setCancelling]   = useState(false)

  // Report modal
  const [reportTarget,     setReportTarget]     = useState(null)
  const [reportType,       setReportType]       = useState('')
  const [reportDesc,       setReportDesc]       = useState('')
  const [submittingReport, setSubmittingReport] = useState(false)

  useEffect(() => {
    if (!profile?.id) return
    fetchBookings()
    const ch = supabase.channel('my-rides')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `customer_id=eq.${profile.id}`
      }, payload => {
        setBookings(prev => prev.map(b => b.id === payload.new.id ? { ...b, ...payload.new } : b))
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  async function fetchBookings() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, drivers!driver_id(id, name, plate, vehicle_type, rating, color)')
      .eq('customer_id', profile.id)
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  async function handleCancel() {
    if (!cancelTarget) return
    setCancelling(true)
    const { error } = await supabase
      .from('bookings').update({ status: 'cancelled' }).eq('id', cancelTarget.id)
    if (error) { toast('Failed to cancel booking', 'error') }
    else {
      setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: 'cancelled' } : b))
      toast('Booking cancelled.', 'success')
      setCancelTarget(null)
    }
    setCancelling(false)
  }

  async function handleRating() {
    if (!stars) { toast('Please select a star rating', 'error'); return }
    setSubmitting(true)
    try {
      const { data: existing } = await supabase
        .from('ratings').select('id').eq('booking_id', ratingTarget.id).maybeSingle()
      if (existing) { toast('You already rated this ride.'); setRatingTarget(null); return }
      const { error } = await supabase.from('ratings').insert({
        booking_id:  ratingTarget.id,
        customer_id: profile.id,
        driver_id:   ratingTarget.drivers?.id || null,
        stars:       stars,
        comment:     comment.trim() || null,
      })
      if (error) throw error
      toast('Thanks for your rating! ⭐', 'success')
      setRatingTarget(null); setStars(0); setComment('')
    } catch (err) {
      toast('Failed to submit rating: ' + err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReport() {
    if (!reportType) { toast('Please select an issue type', 'error'); return }
    if (!reportDesc.trim()) { toast('Please describe the issue', 'error'); return }
    setSubmittingReport(true)
    try {
      const { error } = await supabase.from('reports').insert({
        customer_id: profile.id,
        driver_id:   reportTarget.drivers?.id || null,
        issue_type:  reportType,
        description: reportDesc.trim(),
        severity:    'Medium',
        status:      'pending',
      })
      if (error) throw error
      toast('Report submitted. Thank you!', 'success')
      setReportTarget(null); setReportType(''); setReportDesc('')
    } catch (err) {
      toast('Failed to submit report: ' + err.message, 'error')
    } finally {
      setSubmittingReport(false)
    }
  }

  const FILTERS = ['all', 'pending', 'ongoing', 'completed', 'cancelled']
  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter)

  return (
    <div className="page-enter">
      {/* Filter tabs */}
      <div className="bg-white px-5 py-4 border-b border-border sticky top-0 z-10">
        <h2 className="font-black text-navy text-lg mb-3">My Rides</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                filter === f ? 'bg-green text-white' : 'bg-surface text-sub'
              }`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings list */}
      <div className="px-5 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sub">
            <Clock size={40} className="mx-auto opacity-20 mb-2" />
            <p className="font-medium text-sm">No {filter !== 'all' ? filter : ''} rides yet</p>
            {filter === 'all' && <p className="text-xs mt-1">Book your first ride from the Routes tab</p>}
          </div>
        ) : (
          filtered.map(b => (
            <div key={b.id} className="card p-4 space-y-3">
              {/* Route */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-navy flex-1 min-w-0">
                  <MapPin size={13} className="text-green flex-shrink-0" />
                  <span className="truncate">{b.pickup}</span>
                  <span className="text-sub text-xs">→</span>
                  <span className="truncate">{b.dropoff}</span>
                </div>
                <span className={`${STATUS_COLORS[b.status] || 'badge-gray'} ml-2 flex-shrink-0`}>
                  {b.status}
                </span>
              </div>

              {/* Driver */}
              {b.drivers && (
                <div className="flex items-center gap-3 bg-surface rounded-xl p-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ background: b.drivers.color || '#2E7D32' }}>
                    {b.drivers.name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy truncate">{b.drivers.name}</p>
                    <p className="text-xs text-sub">{b.drivers.vehicle_type} · {b.drivers.plate}</p>
                  </div>
                  <p className="text-lg font-black text-navy">₱{Number(b.fare || 0).toFixed(2)}</p>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between text-[10px] text-sub">
                <span>{new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="font-mono uppercase">{b.payment_method || 'cash'}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                {b.status === 'pending' && (
                  <button onClick={() => setCancelTarget(b)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors">
                    <Ban size={14} /> Cancel Booking
                  </button>
                )}
                {b.status === 'completed' && (
                  <>
                    <button onClick={() => { setRatingTarget(b); setStars(0); setComment('') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-200 text-amber-700 text-xs font-bold hover:bg-amber-50 transition-colors">
                      <Star size={14} /> Rate
                    </button>
                    <button onClick={() => { setReportTarget(b); setReportType(''); setReportDesc('') }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors">
                      <Flag size={14} /> Report
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
        <div className="h-4" />
      </div>

      {/* ── Cancel Modal ── */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6">
            <h3 className="font-black text-navy text-lg mb-2">Cancel Booking?</h3>
            <p className="text-sm text-sub mb-5">
              Cancel your ride from <strong>{cancelTarget.pickup}</strong> to <strong>{cancelTarget.dropoff}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setCancelTarget(null)}
                className="flex-1 py-3 rounded-2xl border border-border text-sub font-bold text-sm">
                Keep Booking
              </button>
              <button onClick={handleCancel} disabled={cancelling}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-bold text-sm flex items-center justify-center gap-2">
                {cancelling ? <Spinner size={18} /> : <><Ban size={16} /> Yes, Cancel</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Rating Modal ── */}
      {ratingTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-navy text-lg">Rate Your Ride</h3>
              <button onClick={() => setRatingTarget(null)}><X size={22} className="text-sub" /></button>
            </div>
            {ratingTarget.drivers && (
              <div className="flex items-center gap-3 bg-surface rounded-2xl p-4 mb-5">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black"
                  style={{ background: ratingTarget.drivers.color || '#2E7D32' }}>
                  {ratingTarget.drivers.name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <p className="font-bold text-navy">{ratingTarget.drivers.name}</p>
                  <p className="text-xs text-sub">{ratingTarget.drivers.vehicle_type} · {ratingTarget.drivers.plate}</p>
                </div>
              </div>
            )}
            <div className="text-center mb-4">
              <p className="text-sm font-bold text-sub mb-3">How was your ride?</p>
              <div className="flex justify-center">
                <StarRating value={stars} onChange={setStars} />
              </div>
              <p className="text-xs text-sub mt-2">
                {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][stars] || ''}
              </p>
            </div>
            <div className="mb-5">
              <label className="field-label">Leave a comment (optional)</label>
              <textarea className="field-input h-24 py-3 resize-none"
                placeholder="Share your experience..."
                value={comment} onChange={e => setComment(e.target.value)} />
            </div>
            <button onClick={handleRating} disabled={submitting || !stars}
              className="btn-primary w-full py-4 flex items-center justify-center gap-2 text-base disabled:opacity-50">
              {submitting ? <Spinner size={22} /> : <><Star size={18} /> Submit Rating</>}
            </button>
          </div>
        </div>
      )}

      {/* ── Report Modal ── */}
      {reportTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-navy text-lg">Report a Problem</h3>
              <button onClick={() => setReportTarget(null)}><X size={22} className="text-sub" /></button>
            </div>
            {reportTarget.drivers && (
              <div className="flex items-center gap-3 bg-surface rounded-2xl p-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm"
                  style={{ background: reportTarget.drivers.color || '#2E7D32' }}>
                  {reportTarget.drivers.name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
                </div>
                <div>
                  <p className="font-bold text-navy text-sm">{reportTarget.drivers.name}</p>
                  <p className="text-xs text-sub">{reportTarget.pickup} → {reportTarget.dropoff}</p>
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="field-label">Issue Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {['Overcharging','Reckless Driving','Discourtesy','No Show','Wrong Route','Other'].map(t => (
                  <button key={t} onClick={() => setReportType(t)} type="button"
                    className={`py-2.5 px-3 rounded-xl border-2 text-xs font-bold transition-all text-left ${
                      reportType === t ? 'border-red-400 bg-red-50 text-red-700' : 'border-border text-sub hover:border-red-200'
                    }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-5">
              <label className="field-label">Describe the issue *</label>
              <textarea className="field-input h-24 py-3 resize-none"
                placeholder="What happened? Please be specific..."
                value={reportDesc} onChange={e => setReportDesc(e.target.value)} />
            </div>
            <button onClick={handleReport} disabled={submittingReport || !reportType || !reportDesc.trim()}
              className="w-full py-4 rounded-2xl bg-red-500 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95 transition-all">
              {submittingReport ? <Spinner size={20} /> : <><AlertTriangle size={18} /> Submit Report</>}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
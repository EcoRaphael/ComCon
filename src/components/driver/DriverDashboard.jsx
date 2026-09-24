// src/components/driver/DriverDashboard.jsx
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { Power, Star, Wallet, Ticket, TrendingUp, ChevronRight, X, Calendar, CheckCircle2, XCircle, Clock } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

export default function DriverDashboard() {
  const { profile } = useAuth()
  const { toast }   = useToast()
  const navigate    = useNavigate()

  const [driver,   setDriver]   = useState(null)
  const [hasSchedule, setHasSchedule] = useState(true) // optimistic default — avoids a flash of "disabled" before the check resolves
  const [stats,    setStats]    = useState({ total: 0, completed: 0, earnings: 0, pending: 0 })
  const [allBookings, setAllBookings] = useState([])
  const [allRatings,  setAllRatings]  = useState([])
  const [activeModal, setActiveModal] = useState(null) // null | 'earnings' | 'rides' | 'completed' | 'rating'
  const [loading,  setLoading]  = useState(true)
  const [toggling, setToggling] = useState(false)
  const [pendingBookings, setPendingBookings] = useState([])

  useEffect(() => {
    if (!profile?.id) return
    fetchData()

    // Realtime — new booking requests
    const ch = supabase.channel('driver-bookings')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'bookings',
      }, payload => {
        if (payload.new.driver_id === driver?.id) {
          setPendingBookings(prev => [payload.new, ...prev])
          // The "Pending Requests" card's visibility AND its displayed
          // count both come from stats.pending, not from
          // pendingBookings.length — that was only ever set once, inside
          // fetchData(). Without updating it here too, a driver whose
          // dashboard loaded with zero pending bookings would never see
          // the card appear for a new one arriving live: the toast would
          // fire, but the actual UI wouldn't change.
          setStats(prev => ({
            ...prev,
            pending: prev.pending + 1,
            total: prev.total + 1,
          }))
          toast('🔔 New booking request!')
        }
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id, driver?.id])

  // Realtime — the driver's OWN record. Without this, admin verifying
  // (or suspending, or anything else) only updated admin's own screen
  // instantly (an optimistic local state update on their end) — the
  // driver themselves had no way to see it happen live and would need to
  // manually refresh to find out they'd been verified.
  useEffect(() => {
    if (!profile?.id) return
    const ch = supabase
      .channel('driver-own-record')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'drivers',
        filter: `user_id=eq.${profile.id}`,
      }, payload => {
        setDriver(prev => {
          if (!prev) return prev
          const wasVerified = prev.verified
          const nowVerified = payload.new.verified
          if (!wasVerified && nowVerified) {
            toast('✅ Your account has been verified! You can now go online.')
          }
          // rating is computed client-side from the ratings table in
          // fetchData(), not stored on the drivers row itself — keep the
          // already-computed value rather than overwriting it with
          // whatever stale/absent value the raw row update carries.
          return { ...prev, ...payload.new, rating: prev.rating }
        })
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  // Live GPS — Phase 2 (previously flagged as future work). While the
  // driver is online, watch their real position via the browser's
  // Geolocation API and push it to their own drivers row, throttled to
  // roughly once every 12 seconds (watchPosition can fire far more often
  // than that as the device moves — writing on every callback would be
  // wasteful and unnecessary for a map that updates a few times a
  // minute). This is "live while the tab is open," not true background
  // tracking — browser geolocation generally stops updating once the
  // driver locks their phone or switches away from the app, which is an
  // inherent constraint of a browser-based PWA, not something fixable
  // here. Going online still works normally even if location permission
  // is denied or unsupported — GPS is a bonus signal for admin's map, not
  // a requirement for accepting rides.
  const watchIdRef = useRef(null)
  const lastLocationSentRef = useRef(0)

  useEffect(() => {
    const isOnline = driver?.status === 'active'

    if (!isOnline || !driver?.id) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    if (!('geolocation' in navigator)) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now()
        if (now - lastLocationSentRef.current < 12000) return
        lastLocationSentRef.current = now

        supabase.from('drivers').update({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          location_updated_at: new Date().toISOString(),
        }).eq('id', driver.id).then(({ error }) => {
          if (error) console.error('[DriverDashboard] failed to update location:', error)
        })
      },
      (err) => {
        // Not toasted deliberately — permission denial shouldn't block
        // going online, and watchPosition can retry/fire this repeatedly,
        // which would make for an annoying, repeated error toast.
        console.warn('[DriverDashboard] geolocation error:', err.message)
      },
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [driver?.status, driver?.id])

  async function fetchData() {
    setLoading(true)
    // Get driver record by user_id
    const { data: driverRecord } = await supabase
      .from('drivers')
      .select('*')
      .eq('user_id', profile.id)
      .maybeSingle()

    if (!driverRecord) {
      setLoading(false)
      return
    }

    const { count: scheduleCount } = await supabase
      .from('schedules')
      .select('id', { count: 'exact', head: true })
      .eq('driver_id', driverRecord.id)
    setHasSchedule(!!scheduleCount)

    // Get bookings + ratings in parallel
    const [bookingsRes, ratingsRes] = await Promise.all([
      supabase.from('bookings')
        .select('id, status, fare, pickup, dropoff, created_at')
        .eq('driver_id', driverRecord.id)
        .order('created_at', { ascending: false }),
      supabase.from('ratings')
        .select('stars, comment, created_at, customer:users!customer_id(name)')
        .eq('driver_id', driverRecord.id)
        .order('created_at', { ascending: false }),
    ])
    const bookings   = bookingsRes.data  || []
    const ratingRows = ratingsRes.data   || []
    const avgRating  = ratingRows.length
      ? (ratingRows.reduce((s, r) => s + Number(r.stars || 0), 0) / ratingRows.length)
      : 0
    // Merge live rating into driver object
    const driverData = { ...driverRecord, rating: avgRating }
    setDriver(driverData)
    setAllBookings(bookings)
    setAllRatings(ratingRows)

    const completed = bookings.filter(b => b.status === 'completed')
    const pending   = bookings.filter(b => b.status === 'pending')
    const earnings  = completed.reduce((s, b) => s + Number(b.fare || 0), 0)

    setStats({ total: bookings?.length || 0, completed: completed.length, earnings, pending: pending.length })
    setPendingBookings(pending.slice(0, 3))
    setLoading(false)
  }

  async function toggleStatus() {
    if (!driver) return
    const goingOnline = driver.status !== 'active'
    if (goingOnline && !driver.verified) {
      toast('Your account must be verified by admin before you can go online.', 'error')
      return
    }
    if (goingOnline) {
      // Matches the DB-level check in enforce_verified_driver_status —
      // this is just the friendly client-side version so the driver
      // sees a clear message instead of a raw database error.
      const { count, error: scheduleCheckError } = await supabase
        .from('schedules')
        .select('id', { count: 'exact', head: true })
        .eq('driver_id', driver.id)
      if (scheduleCheckError) {
        toast('Failed to check your schedule — please try again.', 'error')
        return
      }
      if (!count) {
        toast('You don\'t have a schedule set yet — contact admin to get one assigned before going online.', 'error')
        return
      }
    }
    setToggling(true)
    const newStatus = goingOnline ? 'active' : 'inactive'
    const { error } = await supabase.from('drivers').update({ status: newStatus }).eq('id', driver.id)
    if (!error) {
      setDriver(prev => ({ ...prev, status: newStatus }))
      toast(newStatus === 'active' ? '🟢 You are now online!' : '🔴 You are now offline.')
    } else {
      toast('Failed: ' + error.message, 'error')
    }
    setToggling(false)
  }

  const isOnline    = driver?.status === 'active'
  const firstName   = profile?.name?.split(' ')[0] || 'Driver'
  const hour        = new Date().getHours()
  const greeting    = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'

  // Derived data for the four stat-card modals — computed from the raw
  // bookings/ratings already fetched in fetchData(), not separate
  // queries, since the dashboard already has everything needed.
  const completedBookings = allBookings.filter(b => b.status === 'completed')
  const now      = new Date()
  const todayStr = now.toISOString().split('T')[0]
  const weekAgo  = new Date(now); weekAgo.setDate(now.getDate() - 7)
  const monthAgo = new Date(now); monthAgo.setMonth(now.getMonth() - 1)
  const earningsBreakdown = {
    today:   completedBookings.filter(b => b.created_at?.startsWith(todayStr)).reduce((s, b) => s + Number(b.fare || 0), 0),
    week:    completedBookings.filter(b => new Date(b.created_at) >= weekAgo).reduce((s, b) => s + Number(b.fare || 0), 0),
    month:   completedBookings.filter(b => new Date(b.created_at) >= monthAgo).reduce((s, b) => s + Number(b.fare || 0), 0),
    allTime: stats.earnings,
  }
  const rideCounts = {
    pending:   allBookings.filter(b => b.status === 'pending').length,
    ongoing:   allBookings.filter(b => b.status === 'ongoing').length,
    completed: allBookings.filter(b => b.status === 'completed').length,
    cancelled: allBookings.filter(b => b.status === 'cancelled').length,
  }
  const ratingDist = [5, 4, 3, 2, 1].map(star => ({
    star, count: allRatings.filter(r => Math.round(r.stars) === star).length,
  }))

  if (loading) return <Spinner fullScreen label="Loading dashboard..." />

  return (
    <div className="page-enter pb-6">

      {/* Hero */}
      <div className={`px-5 pt-5 pb-14 transition-all duration-500 ${
        isOnline
          ? 'bg-gradient-to-br from-green-dark via-green to-green'
          : 'bg-gradient-to-br from-gray-700 via-gray-600 to-gray-500'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm">{greeting},</p>
            <h2 className="text-white text-2xl font-black">{firstName}! 🚗</h2>
            <p className="text-white/60 text-xs mt-0.5">{driver?.vehicle_type} · {driver?.plate}</p>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold px-3 py-1 rounded-full ${
              isOnline ? 'bg-white/20 text-white' : 'bg-white/10 text-white/60'
            }`}>
              {isOnline ? '🟢 Online' : '🔴 Offline'}
            </p>
          </div>
        </div>

        {/* Online/Offline toggle */}
        <button
          onClick={toggleStatus}
          disabled={toggling || (!isOnline && (!driver?.verified || !hasSchedule))}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all ${
            (!isOnline && (!driver?.verified || !hasSchedule)) ? 'bg-white/10 text-white/50 cursor-not-allowed' :
            isOnline
              ? 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
              : 'bg-white text-green hover:bg-green-light'
          }`}>
          {toggling
            ? <Spinner size={22} />
            : <>
                <Power size={22} strokeWidth={2.5} />
                {isOnline
                  ? 'Go Offline'
                  : !driver?.verified ? 'Verification Required'
                  : !hasSchedule ? 'Schedule Required'
                  : 'Go Online — Start Accepting Rides'}
              </>
          }
        </button>
        {!isOnline && driver?.verified && !hasSchedule && (
          <p className="text-white/70 text-xs text-center mt-2">
            Contact admin to get a schedule assigned before you can go online.
          </p>
        )}
      </div>

      <div className="px-4 -mt-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Wallet,    label: 'Total Earnings', value: `₱${stats.earnings.toFixed(2)}`, color: 'text-green',       bg: 'bg-green-light',  modal: 'earnings'  },
            { icon: Ticket,    label: 'Total Rides',    value: stats.total,                      color: 'text-blue-600',    bg: 'bg-blue-50',      modal: 'rides'      },
            { icon: TrendingUp,label: 'Completed',      value: stats.completed,                  color: 'text-purple-600',  bg: 'bg-purple-50',    modal: 'completed'  },
            { icon: Star,      label: 'Rating',         value: Number(driver?.rating || 0).toFixed(1) + ' ★', color: 'text-amber-600', bg: 'bg-amber-50', modal: 'rating' },
          ].map(({ icon: Icon, label, value, color, bg, modal }) => (
            <button
              key={label}
              onClick={() => setActiveModal(modal)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-border/50 text-left active:scale-[0.97] transition-transform"
            >
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-2.5`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-xl font-black text-navy">{value}</p>
              <p className="text-[10px] text-sub font-bold uppercase tracking-wide mt-0.5">{label}</p>
            </button>
          ))}
        </div>

        {/* Pending bookings */}
        {stats.pending > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-amber-200 overflow-hidden">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <p className="text-sm font-black text-navy">Pending Requests</p>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {stats.pending}
                </span>
              </div>
              <button onClick={() => navigate('/driver/bookings')}
                className="text-xs font-bold text-green flex items-center gap-1">
                View all <ChevronRight size={12} />
              </button>
            </div>
            <div className="px-4 pb-4">
              <button onClick={() => navigate('/driver/bookings')}
                className="w-full py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-all">
                <Ticket size={16} />
                Review & Accept Bookings
              </button>
            </div>
          </div>
        )}

        {/* Not verified warning */}
        {driver && !driver.verified && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-bold text-amber-800">Account Pending Verification</p>
              <p className="text-xs text-amber-700 mt-1">Your account is waiting for admin approval. You won't be able to go online or receive bookings until you're verified.</p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {stats.total === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-border/50">
            <div className="w-16 h-16 bg-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket size={28} className="text-green" />
            </div>
            <p className="font-black text-navy text-lg">No rides yet</p>
            <p className="text-sub text-sm mt-1">Go online to start accepting booking requests</p>
          </div>
        )}
      </div>

      {/* Stat card modals — each stat card opens its own tailored view
          rather than all four converging on the same bookings list. */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-5" onClick={() => setActiveModal(null)}>
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="font-black text-navy text-base">
                {activeModal === 'earnings'  && 'Earnings Breakdown'}
                {activeModal === 'rides'     && 'All Rides'}
                {activeModal === 'completed' && 'Completed Rides'}
                {activeModal === 'rating'    && 'Your Rating'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 text-sub hover:text-navy">
                <X size={20} />
              </button>
            </div>

            <div className="p-5">
              {/* Earnings */}
              {activeModal === 'earnings' && (
                <div className="space-y-3">
                  {[
                    { label: 'Today',    value: earningsBreakdown.today },
                    { label: 'This Week', value: earningsBreakdown.week },
                    { label: 'This Month', value: earningsBreakdown.month },
                    { label: 'All Time', value: earningsBreakdown.allTime, highlight: true },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className={`flex items-center justify-between rounded-2xl p-4 ${highlight ? 'bg-green-light' : 'bg-surface'}`}>
                      <span className={`text-sm font-semibold ${highlight ? 'text-green' : 'text-navy'}`}>{label}</span>
                      <span className={`text-lg font-black ${highlight ? 'text-green' : 'text-navy'}`}>₱{value.toFixed(2)}</span>
                    </div>
                  ))}
                  <p className="text-[11px] text-sub text-center pt-1">Based on completed rides only</p>
                </div>
              )}

              {/* Total Rides — breakdown by status */}
              {activeModal === 'rides' && (
                <div className="space-y-3">
                  {[
                    { label: 'Pending',   count: rideCounts.pending,   icon: Clock,        color: 'text-amber-600',  bg: 'bg-amber-50' },
                    { label: 'Ongoing',   count: rideCounts.ongoing,   icon: TrendingUp,   color: 'text-blue-600',   bg: 'bg-blue-50' },
                    { label: 'Completed', count: rideCounts.completed, icon: CheckCircle2, color: 'text-green',      bg: 'bg-green-light' },
                    { label: 'Cancelled', count: rideCounts.cancelled, icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50' },
                  ].map(({ label, count, icon: Icon, color, bg }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                        <Icon size={16} className={color} />
                      </div>
                      <span className="flex-1 text-sm font-semibold text-navy">{label}</span>
                      <span className="text-lg font-black text-navy">{count}</span>
                    </div>
                  ))}
                  <button
                    onClick={() => { setActiveModal(null); navigate('/driver/bookings') }}
                    className="w-full mt-2 py-3 rounded-2xl bg-surface text-navy text-sm font-bold flex items-center justify-center gap-1.5"
                  >
                    View Full Booking List <ChevronRight size={15} />
                  </button>
                </div>
              )}

              {/* Completed rides list */}
              {activeModal === 'completed' && (
                completedBookings.length === 0 ? (
                  <p className="text-sub text-sm text-center py-6">No completed rides yet.</p>
                ) : (
                  <div className="space-y-2">
                    {completedBookings.map(b => (
                      <div key={b.id} className="bg-surface rounded-2xl p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-navy truncate">{b.pickup} → {b.dropoff}</p>
                            <p className="text-[10px] text-sub mt-1 flex items-center gap-1">
                              <Calendar size={10} />
                              {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </p>
                          </div>
                          <span className="text-sm font-black text-green flex-shrink-0">₱{Number(b.fare || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              )}

              {/* Rating breakdown */}
              {activeModal === 'rating' && (
                <div className="space-y-5">
                  <div className="text-center">
                    <p className="text-4xl font-black text-navy">{Number(driver?.rating || 0).toFixed(1)}</p>
                    <div className="flex justify-center gap-0.5 mt-1">
                      {[1,2,3,4,5].map(s => (
                        <Star key={s} size={16} className={s <= Math.round(driver?.rating || 0) ? 'text-amber-500 fill-amber-500' : 'text-border'} />
                      ))}
                    </div>
                    <p className="text-xs text-sub mt-1">{allRatings.length} rating{allRatings.length !== 1 ? 's' : ''}</p>
                  </div>

                  <div className="space-y-1.5">
                    {ratingDist.map(({ star, count }) => {
                      const pct = allRatings.length ? Math.round((count / allRatings.length) * 100) : 0
                      return (
                        <div key={star} className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-sub w-8">{star}★</span>
                          <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-sub w-6 text-right">{count}</span>
                        </div>
                      )
                    })}
                  </div>

                  {allRatings.some(r => r.comment) && (
                    <div className="space-y-2 pt-1">
                      <p className="text-[10px] font-bold text-sub uppercase tracking-wider">Recent Feedback</p>
                      {allRatings.filter(r => r.comment).slice(0, 5).map((r, i) => (
                        <div key={i} className="bg-surface rounded-2xl p-3.5">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-navy">{r.customer?.name || 'Commuter'}</span>
                            <span className="text-amber-500 text-xs font-bold">{'★'.repeat(Math.round(r.stars))}</span>
                          </div>
                          <p className="text-xs text-sub">{r.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
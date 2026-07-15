// src/components/driver/DriverBookings.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { MapPin, User, Check, X, Play, Flag, Clock, ChevronDown } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

const STATUS_STYLE = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400 animate-pulse', label: 'Pending'    },
  ongoing:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500 animate-pulse',  label: 'Ongoing'    },
  completed: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green',                   label: 'Completed'  },
  cancelled: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400',                 label: 'Cancelled'  },
}

export default function DriverBookings() {
  const { profile } = useAuth()
  const { toast }   = useToast()

  const [driver,   setDriver]   = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('pending')
  const [acting,   setActing]   = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    fetchDriver()
  }, [profile?.id])

  useEffect(() => {
    if (!driver?.id) return
    fetchBookings()

    const ch = supabase.channel('driver-bookings-list')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `driver_id=eq.${driver.id}`
      }, () => fetchBookings())
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [driver?.id])

  async function fetchDriver() {
    const { data } = await supabase
      .from('drivers').select('id, name, plate, vehicle_type')
      .eq('user_id', profile.id).single()
    setDriver(data)
  }

  async function fetchBookings() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('*, users!customer_id(name, phone)')
      .eq('driver_id', driver.id)
      .order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }

  async function handleAction(bookingId, newStatus) {
    setActing(bookingId)
    // NOTE: completing a ride no longer auto-marks payment as paid.
    // The driver must explicitly confirm payment was received afterward
    // via handleConfirmPayment() below — this prevents a ride being
    // marked "paid" with zero verification.
    const updates = { status: newStatus }
    const { error } = await supabase.from('bookings').update(updates).eq('id', bookingId)
    if (error) {
      toast('Action failed: ' + error.message, 'error')
    } else {
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b))
      const messages = {
        ongoing:   '🚗 Ride started!',
        completed: '✅ Ride completed! Please confirm payment received.',
        cancelled: '❌ Booking declined.',
      }
      toast(messages[newStatus] || 'Updated')
    }
    setActing(null)
  }

  async function handleConfirmPayment(booking) {
    const methodLabel = (booking.payment_method || 'cash').toUpperCase()
    const confirmed = window.confirm(
      `Confirm you received ₱${Number(booking.fare || 0).toFixed(2)} in ${methodLabel} from ${booking.users?.name || 'the commuter'}?\n\n` +
      `This cannot be undone — only confirm once the payment is actually in hand.`
    )
    if (!confirmed) return

    setActing(booking.id)
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: 'paid' })
      .eq('id', booking.id)

    if (error) {
      toast('Failed to confirm payment: ' + error.message, 'error')
    } else {
      setBookings(prev => prev.map(b => b.id === booking.id ? { ...b, payment_status: 'paid' } : b))
      toast('💰 Payment confirmed received!')
    }
    setActing(null)
  }

  const FILTERS = ['pending', 'ongoing', 'completed', 'cancelled']
  const filtered = bookings.filter(b => b.status === filter)

  return (
    <div className="page-enter">
      <div className="bg-white px-5 py-4 border-b border-border sticky top-0 z-10">
        <h2 className="font-black text-navy text-lg mb-3">Bookings</h2>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {FILTERS.map(f => {
            const count = bookings.filter(b => b.status === f).length
            return (
              <button key={f} onClick={() => setFilter(f)}
                className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${
                  filter === f ? 'bg-green text-white' : 'bg-surface text-sub'
                }`}>
                {f}
                {count > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    filter === f ? 'bg-white/20 text-white' : 'bg-green-light text-green'
                  }`}>{count}</span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sub">
            <Clock size={40} className="mx-auto opacity-20 mb-2" />
            <p className="font-medium text-sm">No {filter} bookings</p>
          </div>
        ) : (
          filtered.map(b => {
            const s = STATUS_STYLE[b.status] || {}
            const isActing = acting === b.id
            return (
              <div key={b.id} className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
                {/* Status banner */}
                <div className={`px-4 py-2 flex items-center gap-2 ${s.bg}`}>
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <p className={`text-xs font-bold ${s.text}`}>{s.label}</p>
                  <span className="ml-auto text-xs text-sub font-mono">
                    {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="p-4 space-y-3">
                  {/* Route */}
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-green border-2 border-green" />
                      <div className="w-0.5 h-5 bg-border" />
                      <div className="w-2.5 h-2.5 rounded-full bg-cta border-2 border-cta" />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div>
                        <p className="text-[10px] text-sub font-bold uppercase">Pickup</p>
                        <p className="text-sm font-bold text-navy">{b.pickup}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-sub font-bold uppercase">Dropoff</p>
                        <p className="text-sm font-bold text-navy">{b.dropoff}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-black text-navy">₱{Number(b.fare||0).toFixed(2)}</p>
                      <p className={`text-[10px] uppercase font-bold ${b.payment_status === 'paid' ? 'text-green-600' : 'text-sub'}`}>
                        {b.payment_method || 'cash'} {b.payment_status === 'paid' ? '· Paid' : b.status === 'completed' ? '· Unconfirmed' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Commuter */}
                  <div className="flex items-center gap-2.5 bg-surface rounded-xl p-2.5">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User size={15} className="text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-navy">{b.users?.name || 'Commuter'}</p>
                      <p className="text-[10px] text-sub">{b.users?.phone || 'No phone'}</p>
                    </div>
                    <span className="text-[10px] text-sub bg-white border border-border px-2 py-1 rounded-full font-bold">
                      {b.vehicle_type}
                    </span>
                  </div>

                  {/* Action buttons */}
                  {b.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleAction(b.id, 'cancelled')} disabled={isActing}
                        className="flex-1 py-2.5 rounded-xl border-2 border-red-200 text-red-600 font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-red-50 transition-colors disabled:opacity-50">
                        {isActing ? <Spinner size={16} /> : <><X size={16} /> Decline</>}
                      </button>
                      <button onClick={() => handleAction(b.id, 'ongoing')} disabled={isActing}
                        className="flex-[2] py-2.5 rounded-xl bg-green text-white font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-green-dark transition-colors disabled:opacity-50">
                        {isActing ? <Spinner size={16} /> : <><Check size={16} /> Accept & Start Ride</>}
                      </button>
                    </div>
                  )}

                  {b.status === 'ongoing' && (
                    <button onClick={() => handleAction(b.id, 'completed')} disabled={isActing}
                      className="w-full py-3 rounded-xl bg-green text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-dark transition-colors disabled:opacity-50">
                      {isActing ? <Spinner size={18} /> : <><Flag size={16} /> Mark as Completed</>}
                    </button>
                  )}

                  {b.status === 'completed' && b.payment_status !== 'paid' && (
                    <button onClick={() => handleConfirmPayment(b)} disabled={isActing}
                      className="w-full py-3 rounded-xl bg-amber-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50">
                      {isActing
                        ? <Spinner size={18} />
                        : <>💰 Confirm {(b.payment_method || 'cash').toUpperCase()} Received</>
                      }
                    </button>
                  )}

                  {b.status === 'completed' && b.payment_status === 'paid' && (
                    <div className="w-full py-2.5 rounded-xl bg-green-50 text-green-700 font-bold text-xs flex items-center justify-center gap-1.5">
                      <Check size={14} /> Payment Confirmed
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
        <div className="h-4" />
      </div>
    </div>
  )
}
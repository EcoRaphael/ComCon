// src/components/driver/DriverDashboard.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { useNavigate } from 'react-router-dom'
import { Power, Star, Wallet, Ticket, TrendingUp, ChevronRight } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

export default function DriverDashboard() {
  const { profile } = useAuth()
  const { toast }   = useToast()
  const navigate    = useNavigate()

  const [driver,   setDriver]   = useState(null)
  const [stats,    setStats]    = useState({ total: 0, completed: 0, earnings: 0, pending: 0 })
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
          toast('🔔 New booking request!')
        }
      })
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id, driver?.id])

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

    // Get bookings + ratings in parallel
    const [bookingsRes, ratingsRes] = await Promise.all([
      supabase.from('bookings')
        .select('id, status, fare, created_at')
        .eq('driver_id', driverRecord.id),
      supabase.from('ratings')
        .select('stars')
        .eq('driver_id', driverRecord.id),
    ])
    const bookings   = bookingsRes.data  || []
    const ratingRows = ratingsRes.data   || []
    const avgRating  = ratingRows.length
      ? (ratingRows.reduce((s, r) => s + Number(r.stars || 0), 0) / ratingRows.length)
      : 0
    // Merge live rating into driver object
    const driverData = { ...driverRecord, rating: avgRating }
    setDriver(driverData)

    const completed = bookings.filter(b => b.status === 'completed')
    const pending   = bookings.filter(b => b.status === 'pending')
    const earnings  = completed.reduce((s, b) => s + Number(b.fare || 0), 0)

    setStats({ total: bookings?.length || 0, completed: completed.length, earnings, pending: pending.length })
    setPendingBookings(pending.slice(0, 3))
    setLoading(false)
  }

  async function toggleStatus() {
    if (!driver) return
    setToggling(true)
    const newStatus = driver.status === 'active' ? 'inactive' : 'active'
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
          disabled={toggling}
          className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-3 shadow-lg active:scale-95 transition-all ${
            isOnline
              ? 'bg-white/10 text-white border-2 border-white/30 hover:bg-white/20'
              : 'bg-white text-green hover:bg-green-light'
          }`}>
          {toggling
            ? <Spinner size={22} />
            : <>
                <Power size={22} strokeWidth={2.5} />
                {isOnline ? 'Go Offline' : 'Go Online — Start Accepting Rides'}
              </>
          }
        </button>
      </div>

      <div className="px-4 -mt-6 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Wallet,    label: 'Total Earnings', value: `₱${stats.earnings.toFixed(2)}`, color: 'text-green',       bg: 'bg-green-light'   },
            { icon: Ticket,    label: 'Total Rides',    value: stats.total,                      color: 'text-blue-600',    bg: 'bg-blue-50'       },
            { icon: TrendingUp,label: 'Completed',      value: stats.completed,                  color: 'text-purple-600',  bg: 'bg-purple-50'     },
            { icon: Star,      label: 'Rating',         value: Number(driver?.rating || 0).toFixed(1) + ' ★', color: 'text-amber-600', bg: 'bg-amber-50' },
          ].map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-2.5`}>
                <Icon size={18} className={color} />
              </div>
              <p className="text-xl font-black text-navy">{value}</p>
              <p className="text-[10px] text-sub font-bold uppercase tracking-wide mt-0.5">{label}</p>
            </div>
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
              <p className="text-xs text-amber-700 mt-1">Your account is waiting for admin approval. You can still receive bookings once verified.</p>
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
    </div>
  )
}
// src/components/pages/Home.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase/client'
import {
  Clock, Car, Bus, Star,
  Navigation, History, User, ArrowRight, ChevronRight
} from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

const VEHICLE_ICONS  = { Tricycle: Car, Timbol: Bus, Multicab: Bus }
const VEHICLE_COLORS = {
  Tricycle: 'bg-blue-50 text-blue-600',
  Timbol:   'bg-amber-50 text-amber-600',
  Multicab: 'bg-purple-50 text-purple-600',
}
const STATUS_STYLE = {
  pending:   { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400 animate-pulse', label: 'Waiting for driver' },
  ongoing:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500 animate-pulse',  label: 'On the way'         },
  completed: { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green',                   label: 'Completed'          },
  cancelled: { bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-400',                 label: 'Cancelled'          },
}

export default function Home() {
  const { profile } = useAuth()
  const navigate    = useNavigate()

  const [activeBooking,  setActiveBooking]  = useState(null)
  const [recentBookings, setRecentBookings] = useState([])
  const [fareMatrix,     setFareMatrix]     = useState([])
  const [loading,        setLoading]        = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    fetchData()
    const ch = supabase.channel('home-updates')
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'bookings',
        filter: `customer_id=eq.${profile.id}`
      }, payload => {
        setActiveBooking(prev =>
          prev?.id === payload.new.id ? { ...prev, ...payload.new } : prev
        )
      }).subscribe()
    return () => supabase.removeChannel(ch)
  }, [profile?.id])

  async function fetchData() {
    setLoading(true)
    const [bookingsRes, fareRes] = await Promise.all([
      supabase.from('bookings')
        .select('*, drivers!driver_id(name, plate, vehicle_type, rating, color)')
        .eq('customer_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase.from('fare_matrix').select('*').order('vehicle_type'),
    ])
    const bookings = bookingsRes.data || []
    setActiveBooking(bookings.find(b => ['pending','ongoing'].includes(b.status)) || null)
    setRecentBookings(bookings.filter(b => !['pending','ongoing'].includes(b.status)).slice(0, 3))
    setFareMatrix(fareRes.data || [])
    setLoading(false)
  }

  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = profile?.name?.split(' ')[0] || 'Commuter'

  return (
    <div className="page-enter pb-8">

      {/* Hero */}
      <div className="bg-gradient-to-br from-green-dark via-green to-green px-5 pt-5 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-white/70 text-sm">{greeting},</p>
            <h2 className="text-white text-2xl font-black">
              {firstName}! 👋
            </h2>
          </div>
          <button onClick={() => navigate('/profile')}
            className="w-11 h-11 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-black text-sm">
            {profile?.name?.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase() || 'CC'}
          </button>
        </div>


      </div>

      <div className="px-4 -mt-8 space-y-4">

        {/* Active booking */}
        {loading ? (
          <div className="bg-white rounded-2xl p-5 shadow-lg flex justify-center">
            <Spinner size={28} />
          </div>
        ) : activeBooking ? (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden cursor-pointer active:scale-[0.98] transition-all"
            onClick={() => navigate('/my-rides')}>
            {/* Status banner */}
            <div className={`px-5 py-2.5 flex items-center gap-2 ${STATUS_STYLE[activeBooking.status]?.bg || 'bg-surface'}`}>
              <span className={`w-2 h-2 rounded-full ${STATUS_STYLE[activeBooking.status]?.dot}`} />
              <p className={`text-xs font-bold ${STATUS_STYLE[activeBooking.status]?.text}`}>
                {STATUS_STYLE[activeBooking.status]?.label}
              </p>
              <span className="ml-auto text-xs text-sub">Tap for details →</span>
            </div>
            <div className="p-4">
              {/* Route */}
              <div className="flex items-start gap-3 mb-3">
                <div className="flex flex-col items-center gap-1 mt-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-green border-2 border-green" />
                  <div className="w-0.5 h-5 bg-border" />
                  <div className="w-2.5 h-2.5 rounded-full bg-cta border-2 border-cta" />
                </div>
                <div className="flex-1 space-y-1.5">
                  <div>
                    <p className="text-[10px] text-sub font-bold uppercase tracking-wide">Pickup</p>
                    <p className="text-sm font-bold text-navy truncate">{activeBooking.pickup}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-sub font-bold uppercase tracking-wide">Dropoff</p>
                    <p className="text-sm font-bold text-navy truncate">{activeBooking.dropoff}</p>
                  </div>
                </div>
                <p className="text-xl font-black text-navy flex-shrink-0">
                  ₱{Number(activeBooking.fare||0).toFixed(2)}
                </p>
              </div>
              {/* Driver info */}
              {activeBooking.drivers && (
                <div className="flex items-center gap-2.5 bg-surface rounded-xl p-2.5">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0"
                    style={{ background: activeBooking.drivers.color || '#2E7D32' }}>
                    {activeBooking.drivers.name?.split(' ').map(w=>w[0]).join('').slice(0,2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-navy truncate">{activeBooking.drivers.name}</p>
                    <p className="text-[10px] text-sub">{activeBooking.drivers.plate} · {activeBooking.drivers.vehicle_type}</p>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-500 text-xs font-bold flex-shrink-0">
                    <Star size={11} fill="currentColor" />
                    {Number(activeBooking.drivers.rating||0).toFixed(1)}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Navigation, label: 'Book\nRide',  color: 'bg-green-light', text: 'text-green',       path: '/routes'   },
            { icon: History,    label: 'My\nRides',   color: 'bg-blue-50',     text: 'text-blue-600',    path: '/my-rides' },
            { icon: User,       label: 'My\nProfile', color: 'bg-purple-50',   text: 'text-purple-600',  path: '/profile'  },
          ].map(({ icon: Icon, label, color, text, path }) => (
            <button key={path} onClick={() => navigate(path)}
              className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2.5 shadow-sm active:scale-95 transition-all border border-border/50">
              <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center`}>
                <Icon size={20} className={text} />
              </div>
              <p className="text-[11px] font-bold text-navy text-center leading-tight whitespace-pre-line">{label}</p>
            </button>
          ))}
        </div>

        {/* Fare rates */}
        {fareMatrix.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
              <p className="text-sm font-black text-navy">Today's Fare Rates</p>
              <span className="text-[10px] text-sub bg-surface px-2 py-1 rounded-full font-medium">LTFRB Regulated</span>
            </div>
            <div className="grid grid-cols-2 gap-px bg-border/20">
              {fareMatrix.map(f => {
                const Icon = VEHICLE_ICONS[f.vehicle_type] || Car
                return (
                  <div key={f.vehicle_type} className="bg-white px-4 py-3.5 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${VEHICLE_COLORS[f.vehicle_type] || 'bg-gray-50 text-gray-600'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-sub font-bold">{f.vehicle_type}</p>
                      <p className="text-lg font-black text-navy leading-tight">₱{Number(f.base_fare).toFixed(0)}</p>
                      <p className="text-[10px] text-sub">{f.seat_count || 0} seats · ₱{Number(f.per_seat || 0).toFixed(0)}/seat</p>
                    </div>
                  </div>
                )
              })}
            </div>
            <button onClick={() => navigate('/routes')}
              className="w-full py-3 text-xs font-bold text-green flex items-center justify-center gap-1 border-t border-border/30 bg-green-light/30">
              Book a ride now <ArrowRight size={12} />
            </button>
          </div>
        )}

        {/* Recent rides */}
        {recentBookings.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden">
            <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-border/30">
              <p className="text-sm font-black text-navy">Recent Rides</p>
              <button onClick={() => navigate('/my-rides')} className="text-xs font-bold text-green">
                See all
              </button>
            </div>
            <div className="divide-y divide-border/30">
              {recentBookings.map(b => {
                const s = STATUS_STYLE[b.status] || {}
                return (
                  <div key={b.id}
                    className="px-4 py-3.5 flex items-center gap-3 cursor-pointer active:bg-surface transition-colors"
                    onClick={() => navigate('/my-rides')}>
                    <div className="w-9 h-9 bg-surface rounded-xl flex items-center justify-center flex-shrink-0">
                      <Clock size={15} className="text-sub" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-navy truncate">{b.pickup} → {b.dropoff}</p>
                      <p className="text-[10px] text-sub mt-0.5">
                        {b.vehicle_type} · {new Date(b.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-navy">₱{Number(b.fare||0).toFixed(2)}</p>
                      <span className={`text-[10px] font-bold ${s.text || 'text-sub'}`}>{b.status}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Empty state — first time user */}
        {!loading && !activeBooking && recentBookings.length === 0 && (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-border/50">
            <div className="w-16 h-16 bg-green-light rounded-full flex items-center justify-center mx-auto mb-4">
              <Navigation size={28} className="text-green" />
            </div>
            <p className="font-black text-navy text-lg">Ready to ride?</p>
            <p className="text-sub text-sm mt-1 mb-5 leading-relaxed">
              Browse available routes and book your first ride in Calbayog City
            </p>
            <button onClick={() => navigate('/routes')} className="btn-primary px-8 py-3">
              Browse Routes
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
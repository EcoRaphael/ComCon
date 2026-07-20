// src/components/pages/Routes.jsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { Search, MapPin, ArrowRight, Car, Bus, ChevronRight, X, User, CreditCard } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import LocationPicker from '@/components/ui/LocationPicker'

const VEHICLE_ICONS = { Tricycle: Car, Timbol: Bus, Multicab: Bus }
const METHODS = [
  { id: 'cash', label: 'Cash', icon: '💵', available: true },
  { id: 'gcash', label: 'GCash', icon: '📱', available: false },
  { id: 'maya', label: 'Maya', icon: '💳', available: false },
]

export default function RoutesPage() {
  const { profile } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [routes, setRoutes] = useState([])
  const [fareMatrix, setFareMatrix] = useState([])
  const [drivers, setDrivers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)

  // Booking flow
  const [step, setStep] = useState(null)   // null | 'location' | 'select-vehicle' | 'select-driver' | 'confirm'
  const [selected, setSelected] = useState(null)   // selected route
  const [pickup, setPickup] = useState('')     // custom pickup landmark
  const [dropoff, setDropoff] = useState('')     // custom dropoff landmark
  const [vehicle, setVehicle] = useState('')
  const [driver, setDriver] = useState(null)
  const [showDriverProfile, setShowDriverProfile] = useState(false)
  const [method, setMethod] = useState('cash')

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [routesRes, fareRes, driversRes] = await Promise.all([
      supabase.from('routes').select('*').eq('status', 'active').order('name'),
      supabase.from('fare_matrix').select('*'),
      supabase.from('drivers')
        .select('id, name, plate, vehicle_type, route, rating, color, status, verified')
        .eq('status', 'active'),
    ])
    console.log('[Routes] drivers fetched:', driversRes.data, 'error:', driversRes.error)
    setRoutes(routesRes.data || [])
    setFareMatrix(fareRes.data || [])
    setDrivers(driversRes.data || [])
    setLoading(false)
  }

  const filtered = routes.filter(r => {
    const q = search.toLowerCase()
    return !q || r.name?.toLowerCase().includes(q) ||
      r.origin?.toLowerCase().includes(q) || r.destination?.toLowerCase().includes(q)
  })

  // Commuters are charged the flat base fare for the vehicle type —
  // seat_count/per_seat on fare_matrix are for admin's rate-setting
  // reference only, not added on top of what the commuter pays.
  const getBaseFare = (vehicleType) => {
    const f = fareMatrix.find(fm => fm.vehicle_type === vehicleType)
    return f ? Number(f.base_fare) : 0
  }

  const availableDrivers = drivers.filter(d =>
    vehicle && d.vehicle_type === vehicle
  ).slice(0, 5)

  const estimatedFare = selected && vehicle
    ? getBaseFare(vehicle)
    : 0

  const handleBookNow = async () => {
    if (!driver || !vehicle || !selected || !pickup || !dropoff) return
    if (method !== 'cash') {
      toast('Online payment is not yet available. Please select Cash to book.', 'error')
      return
    }
    setBooking(true)
    try {
      const { error } = await supabase.from('bookings').insert({
        customer_id: profile.id,
        driver_id: driver.id,
        pickup,
        dropoff,
        vehicle_type: vehicle,
        fare: estimatedFare.toFixed(2),
        status: 'pending',
        payment_status: 'pending',
        payment_method: method,
      })
      if (error) throw error
      toast('Booking placed! Waiting for driver.', 'success')
      closeModal()
      navigate('/my-rides')
    } catch (err) {
      toast('Booking failed: ' + err.message, 'error')
    } finally {
      setBooking(false)
    }
  }

  const openRoute = (route) => {
    setSelected(route)
    // Pre-fill pickup/dropoff from route origin/destination
    setPickup(route.origin)
    setDropoff(route.destination)
    setStep('location')
  }

  const closeModal = () => {
    setStep(null); setSelected(null)
    setPickup(''); setDropoff('')
    setVehicle(''); setDriver(null)
  }

  return (
    <div className="page-enter">

      {/* Search */}
      <div className="bg-white px-5 py-4 border-b border-border sticky top-0 z-10">
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sub" />
          <input className="field-input pl-10 py-2.5 h-auto text-sm"
            placeholder="Search routes, barangays..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="px-5 py-4 space-y-3">
        <p className="text-xs font-bold text-sub uppercase tracking-wider">
          {filtered.length} Available Routes
        </p>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size={32} /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sub">
            <MapPin size={40} className="mx-auto opacity-20 mb-2" />
            <p className="font-medium text-sm">No routes found</p>
          </div>
        ) : (
          filtered.map(route => {
            const vehicleTypes = route.vehicle_types || []
            const lowestFare = vehicleTypes.length
              ? Math.min(...vehicleTypes.map(v => getBaseFare(v)))
              : 0
            return (
              <div key={route.id}
                className="card p-4 active:scale-[0.98] transition-all cursor-pointer"
                onClick={() => openRoute(route)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy text-sm">{route.name}</p>
                    <div className="flex items-center gap-2 text-xs text-sub mt-1">
                      <MapPin size={11} className="text-green flex-shrink-0" />
                      <span className="truncate">{route.origin}</span>
                      <ArrowRight size={10} className="flex-shrink-0" />
                      <span className="truncate">{route.destination}</span>
                    </div>
                    {/* Distance no longer shown — fare is seat-based, not distance-based */}
                    <div className="flex gap-1 flex-wrap mt-2">
                      {vehicleTypes.map(v => {
                        const Icon = VEHICLE_ICONS[v] || Car
                        return (
                          <span key={v} className="flex items-center gap-1 bg-green-light text-green text-[10px] font-bold px-2 py-0.5 rounded-full">
                            <Icon size={9} /> {v}
                          </span>
                        )
                      })}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-xs text-sub">from</p>
                    <p className="text-lg font-black text-navy">₱{lowestFare.toFixed(0)}</p>
                    <ChevronRight size={16} className="text-sub ml-auto mt-1" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── Booking Modal ── */}
      {step && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center"
          onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="font-black text-navy text-lg">
                  {step === 'location' ? 'Set Pickup & Dropoff' :
                    step === 'select-vehicle' ? 'Choose Vehicle' :
                      step === 'select-driver' ? 'Choose Driver' : 'Confirm Booking'}
                </h3>
                <p className="text-xs text-sub mt-0.5">{selected?.name}</p>
              </div>
              <button onClick={closeModal} className="text-sub hover:text-navy p-1">
                <X size={22} />
              </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-6">
              {['location', 'select-vehicle', 'select-driver', 'confirm'].map((s, i) => {
                const steps = ['location', 'select-vehicle', 'select-driver', 'confirm']
                const current = steps.indexOf(step)
                return (
                  <div key={s} className={`h-1.5 rounded-full flex-1 transition-all ${i <= current ? 'bg-green' : 'bg-surface'
                    }`} />
                )
              })}
            </div>

            {/* ── Step 1: Location picker ── */}
            {step === 'location' && (
              <div className="space-y-4">
                <div className="bg-green-light rounded-2xl p-3 text-xs text-green font-medium">
                  📍 Select your exact pickup and dropoff points in Calbayog City
                </div>

                <LocationPicker
                  label="Pickup Location"
                  placeholder="Where will you be picked up?"
                  value={pickup}
                  onChange={setPickup}
                />

                <LocationPicker
                  label="Dropoff Location"
                  placeholder="Where are you going?"
                  value={dropoff}
                  onChange={setDropoff}
                />

                <button
                  onClick={() => setStep('select-vehicle')}
                  disabled={!pickup || !dropoff}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-40">
                  Continue →
                </button>
              </div>
            )}

            {/* ── Step 2: Select vehicle ── */}
            {step === 'select-vehicle' && (
              <div className="space-y-3">
                <button onClick={() => setStep('location')}
                  className="text-xs font-bold text-green mb-1 flex items-center gap-1">
                  ← Change locations
                </button>

                {/* Show selected locations */}
                <div className="bg-surface rounded-xl p-3 flex items-center gap-2 text-xs text-navy mb-2">
                  <MapPin size={12} className="text-green flex-shrink-0" />
                  <span className="truncate font-medium">{pickup}</span>
                  <ArrowRight size={10} className="text-sub flex-shrink-0" />
                  <MapPin size={12} className="text-cta flex-shrink-0" />
                  <span className="truncate font-medium">{dropoff}</span>
                </div>

                {(selected?.vehicle_types || []).map(v => {
                  const Icon = VEHICLE_ICONS[v] || Car
                  const baseFare = getBaseFare(v)
                  const seatInfo = fareMatrix.find(fm => fm.vehicle_type === v)
                  const count = drivers.filter(d => d.vehicle_type === v).length
                  return (
                    <button key={v}
                      onClick={() => { setVehicle(v); setStep('select-driver') }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-border hover:border-green/40 transition-all text-left active:scale-[0.98]">
                      <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center">
                        <Icon size={22} className="text-green" />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-navy">{v}</p>
                        <p className="text-xs text-sub">
                          {count} driver{count !== 1 ? 's' : ''} available
                          {seatInfo?.seat_count ? ` · ${seatInfo.seat_count} seats` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black text-navy">₱{baseFare.toFixed(0)}</p>
                        <p className="text-[10px] text-sub">base fare</p>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {/* ── Step 3: Select driver ── */}
            {step === 'select-driver' && (
              <div className="space-y-3">
                <button onClick={() => setStep('select-vehicle')}
                  className="text-xs font-bold text-green mb-1 flex items-center gap-1">
                  ← Back to vehicles
                </button>
                {availableDrivers.length === 0 ? (
                  <div className="text-center py-8 text-sub">
                    <User size={36} className="mx-auto opacity-20 mb-2" />
                    <p className="text-sm font-medium">No {vehicle} drivers available</p>
                    <p className="text-xs mt-1">Try a different vehicle type</p>
                  </div>
                ) : (
                  availableDrivers.map(d => (
                    <button key={d.id}
                      onClick={() => { setDriver(d); setStep('confirm') }}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left
                        ${driver?.id === d.id ? 'border-green bg-green-light' : 'border-border hover:border-green/40'}`}>
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm"
                        style={{ background: d.color || '#2E7D32' }}>
                        {d.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-navy text-sm">{d.name}</p>
                        <p className="text-xs text-sub">{d.vehicle_type} · {d.plate}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-amber-500 text-sm font-bold">★ {Number(d.rating || 0).toFixed(1)}</p>
                        <span className="badge-green text-[9px]">Verified</span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {/* ── Step 4: Confirm ── */}
            {step === 'confirm' && driver && (
              <div className="space-y-4">
                <button onClick={() => setStep('select-driver')}
                  className="text-xs font-bold text-green flex items-center gap-1">
                  ← Back
                </button>

                {/* Pickup → Dropoff */}
                <div className="bg-surface rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 pt-0.5">
                      <div className="w-3 h-3 rounded-full bg-green border-2 border-green" />
                      <div className="w-0.5 h-6 bg-border" />
                      <div className="w-3 h-3 rounded-full bg-cta border-2 border-cta" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-[10px] text-sub font-bold uppercase">Pickup</p>
                        <p className="text-sm font-bold text-navy">{pickup}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-sub font-bold uppercase">Dropoff</p>
                        <p className="text-sm font-bold text-navy">{dropoff}</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-sub border-t border-border pt-2">
                    {selected?.name} · {vehicle}
                  </p>
                </div>

                {/* Driver */}
                <button
                  type="button"
                  onClick={() => setShowDriverProfile(true)}
                  className="w-full bg-surface rounded-2xl p-4 flex items-center gap-3 text-left hover:bg-border/40 transition-colors active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-black flex-shrink-0"
                    style={{ background: driver.color || '#2E7D32' }}>
                    {driver.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-navy">{driver.name}</p>
                    <p className="text-xs text-sub">{driver.plate} · ★ {Number(driver.rating || 0).toFixed(1)}</p>
                  </div>
                  <ChevronRight size={18} className="text-sub flex-shrink-0" />
                </button>

                {/* Payment method */}
                <div>
                  <label className="field-label">Payment Method</label>
                  <div className="flex gap-2">
                    {METHODS.map(m => (
                      <button key={m.id}
                        onClick={() => m.available && setMethod(m.id)}
                        disabled={!m.available}
                        type="button"
                        className={`relative flex-1 flex flex-col items-center gap-1 py-3 rounded-2xl border-2 text-xs font-bold transition-all
                          ${method === m.id ? 'border-green bg-green-light text-green' : 'border-border text-sub'}
                          ${!m.available ? 'opacity-40 cursor-not-allowed' : ''}`}>
                        <span className="text-xl">{m.icon}</span>
                        {m.label}
                        {!m.available && (
                          <span className="absolute -top-2 -right-1 bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                            Soon
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  {!METHODS.find(m => m.id === method)?.available && (
                    <p className="text-[10px] text-amber-600 font-medium mt-2">
                      ⚠️ Online payment isn't available yet — please select Cash to continue.
                    </p>
                  )}
                </div>

                {/* Fare */}
                <div className="bg-green rounded-2xl p-4 flex items-center justify-between text-white">
                  <div>
                    <p className="text-white/70 text-xs">Total Fare</p>
                    <p className="text-3xl font-black">₱{estimatedFare.toFixed(2)}</p>
                  </div>
                  <CreditCard size={28} className="text-white/40" />
                </div>

                <button onClick={handleBookNow} disabled={booking || method !== 'cash'}
                  className="btn-cta w-full py-4 flex items-center justify-center gap-2 text-base disabled:opacity-40 disabled:cursor-not-allowed">
                  {booking ? <Spinner size={22} /> : 'Confirm Booking'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Driver profile modal — opens when tapping the driver row in Confirm Booking */}
      {showDriverProfile && driver && (
        <div
          className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-5"
          onClick={() => setShowDriverProfile(false)}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-sm p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowDriverProfile(false)}
              className="absolute top-4 right-4 text-sub hover:text-navy"
            >
              <X size={20} />
            </button>

            <div className="flex flex-col items-center text-center pt-2">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-2xl mb-3"
                style={{ background: driver.color || '#2E7D32' }}
              >
                {driver.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </div>
              <h3 className="text-xl font-black text-navy">{driver.name}</h3>
              {driver.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green bg-green-light px-2.5 py-0.5 rounded-full mt-1.5">
                  ✓ Verified Driver
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="bg-surface rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Rating</p>
                <p className="font-black text-navy text-lg">★ {Number(driver.rating || 0).toFixed(1)}</p>
              </div>
              <div className="bg-surface rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Vehicle</p>
                <p className="font-black text-navy text-sm">{driver.vehicle_type}</p>
              </div>
              <div className="bg-surface rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Plate No.</p>
                <p className="font-black text-navy text-sm">{driver.plate}</p>
              </div>
              <div className="bg-surface rounded-2xl p-3 text-center">
                <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-1">Route</p>
                <p className="font-black text-navy text-sm truncate">{driver.route || 'Anywhere'}</p>
              </div>
            </div>

            <button
              onClick={() => setShowDriverProfile(false)}
              className="btn-primary w-full py-3.5 mt-6"
            >
              Back to Booking
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// src/components/driver/DriverSchedule.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase/client'
import { Calendar, Clock } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

const DAY_COLORS = {
  Mon: 'bg-blue-50 text-blue-700 border-blue-200',
  Tue: 'bg-purple-50 text-purple-700 border-purple-200',
  Wed: 'bg-green-50 text-green-700 border-green-200',
  Thu: 'bg-amber-50 text-amber-700 border-amber-200',
  Fri: 'bg-red-50 text-red-700 border-red-200',
  Sat: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  Sun: 'bg-gray-50 text-gray-600 border-gray-200',
}
const DAY_FULL = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' }

export default function DriverSchedule() {
  const { profile } = useAuth()
  const [schedules, setSchedules] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [driver,    setDriver]    = useState(null)

  useEffect(() => {
    if (!profile?.id) return
    fetchData()
  }, [profile?.id])

  async function fetchData() {
    setLoading(true)
    const { data: d } = await supabase
      .from('drivers').select('id, name, vehicle_type, plate, route')
      .eq('user_id', profile.id).single()
    if (!d) { setLoading(false); return }
    setDriver(d)

    const { data } = await supabase
      .from('schedules').select('*')
      .eq('driver_id', d.id)
      .order('day_of_week')
    setSchedules(data || [])
    setLoading(false)
  }

  const today = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][new Date().getDay()]

  if (loading) return <Spinner fullScreen label="Loading schedule..." />

  return (
    <div className="page-enter px-4 py-5 space-y-4 pb-8">

      {/* Header */}
      <div className="bg-gradient-to-br from-green-dark to-green rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Calendar size={20} className="text-white" />
          </div>
          <div>
            <p className="font-black text-lg">My Schedule</p>
            <p className="text-white/70 text-xs">{driver?.vehicle_type} · {driver?.plate}</p>
          </div>
        </div>
        <p className="text-white/60 text-xs mt-2">
          {schedules.filter(s => s.is_active).length} active days this week
        </p>
      </div>

      {/* Schedule list */}
      {schedules.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-border/50">
          <Calendar size={40} className="mx-auto opacity-20 mb-3 text-sub" />
          <p className="font-black text-navy">No schedule set</p>
          <p className="text-sub text-sm mt-1">Contact admin to set your schedule</p>
        </div>
      ) : (
        <div className="space-y-2">
          {schedules.map(s => {
            const isToday = s.day_of_week === today
            const colorClass = DAY_COLORS[s.day_of_week] || 'bg-gray-50 text-gray-600 border-gray-200'
            return (
              <div key={s.id}
                className={`bg-white rounded-2xl p-4 shadow-sm border flex items-center gap-4 ${
                  isToday ? 'border-green ring-2 ring-green/20' : 'border-border/50'
                }`}>
                <div className={`w-14 h-14 rounded-xl flex flex-col items-center justify-center border ${colorClass} flex-shrink-0`}>
                  <p className="text-sm font-black">{s.day_of_week}</p>
                  {isToday && <p className="text-[8px] font-bold uppercase">Today</p>}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-navy text-sm">{DAY_FULL[s.day_of_week]}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Clock size={11} className="text-sub" />
                    <p className="text-xs text-sub">{s.start_time} – {s.end_time}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                  s.is_active ? 'bg-green-light text-green' : 'bg-gray-100 text-gray-500'
                }`}>
                  {s.is_active ? 'Active' : 'Paused'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Route info */}
      {driver?.route && (
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-border/50">
          <p className="text-xs font-bold text-sub uppercase tracking-wider mb-2">Assigned Route</p>
          <p className="text-sm font-bold text-navy">{driver.route}</p>
        </div>
      )}
    </div>
  )
}
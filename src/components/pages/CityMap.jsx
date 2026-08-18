// src/components/pages/CityMap.jsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase/client'
import CityMapView from '@/components/ui/CityMapView'
import Spinner from '@/components/ui/Spinner'

export default function CityMap() {
  const { profile } = useAuth()
  const [activeBooking, setActiveBooking] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    fetchActiveBooking()
  }, [profile?.id])

  async function fetchActiveBooking() {
    setLoading(true)
    const { data } = await supabase
      .from('bookings')
      .select('pickup, dropoff, status')
      .eq('customer_id', profile.id)
      .in('status', ['pending', 'ongoing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    setActiveBooking(data || null)
    setLoading(false)
  }

  return (
    <div className="page-enter px-4 py-4">
      <h2 className="font-black text-navy text-lg mb-1">Calbayog City Map</h2>
      <p className="text-sub text-xs mb-4">
        {activeBooking
          ? 'Your active ride is highlighted below.'
          : 'Browse pickup and dropoff points around the city.'}
      </p>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={32} /></div>
      ) : (
        <CityMapView highlightBooking={activeBooking} />
      )}
    </div>
  )
}
// src/components/ui/CityMapView.jsx
// Full, interactive map of Calbayog City — every known landmark plotted,
// plus (optionally) the current user's active ride highlighted on top.
//
// NOTE ON SCOPE: this shows landmarks and, if there's an active booking,
// its pickup/dropoff — it does NOT show live driver positions moving in
// real time. Nothing in this app currently reports a driver's actual GPS
// location (see RideMap.jsx / Phase 1 notes) — that's a separate, larger
// piece of work. This is the "see the whole map" layer on top of what
// already exists: landmarks + your own active ride.
import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LANDMARKS, CATEGORY_ICONS } from '@/lib/landmarks'
import { Locate, LayoutList } from 'lucide-react'

const CALBAYOG_CENTER = [12.0674, 124.5946]
const ALL_LANDMARK_BOUNDS = LANDMARKS.map(l => [l.lat, l.lng])

const landmarkDot = L.divIcon({
  className: 'city-landmark-pin',
  html: `<div style="width:9px;height:9px;border-radius:50%;background:#5F5E5A;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);"></div>`,
  iconSize: [9, 9],
  iconAnchor: [4, 4],
})

const ridePin = (color) => L.divIcon({
  className: 'city-ride-pin',
  html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
    <div style="background:${color};width:16px;height:16px;border-radius:50%;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.45);"></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
})

function FitWholeCity() {
  const map = useMap()
  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current) return
    map.fitBounds(ALL_LANDMARK_BOUNDS, { padding: [24, 24] })
    didFit.current = true
  }, [map])
  return null
}

function ViewToggle({ ridePoints }) {
  const map = useMap()
  if (ridePoints.length === 0) return null
  return (
    <div className="absolute bottom-3 right-3 z-[400] flex flex-col gap-2">
      <button
        type="button"
        onClick={() => map.fitBounds(ridePoints, { padding: [32, 32], maxZoom: 15 })}
        className="w-9 h-9 bg-white rounded-full shadow-md border border-border flex items-center justify-center active:scale-95"
        aria-label="Center on my ride"
        title="Center on my ride"
      >
        <Locate size={16} className="text-green" />
      </button>
      <button
        type="button"
        onClick={() => map.fitBounds(ALL_LANDMARK_BOUNDS, { padding: [24, 24] })}
        className="w-9 h-9 bg-white rounded-full shadow-md border border-border flex items-center justify-center active:scale-95"
        aria-label="View whole city"
        title="View whole city"
      >
        <LayoutList size={16} className="text-navy" />
      </button>
    </div>
  )
}

export default function CityMapView({ highlightBooking, height = '60vh' }) {
  const [showLandmarks, setShowLandmarks] = useState(true)

  const pickupMatch  = highlightBooking && LANDMARKS.find(l => l.name === highlightBooking.pickup)
  const dropoffMatch = highlightBooking && LANDMARKS.find(l => l.name === highlightBooking.dropoff)
  const ridePoints = [pickupMatch, dropoffMatch].filter(Boolean).map(l => [l.lat, l.lng])

  return (
    <div className="space-y-3">
      <div className="relative rounded-2xl overflow-hidden border border-border z-0" style={{ height }}>
        <MapContainer
          center={CALBAYOG_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitWholeCity />
          <ViewToggle ridePoints={ridePoints} />

          {showLandmarks && LANDMARKS.map(l => (
            <Marker key={l.id} position={[l.lat, l.lng]} icon={landmarkDot}>
              <Popup>
                <span style={{ fontWeight: 500 }}>{CATEGORY_ICONS[l.category]} {l.name}</span>
              </Popup>
            </Marker>
          ))}

          {ridePoints.length === 2 && (
            <Polyline positions={ridePoints} pathOptions={{ color: '#2E7D32', weight: 4, dashArray: '8 8' }} />
          )}
          {pickupMatch && (
            <Marker position={[pickupMatch.lat, pickupMatch.lng]} icon={ridePin('#2E7D32')}>
              <Popup>Pickup: {pickupMatch.name}</Popup>
            </Marker>
          )}
          {dropoffMatch && (
            <Marker position={[dropoffMatch.lat, dropoffMatch.lng]} icon={ridePin('#E64A19')}>
              <Popup>Dropoff: {dropoffMatch.name}</Popup>
            </Marker>
          )}
        </MapContainer>
      </div>

      <div className="flex items-center justify-between px-1">
        <label className="flex items-center gap-2 text-xs font-semibold text-sub">
          <input
            type="checkbox"
            checked={showLandmarks}
            onChange={e => setShowLandmarks(e.target.checked)}
            className="rounded accent-green"
          />
          Show landmarks
        </label>
        {highlightBooking && (
          <span className="text-xs font-bold text-green">
            {highlightBooking.pickup} → {highlightBooking.dropoff}
          </span>
        )}
      </div>
    </div>
  )
}
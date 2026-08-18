// src/components/ui/RideMap.jsx
// Interactive pickup → dropoff map for a single ride. Drag/zoom/pinch are
// enabled (this is the "whole map" people can explore, not just a fixed
// snapshot); mouse-wheel zoom stays off so it doesn't hijack page scroll
// when embedded inside a scrollable card list.
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import { LANDMARKS } from '@/lib/landmarks'
import { Locate } from 'lucide-react'

const CALBAYOG_CENTER = [12.0674, 124.5946]

const pin = (color) => L.divIcon({
  className: 'ridemap-pin',
  html: `<div style="display:flex;flex-direction:column;align-items:center;transform:translate(-50%,-100%);">
    <div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.4);"></div>
  </div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

const findCoords = (name) => {
  const match = LANDMARKS.find(l => l.name === name)
  return match ? [match.lat, match.lng] : null
}

// Fits the map view to whatever pins actually resolved, so pickup+dropoff
// are both visible regardless of how far apart they are. Only runs once
// on mount (via the ref guard) so it doesn't fight the user's own
// panning/zooming afterward.
function FitBounds({ points }) {
  const map = useMap()
  const didFit = useRef(false)
  useEffect(() => {
    if (didFit.current) return
    if (points.length === 2) {
      map.fitBounds(points, { padding: [32, 32], maxZoom: 15 })
      didFit.current = true
    } else if (points.length === 1) {
      map.setView(points[0], 14)
      didFit.current = true
    }
  }, [points, map])
  return null
}

function RecenterButton({ points }) {
  const map = useMap()
  if (points.length === 0) return null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        if (points.length === 2) map.fitBounds(points, { padding: [32, 32], maxZoom: 15 })
        else map.setView(points[0], 14)
      }}
      className="absolute bottom-2 right-2 z-[400] w-8 h-8 bg-white rounded-full shadow-md border border-border flex items-center justify-center active:scale-95"
      aria-label="Recenter on route"
    >
      <Locate size={15} className="text-navy" />
    </button>
  )
}

export default function RideMap({ pickup, dropoff, height = 160, className = '' }) {
  const pickupCoords  = findCoords(pickup)
  const dropoffCoords  = findCoords(dropoff)
  const points = [pickupCoords, dropoffCoords].filter(Boolean)

  // If neither landmark resolved (custom/unknown pickup text), don't
  // render a misleading map centered on nothing meaningful.
  if (points.length === 0) return null

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-border z-0 ${className}`}
      style={{ height }}
      onClick={(e) => e.stopPropagation()}
    >
      <MapContainer
        center={points[0] || CALBAYOG_CENTER}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        dragging={true}
        scrollWheelZoom={false}
        doubleClickZoom={true}
        touchZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        <RecenterButton points={points} />

        {points.length === 2 && (
          <Polyline positions={points} pathOptions={{ color: '#2E7D32', weight: 3, dashArray: '6 6' }} />
        )}

        {pickupCoords && (
          <Marker position={pickupCoords} icon={pin('#2E7D32')}>
            <Popup>Pickup: {pickup}</Popup>
          </Marker>
        )}
        {dropoffCoords && (
          <Marker position={dropoffCoords} icon={pin('#E64A19')}>
            <Popup>Dropoff: {dropoff}</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
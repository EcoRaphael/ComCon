// src/components/ui/RideMap.jsx
// Static pickup → dropoff map for a single ride. Not live-tracking —
// this shows fixed pins for the two landmarks, connected by a line.
// Looks up coordinates from landmarks.js by name, so it works with
// whatever pickup/dropoff strings a booking already has.
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import { useEffect } from 'react'
import 'leaflet/dist/leaflet.css'
import { LANDMARKS } from '@/lib/landmarks'

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
// are both visible regardless of how far apart they are.
function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (points.length === 2) {
      map.fitBounds(points, { padding: [32, 32], maxZoom: 15 })
    } else if (points.length === 1) {
      map.setView(points[0], 14)
    }
  }, [points, map])
  return null
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
    >
      <MapContainer
        center={points[0] || CALBAYOG_CENTER}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds points={points} />

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
// src/components/ui/RideMap.jsx
// Interactive map for a single ride. Two modes:
// - Default: static pickup → dropoff pins + route line (used for
//   historical/completed rides, and on the driver's side, where seeing
//   the commuter's pickup point and destination is what's actually
//   useful — a driver doesn't need to see their own live position on
//   their own map).
// - Live tracking (driverLivePosition prop): replaces the pickup/dropoff
//   view entirely with the driver's real-time moving position, for a
//   commuter's currently-active ride specifically. Only meaningful while
//   a ride is actually ongoing — a completed ride has no "live" position
//   to show anymore, which is why this is an opt-in prop rather than
//   always-on behavior.
//
// Drag/zoom/pinch are enabled (this is the "whole map" people can
// explore, not just a fixed snapshot); mouse-wheel zoom stays off so it
// doesn't hijack page scroll when embedded inside a scrollable card list.
import { MapContainer, TileLayer, LayersControl, Marker, Popup, Polyline, useMap } from 'react-leaflet'
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

// Pulsing ring (via the ridemap-pulse keyframe below) visually signals
// "this is live/moving," distinct from the static pickup/dropoff pins.
const liveDriverIcon = () => L.divIcon({
  className: 'ridemap-live-driver',
  html: `
    <div style="position:relative;width:22px;height:22px;">
      <div style="position:absolute;inset:0;background:#2E7D32;border-radius:50%;opacity:0.35;animation:ridemap-pulse 1.6s ease-out infinite;"></div>
      <div style="position:absolute;inset:5px;background:#2E7D32;border-radius:50%;border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.5);"></div>
    </div>
  `,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
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

export default function RideMap({ pickup, dropoff, driverLivePosition, height = 160, className = '' }) {
  const liveMode = !!driverLivePosition

  const pickupCoords  = findCoords(pickup)
  const dropoffCoords = findCoords(dropoff)
  const points = liveMode
    ? [[driverLivePosition.lat, driverLivePosition.lng]]
    : [pickupCoords, dropoffCoords].filter(Boolean)

  // If neither landmark resolved (custom/unknown pickup text) and we're
  // not in live mode either, don't render a misleading map centered on
  // nothing meaningful.
  if (points.length === 0) return null

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-border z-0 ${className}`}
      style={{ height }}
      onClick={(e) => e.stopPropagation()}
    >
      <style>{`
        @keyframes ridemap-pulse {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.4); opacity: 0; }
        }
      `}</style>
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
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Street">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        <FitBounds points={points} />
        <RecenterButton points={points} />

        {liveMode ? (
          <Marker position={points[0]} icon={liveDriverIcon()}>
            <Popup>Your driver is here</Popup>
          </Marker>
        ) : (
          <>
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
          </>
        )}
      </MapContainer>
    </div>
  )
}
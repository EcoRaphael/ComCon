// src/components/ui/CurrentLocationPicker.jsx
// "Use my current location" for choosing a pickup point:
//   1. get the device's GPS position (browser Geolocation API)
//   2. reverse-geocode it into a street address (Nominatim)
//   3. show it on the Leaflet map, with an accuracy circle and a pin the
//      person can drag if the GPS reading is a bit off
// then hand { address, lat, lng, accuracy } to onConfirm when they tap
// "Use this location".
//
// onConfirm(null) is also called whenever the pin moves or a new reading
// starts, so the parent never keeps a stale confirmed location while the
// map is showing a different spot.
import { useState, useEffect, useRef, useCallback } from 'react'
import { MapContainer, TileLayer, LayersControl, Marker, Circle, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { LocateFixed, RefreshCw, AlertTriangle, CheckCircle2, X } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import { getGpsPosition, reverseGeocode, isNearCalbayog, formatCoords } from '@/lib/currentLocation'

const pinIcon = L.divIcon({
  className: 'currentloc-pin',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2E7D32;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.5);cursor:grab"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

// Keeps the map centred on the pin after a refresh or a drag.
function FollowPin({ lat, lng }) {
  const map = useMap()
  useEffect(() => {
    map.setView([lat, lng], Math.max(map.getZoom(), 16))
  }, [lat, lng, map])
  return null
}

export default function CurrentLocationPicker({ onConfirm, onCancel }) {
  const [status, setStatus] = useState('locating')   // locating | geocoding | ready | error
  const [pos, setPos] = useState(null)               // { lat, lng, accuracy | null }
  const [address, setAddress] = useState('')
  const [lookupFailed, setLookupFailed] = useState(false)
  const [error, setError] = useState(null)           // { code, message }
  const [confirmed, setConfirmed] = useState(false)

  const runId = useRef(0)        // a newer request makes older results irrelevant
  const abortRef = useRef(null)

  const lookup = useCallback(async (p, id) => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setStatus('geocoding')
    try {
      const r = await reverseGeocode(p.lat, p.lng, { signal: ctrl.signal })
      if (id !== runId.current) return
      setAddress(r.address)
      setLookupFailed(false)
    } catch (e) {
      if (e?.name === 'AbortError' || id !== runId.current) return
      // The address lookup failed but the GPS point is still good — keep it usable.
      setAddress(`Pinned location (${formatCoords(p.lat, p.lng)})`)
      setLookupFailed(true)
    }
    if (id === runId.current) setStatus('ready')
  }, [])

  const locate = useCallback(async () => {
    const id = ++runId.current
    setConfirmed(false)
    onConfirm?.(null)
    setError(null)
    setStatus('locating')
    try {
      const p = await getGpsPosition()
      if (id !== runId.current) return
      setPos(p)
      await lookup(p, id)
    } catch (e) {
      if (id !== runId.current) return
      setError({ code: e?.code || 'unavailable', message: e?.message || 'Could not get your location.' })
      setStatus('error')
    }
  }, [lookup, onConfirm])

  // Start as soon as this opens — the person just chose "current location".
  useEffect(() => {
    locate()
    return () => { runId.current++; abortRef.current?.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleDragEnd = (e) => {
    const { lat, lng } = e.target.getLatLng()
    const id = ++runId.current
    setConfirmed(false)
    onConfirm?.(null)
    const p = { lat, lng, accuracy: null }   // placed by hand, so no GPS accuracy
    setPos(p)
    lookup(p, id)
  }

  const confirm = () => {
    setConfirmed(true)
    onConfirm?.({ address, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy })
  }

  const showMap = pos && (status === 'geocoding' || status === 'ready')
  const lowAccuracy = pos?.accuracy != null && pos.accuracy > 100
  const outside = pos && !isNearCalbayog(pos.lat, pos.lng)

  return (
    <div className="rounded-2xl border border-border bg-white overflow-hidden">
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-green-light">
        <span className="flex items-center gap-1.5 text-xs font-bold text-green">
          <LocateFixed size={14} /> Current location
        </span>
        <button type="button" onClick={onCancel}
          className="text-[11px] font-bold text-sub flex items-center gap-1">
          <X size={12} /> Choose a place instead
        </button>
      </div>

      {status === 'locating' && (
        <div className="px-4 py-6 flex flex-col items-center text-center gap-2.5">
          <Spinner size={22} />
          <p className="text-sm font-bold text-navy">Getting your GPS location…</p>
          <p className="text-xs text-sub">If your browser asks, choose <b>Allow</b> for location.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="px-4 py-5 space-y-3">
          <div className="flex gap-2.5 items-start">
            <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-navy leading-relaxed">{error?.message}</p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={locate}
              className="flex-1 py-2.5 rounded-xl bg-green text-white text-sm font-bold flex items-center justify-center gap-1.5">
              <RefreshCw size={14} /> Try again
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 py-2.5 rounded-xl border border-border text-sub text-sm font-bold">
              Choose a place
            </button>
          </div>
        </div>
      )}

      {showMap && (
        <>
          <div className="relative z-0 h-[190px]">
            <MapContainer
              center={[pos.lat, pos.lng]}
              zoom={17}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
              doubleClickZoom
              touchZoom
              dragging
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
                    attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  />
                </LayersControl.BaseLayer>
              </LayersControl>
              <FollowPin lat={pos.lat} lng={pos.lng} />
              {pos.accuracy != null && pos.accuracy < 5000 && (
                <Circle
                  center={[pos.lat, pos.lng]}
                  radius={pos.accuracy}
                  pathOptions={{ color: '#2E7D32', weight: 1, fillColor: '#2E7D32', fillOpacity: 0.12 }}
                />
              )}
              <Marker
                position={[pos.lat, pos.lng]}
                icon={pinIcon}
                draggable
                eventHandlers={{ dragend: handleDragEnd }}
              />
            </MapContainer>
          </div>

          <div className="px-4 py-3.5 space-y-2.5">
            <div>
              <p className="text-[10px] font-bold text-sub uppercase tracking-wider mb-0.5">Your location</p>
              {status === 'geocoding' ? (
                <p className="text-sm text-sub flex items-center gap-2"><Spinner size={14} /> Looking up the address…</p>
              ) : (
                <p className="text-sm font-bold text-navy leading-snug">{address}</p>
              )}
              <p className="text-[11px] text-sub mt-0.5">
                {pos.accuracy != null ? `GPS ±${pos.accuracy} m` : 'Pin moved by hand'} · {formatCoords(pos.lat, pos.lng)}
              </p>
            </div>

            {lowAccuracy && (
              <p className="text-[11px] bg-amber-50 text-amber-700 rounded-xl px-3 py-2 leading-relaxed">
                GPS accuracy is only about ±{pos.accuracy} m, so the pin may be off. Drag it to your exact spot.
              </p>
            )}
            {outside && (
              <p className="text-[11px] bg-amber-50 text-amber-700 rounded-xl px-3 py-2 leading-relaxed">
                This looks outside Calbayog City — rides only run within the city.
              </p>
            )}
            {lookupFailed && status === 'ready' && (
              <p className="text-[11px] bg-amber-50 text-amber-700 rounded-xl px-3 py-2 leading-relaxed">
                Couldn't look up the street name, but your exact GPS point will still be used.
              </p>
            )}
            {!confirmed && status === 'ready' && (
              <p className="text-[11px] text-sub">Not quite right? Drag the pin to adjust it.</p>
            )}
            {confirmed && (
              <p className="text-[11px] font-bold text-green flex items-center gap-1.5">
                <CheckCircle2 size={14} /> Selected as your pickup
              </p>
            )}

            <div className="flex gap-2 pt-0.5">
              <button type="button" onClick={confirm}
                disabled={status !== 'ready' || confirmed}
                className="flex-1 py-3 rounded-xl bg-green text-white text-sm font-bold disabled:opacity-50">
                {confirmed ? 'Selected' : 'Use this location'}
              </button>
              <button type="button" onClick={locate} aria-label="Get my location again"
                className="px-3.5 rounded-xl border border-border text-sub flex items-center justify-center">
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
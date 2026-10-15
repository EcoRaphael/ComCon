// src/lib/currentLocation.js
// "Use my current location": GPS coordinates -> street address.
//
// This app is a web app (React + Vite, installed as a PWA), so the GPS
// source is the browser's Geolocation API — the web counterpart of Expo's
// Location.getCurrentPositionAsync(), returning the same latitude /
// longitude / accuracy. The coordinates are then reverse-geocoded with
// Nominatim (OpenStreetMap's free geocoder — the same service
// NominatimAddressPicker already uses for address search) and shown on the
// Leaflet map the rest of the app uses.
//
// FAIR USE: Nominatim's public server allows ~1 request per second and is
// meant for light use. This makes one request per explicit user action
// (a tap, or finishing a pin drag) — never on a timer.

// Roughly Calbayog City and its surroundings. Used only to WARN, never to
// block: someone testing from elsewhere can still pick a pickup point.
const NEAR_CALBAYOG = { south: 11.85, north: 12.35, west: 124.25, east: 124.75 }

export function isNearCalbayog(lat, lng) {
  return lat >= NEAR_CALBAYOG.south && lat <= NEAR_CALBAYOG.north &&
         lng >= NEAR_CALBAYOG.west  && lng <= NEAR_CALBAYOG.east
}

export const formatCoords = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`

// Error with a stable .code the UI can branch on, plus a plain-language message.
function gpsError(code, message) {
  const e = new Error(message)
  e.code = code
  return e
}

const GEO_MESSAGES = {
  denied:
    'Location access is blocked for this site. Tap the lock icon next to the web address, ' +
    'set Location to Allow, then try again.',
  unavailable:
    "Couldn't determine your location. Make sure location services / GPS are turned on, then try again.",
  timeout:
    'Finding your location took too long. Move to an open area (or near a window) and try again.',
  unsupported: "This browser can't share your location. Try a different browser, or choose a place from the list.",
  insecure: 'Location only works on a secure (https) connection.',
}

// Resolves { lat, lng, accuracy } (accuracy in metres). Rejects with an
// Error whose .code is denied | unavailable | timeout | unsupported | insecure.
export function getGpsPosition({ timeout = 15000 } = {}) {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      return reject(gpsError('insecure', GEO_MESSAGES.insecure))
    }
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      return reject(gpsError('unsupported', GEO_MESSAGES.unsupported))
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: Math.round(pos.coords.accuracy),
      }),
      (err) => {
        // GeolocationPositionError: 1 = denied, 2 = unavailable, 3 = timeout
        const code = err?.code === 1 ? 'denied' : err?.code === 3 ? 'timeout' : 'unavailable'
        reject(gpsError(code, GEO_MESSAGES[code]))
      },
      // maximumAge 0: always a fresh reading, never a cached old position.
      { enableHighAccuracy: true, timeout, maximumAge: 0 },
    )
  })
}

// Turns a Nominatim reverse-geocode result into a short, readable address:
//   "Nijaga Park, Rizal Street, Barangay 4, Calbayog"
// Order: place name (if it's a named place), street, barangay/area, city.
export function formatAddress(result) {
  const a = result?.address || {}

  const street = [a.house_number, a.road || a.pedestrian || a.footway || a.path]
    .filter(Boolean).join(' ')
  const area = a.suburb || a.neighbourhood || a.quarter || a.village || a.hamlet || a.city_district || ''
  const city = a.city || a.town || a.municipality || ''
  // Nominatim's `name` is the nearest named feature (a park, school, shop…).
  const place = result?.name && result.name !== street && result.name !== area && result.name !== city
    ? result.name : ''

  const seen = new Set()
  const parts = [place, street, area, city].filter(p => {
    if (!p) return false
    const k = p.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })

  if (parts.length > 0) return parts.join(', ')

  // Nothing structured came back: fall back to the first few pieces of the
  // long display_name rather than showing nothing.
  const fallback = (result?.display_name || '').split(',').slice(0, 3).map(s => s.trim()).filter(Boolean)
  return fallback.join(', ')
}

// Reverse geocode: coordinates -> { address, raw }. Throws if the request
// fails or Nominatim has no result (callers should still let the person use
// the raw GPS point — see CurrentLocationPicker).
export async function reverseGeocode(lat, lng, { signal } = {}) {
  const url =
    'https://nominatim.openstreetmap.org/reverse' +
    `?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
  const res = await fetch(url, { signal, headers: { 'Accept-Language': 'en' } })
  if (!res.ok) throw new Error(`Address lookup failed (${res.status})`)
  const data = await res.json()
  if (data?.error) throw new Error(data.error)
  const address = formatAddress(data)
  if (!address) throw new Error('No address found for this spot')
  return { address, raw: data }
}
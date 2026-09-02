// src/components/ui/NominatimAddressPicker.jsx
// Live address search using Nominatim — OpenStreetMap's free geocoding
// API. No API key, no billing account, no Google Cloud setup: this pairs
// naturally with the rest of the app, since RideMap.jsx and
// CityMapView.jsx already render OSM tiles via Leaflet. Returns
// { address, lat, lng }.
//
// This is a normal, nested dropdown (position: absolute, anchored to its
// own wrapper) — not a portaled overlay. It scrolls naturally with the
// registration form's content, same as a plain <select> would, rather
// than floating independently at fixed viewport coordinates.
//
// FAIR USE NOTE: Nominatim's public instance (nominatim.openstreetmap.org)
// is free but rate-limited and intended for light use — its usage policy
// asks for a maximum of 1 request/second and discourages heavy
// autocomplete-per-keystroke traffic from client-side apps in production.
// This is debounced (450ms) and cancels in-flight requests to stay well
// under that, which is fine for an app at this project's current scale.
// If usage grows significantly, the responsible next step is routing
// these requests through your own backend (a simple proxy/cache), rather
// than calling the public instance directly from every user's browser —
// worth revisiting before any large-scale beneficiary rollout.
import { useState, useRef, useEffect } from 'react'
import { MapPin, Search, X, Loader2 } from 'lucide-react'

// Calbayog City bounding box — biases results, doesn't hard-restrict.
const VIEWBOX = '124.50,12.15,124.65,12.00' // west,north,east,south

export default function NominatimAddressPicker({ value, onChange, placeholder = 'Search your address...', disabled }) {
  const [query, setQuery] = useState(value?.address || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const wrapRef = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    setQuery(value?.address || '')
  }, [value?.address])

  const runSearch = (text) => {
    clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    if (!text.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const controller = new AbortController()
      abortRef.current = controller
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=ph&viewbox=${VIEWBOX}&bounded=0&q=${encodeURIComponent(text)}`
        const res = await fetch(url, { signal: controller.signal, headers: { 'Accept-Language': 'en' } })
        const data = await res.json()
        setResults(data || [])
      } catch (err) {
        if (err.name !== 'AbortError') setResults([])
      } finally {
        setLoading(false)
      }
    }, 450)
  }

  const handleInputChange = (e) => {
    const text = e.target.value
    setQuery(text)
    setOpen(true)
    runSearch(text)
  }

  const handleFocus = () => {
    if (disabled) return
    setOpen(true)
    if (query.trim()) runSearch(query)
  }

  const handleSelect = (result) => {
    onChange({
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    })
    setQuery(result.display_name)
    setResults([])
    setOpen(false)
  }

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [open])

  return (
    <div className="relative mt-1.5" ref={wrapRef}>
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
        <input
          value={query}
          onChange={handleInputChange}
          onFocus={handleFocus}
          disabled={disabled}
          placeholder={placeholder}
          className="w-full h-11 pl-10 pr-9 bg-surface border-2 border-transparent rounded-2xl outline-none text-sm font-medium text-navy disabled:opacity-60"
        />
        {loading && <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-sub animate-spin" />}
        {!loading && query && (
          <button
            type="button"
            onClick={() => { setQuery(''); onChange({ address: '', lat: null, lng: null }); setResults([]) }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-sub"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-30 mt-1.5 w-full bg-white rounded-2xl shadow-xl border border-border max-h-72 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-xs text-sub text-center py-5 px-3">
              {loading ? 'Searching...' : query.trim() ? 'No matches — try a different search.' : 'Start typing a barangay, street, or landmark...'}
            </p>
          ) : (
            results.map((r) => (
              <button
                key={r.place_id}
                type="button"
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-2.5 hover:bg-surface flex items-start gap-2 transition-colors border-b border-border last:border-0"
              >
                <MapPin size={13} className="text-sub flex-shrink-0 mt-0.5" />
                <span className="text-sm text-navy leading-snug">{r.display_name}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
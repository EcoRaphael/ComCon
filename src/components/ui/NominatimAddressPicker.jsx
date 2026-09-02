// src/components/ui/NominatimAddressPicker.jsx
// Live address search using Nominatim — OpenStreetMap's free geocoding
// API. No API key, no billing account, no Google Cloud setup: this pairs
// naturally with the rest of the app, since RideMap.jsx and
// CityMapView.jsx already render OSM tiles via Leaflet. Returns the same
// { address, lat, lng } shape GoogleAddressPicker did, so it's a drop-in
// swap — no changes needed to how the registration forms consume it.
//
// The dropdown is portaled into document.body with its position computed
// from the trigger's bounding rect — same fix as AddressPicker.jsx and
// the admin panel's Modal component elsewhere in this project. The
// driver registration form lives inside a scrollable container
// (max-h-[65vh] overflow-y-auto), and a normally-nested absolute dropdown
// would get clipped by that boundary once results extend below the fold.
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
import { createPortal } from 'react-dom'
import { MapPin, Search, X, Loader2 } from 'lucide-react'

// Calbayog City bounding box — biases results, doesn't hard-restrict.
const VIEWBOX = '124.50,12.15,124.65,12.00' // west,north,east,south

export default function NominatimAddressPicker({ value, onChange, placeholder = 'Search your address...', disabled }) {
  const [query, setQuery] = useState(value?.address || '')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)

  const triggerRef = useRef(null)
  const panelRef = useRef(null)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    setQuery(value?.address || '')
  }, [value?.address])

  const positionPanel = () => {
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }

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
    if (!open) { positionPanel(); setOpen(true) }
    runSearch(text)
  }

  const handleFocus = () => {
    if (disabled) return
    positionPanel()
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
      if (
        triggerRef.current && !triggerRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) setOpen(false)
    }
    function handleScrollOrResize() { setOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
      clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [open])

  return (
    <>
      <div className="relative mt-1.5">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-sub pointer-events-none" />
        <input
          ref={triggerRef}
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

      {open && coords && createPortal(
        <div
          ref={panelRef}
          className="fixed z-[80] bg-white rounded-2xl shadow-xl border border-border max-h-72 overflow-y-auto"
          style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
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
        </div>,
        document.body
      )}
    </>
  )
}
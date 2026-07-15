// src/components/ui/LocationPicker.jsx
// Searchable landmark picker for Calbayog City pickup/dropoff selection
import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, X, ChevronDown } from 'lucide-react'
import { LANDMARKS, CATEGORIES, CATEGORY_ICONS } from '@/lib/landmarks'

export default function LocationPicker({ value, onChange, placeholder = 'Select location', label }) {
  const [open,     setOpen]     = useState(false)
  const [search,   setSearch]   = useState('')
  const [category, setCategory] = useState('All')
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  const filtered = LANDMARKS.filter(l => {
    const matchCat    = category === 'All' || l.category === category
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const selected = LANDMARKS.find(l => l.name === value)

  const handleSelect = (landmark) => {
    onChange(landmark.name)
    setOpen(false)
    setSearch('')
    setCategory('All')
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange('')
  }

  return (
    <div ref={containerRef} className="relative">
      {label && <label className="field-label">{label}</label>}

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full h-12 px-4 bg-surface border rounded-xl text-sm text-left flex items-center gap-2 transition-colors
          ${open ? 'border-green ring-2 ring-green/10' : 'border-border hover:border-green/40'}
          ${value ? 'text-navy' : 'text-sub'}`}
      >
        <MapPin size={15} className={value ? 'text-green flex-shrink-0' : 'text-sub flex-shrink-0'} />
        <span className="flex-1 truncate">{value || placeholder}</span>
        {value
          ? <button type="button" onClick={handleClear} className="text-sub hover:text-navy p-0.5">
              <X size={14} />
            </button>
          : <ChevronDown size={14} className={`text-sub transition-transform ${open ? 'rotate-180' : ''}`} />
        }
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl border border-border shadow-xl z-50 overflow-hidden">

          {/* Search */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sub" />
              <input
                ref={inputRef}
                className="w-full h-9 pl-9 pr-3 bg-surface rounded-xl text-sm text-navy outline-none border border-transparent focus:border-green transition-colors"
                placeholder="Search location..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Category filter */}
          <div className="flex gap-1.5 px-3 py-2 overflow-x-auto scrollbar-none border-b border-border">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold transition-all
                  ${category === cat ? 'bg-green text-white' : 'bg-surface text-sub hover:text-navy'}`}
              >
                <span>{CATEGORY_ICONS[cat]}</span>
                {cat}
              </button>
            ))}
          </div>

          {/* Location list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sub text-sm">
                <MapPin size={24} className="mx-auto opacity-20 mb-2" />
                No locations found
              </div>
            ) : (
              filtered.map(landmark => (
                <button
                  key={landmark.id}
                  type="button"
                  onClick={() => handleSelect(landmark)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-green-light transition-colors
                    ${value === landmark.name ? 'bg-green-light' : ''}`}
                >
                  <span className="text-base flex-shrink-0">{CATEGORY_ICONS[landmark.category]}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${value === landmark.name ? 'text-green' : 'text-navy'}`}>
                      {landmark.name}
                    </p>
                    <p className="text-[10px] text-sub">{landmark.category}</p>
                  </div>
                  {value === landmark.name && (
                    <div className="w-4 h-4 rounded-full bg-green flex items-center justify-center flex-shrink-0">
                      <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                        <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
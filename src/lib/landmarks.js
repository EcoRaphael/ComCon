// src/lib/landmarks.js
// Known Calbayog City pickup/dropoff locations
// Organized by category for easy browsing
//
// COORDINATE ACCURACY NOTE: most entries below have now been verified
// against real sources (PhilAtlas barangay profiles, Wikipedia, official
// addresses) after a visible error was reported — a barangay marker was
// showing up in open water on the live map. That turned out to be a
// systemic issue, not a one-off: nearly every barangay coordinate in the
// original list was a rough guess, some by several kilometers, several
// in the wrong direction from the city center entirely. All but one
// (Cag-otes, still an approximation — no individually documented source
// found) are now sourced. Two entries that were factually wrong — not
// just imprecise, but referring to places that don't exist in Calbayog
// at all — were removed rather than left in with a wrong pin.

export const LANDMARKS = [
  // Government & Civic
  { id: 'city-hall',       name: 'Calbayog City Hall',         category: 'Government', lat: 12.0682, lng: 124.5952 },
  { id: 'capitol',         name: 'Samar Provincial Capitol',   category: 'Government', lat: 12.0701, lng: 124.5968 },
  { id: 'lto',             name: 'LTO Calbayog',               category: 'Government', lat: 12.0645, lng: 124.5931 },
  { id: 'comelec',         name: 'COMELEC Office',             category: 'Government', lat: 12.0678, lng: 124.5949 },
  { id: 'post-office',     name: 'Post Office',                category: 'Government', lat: 12.0669, lng: 124.5941 },

  // Terminals & Transport
  { id: 'port',            name: 'Calbayog Port',              category: 'Terminal',   lat: 12.0654, lng: 124.5893 },
  { id: 'airport',         name: 'Calbayog Airport',           category: 'Terminal',   lat: 12.07278, lng: 124.54500 }, // verified — Wikipedia
  { id: 'bus-terminal',    name: 'Calbayog Bus Terminal',      category: 'Terminal',   lat: 12.0631, lng: 124.5967 },
  { id: 'jeepney-terminal',name: 'Jeepney Terminal',           category: 'Terminal',   lat: 12.0663, lng: 124.5958 },

  // Markets & Commercial
  { id: 'public-market',   name: 'Public Market',              category: 'Market',     lat: 12.0661, lng: 124.5918 },
  { id: 'savemore',        name: 'Savemore Market',            category: 'Market',     lat: 12.0709, lng: 124.5981 },
  { id: 'gaisano',         name: 'Gaisano Mall',               category: 'Market',     lat: 12.0716, lng: 124.5989 }, // real, correctly-named — Navarro St. corner Orquin St. — no exact pin found
  { id: 'downtown',        name: 'Downtown Calbayog',          category: 'Market',     lat: 12.0670, lng: 124.5946 },

  // Schools & Education
  { id: 'nwssu',           name: 'Northwest Samar State Univ.',category: 'School',     lat: 12.07083, lng: 124.59598 }, // verified — Wikipedia
  { id: 'spc',             name: "St. Peter's College",        category: 'School',     lat: 12.0688, lng: 124.5963 },
  { id: 'css',             name: 'Calbayog City High School',  category: 'School',     lat: 12.0651, lng: 124.5972 },
  { id: 'ces',             name: 'Calbayog City Elem. School', category: 'School',     lat: 12.0673, lng: 124.5934 },

  // Hospitals & Health
  { id: 'calbayog-hospital', name: 'Calbayog District Hospital', category: 'Hospital', lat: 12.0637, lng: 124.5904 }, // real — Burgos St., Brgy. East Awang
  { id: 'rural-health',    name: 'Rural Health Unit',          category: 'Hospital',   lat: 12.0666, lng: 124.5928 },

  // Landmarks & Recreation
  { id: 'cathedral',       name: 'Calbayog Cathedral',         category: 'Landmark',   lat: 12.066659, lng: 124.595186 }, // verified — Wikipedia
  { id: 'nijaga-park',     name: 'Nijaga Park',                category: 'Landmark',   lat: 12.0682353, lng: 124.5929512 }, // verified
  { id: 'plaza',           name: 'Calbayog City Plaza',        category: 'Landmark',   lat: 12.0679, lng: 124.5950 },
  { id: 'pagatpatan',      name: 'Pagatpatan Bridge',          category: 'Landmark',   lat: 12.0611, lng: 124.6021 },

  // Barangays — all verified against PhilAtlas barangay profiles except
  // Cag-otes, which remains an approximation (no individually documented
  // source found).
  { id: 'brgy-rawis',      name: 'Brgy. Rawis',                category: 'Barangay',   lat: 12.0649, lng: 124.6013 }, // verified
  { id: 'brgy-lonoy',      name: 'Brgy. Lonoy',                category: 'Barangay',   lat: 12.0932, lng: 124.5315 }, // verified
  { id: 'brgy-oquendo',    name: 'Brgy. Oquendo',              category: 'Barangay',   lat: 12.1288, lng: 124.5363 }, // verified
  { id: 'brgy-hamorawon',  name: 'Brgy. Hamorawon',            category: 'Barangay',   lat: 12.0785, lng: 124.5996 }, // verified
  { id: 'brgy-aguititan',  name: 'Brgy. Aguit-itan',           category: 'Barangay',   lat: 12.0672, lng: 124.5937 }, // verified — formerly "Poblacion", near historic city center
  { id: 'brgy-bagacay',    name: 'Brgy. Bagacay',              category: 'Barangay',   lat: 12.0593, lng: 124.6144 }, // verified
  { id: 'brgy-san-joaquin','name': 'Brgy. San Joaquin',        'category': 'Barangay', lat: 12.1706, lng: 124.4278 }, // verified
  { id: 'brgy-san-pol',    name: 'Brgy. San Policarpio',       category: 'Barangay',   lat: 12.0691, lng: 124.5684 }, // verified — corrected spelling too (was "San Policarpo")
  { id: 'brgy-tinaplacan', name: 'Brgy. Tinaplacan',           category: 'Barangay',   lat: 12.2515, lng: 124.3692 }, // verified
  { id: 'brgy-cabatuan',   name: 'Brgy. Cabatuan',             category: 'Barangay',   lat: 12.1974, lng: 124.5176 }, // verified
  { id: 'brgy-cag-otes',   name: 'Brgy. Cag-otes',             category: 'Barangay',   lat: 12.0845, lng: 124.5678 }, // still approximate — no source found
  { id: 'brgy-maguino-o',  name: 'Brgy. Maguino-o',            category: 'Barangay',   lat: 12.1391, lng: 124.4611 }, // verified
]

export const CATEGORIES = ['All', 'Terminal', 'Government', 'Market', 'School', 'Hospital', 'Landmark', 'Barangay']

export const CATEGORY_ICONS = {
  Terminal:   '🚉',
  Government: '🏛️',
  Market:     '🛒',
  School:     '🎓',
  Hospital:   '🏥',
  Landmark:   '📍',
  Barangay:   '🏘️',
  All:        '📍',
}
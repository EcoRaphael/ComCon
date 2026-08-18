// src/lib/landmarks.js
// Known Calbayog City pickup/dropoff locations
// Organized by category for easy browsing
//
// COORDINATE ACCURACY NOTE: lat/lng below are approximate placements
// around Calbayog City's real center (12.0674, 124.5946) and a few
// confirmed anchor points (e.g. the airport), positioned according to
// real Calbayog geography (coastal city, port to the west, downtown
// clustered centrally, barangays spread outward). They are good enough
// for a functional map, but not surveyed/geocoded per-landmark — swap in
// precise coordinates later if this needs to be production-accurate.

export const LANDMARKS = [
  // Government & Civic
  { id: 'city-hall',       name: 'Calbayog City Hall',         category: 'Government', lat: 12.0682, lng: 124.5952 },
  { id: 'capitol',         name: 'Samar Provincial Capitol',   category: 'Government', lat: 12.0701, lng: 124.5968 },
  { id: 'lto',             name: 'LTO Calbayog',               category: 'Government', lat: 12.0645, lng: 124.5931 },
  { id: 'comelec',         name: 'COMELEC Office',             category: 'Government', lat: 12.0678, lng: 124.5949 },
  { id: 'post-office',     name: 'Post Office',                category: 'Government', lat: 12.0669, lng: 124.5941 },

  // Terminals & Transport
  { id: 'port',            name: 'Calbayog Port',              category: 'Terminal',   lat: 12.0654, lng: 124.5893 },
  { id: 'airport',         name: 'Calbayog Airport',           category: 'Terminal',   lat: 12.07278, lng: 124.54500 },
  { id: 'bus-terminal',    name: 'Calbayog Bus Terminal',      category: 'Terminal',   lat: 12.0631, lng: 124.5967 },
  { id: 'jeepney-terminal',name: 'Jeepney Terminal',           category: 'Terminal',   lat: 12.0663, lng: 124.5958 },

  // Markets & Commercial
  { id: 'public-market',   name: 'Public Market',              category: 'Market',     lat: 12.0661, lng: 124.5918 },
  { id: 'savemore',        name: 'Savemore Market',            category: 'Market',     lat: 12.0709, lng: 124.5981 },
  { id: 'gaisano',         name: 'Gaisano Mall',               category: 'Market',     lat: 12.0716, lng: 124.5989 },
  { id: 'downtown',        name: 'Downtown Calbayog',          category: 'Market',     lat: 12.0670, lng: 124.5946 },

  // Schools & Education
  { id: 'wsu',             name: 'Western Samar State Univ.',  category: 'School',     lat: 12.0598, lng: 124.5889 },
  { id: 'nwssu',           name: 'Northwest Samar State Univ.',category: 'School',     lat: 12.0742, lng: 124.6012 },
  { id: 'spc',             name: 'St. Peter\'s College',       category: 'School',     lat: 12.0688, lng: 124.5963 },
  { id: 'css',             name: 'Calbayog City High School',  category: 'School',     lat: 12.0651, lng: 124.5972 },
  { id: 'ces',             name: 'Calbayog City Elem. School', category: 'School',     lat: 12.0673, lng: 124.5934 },

  // Hospitals & Health
  { id: 'samar-hospital',  name: 'Samar Provincial Hospital',  category: 'Hospital',   lat: 12.0724, lng: 124.5995 },
  { id: 'calbayog-hospital','name': 'Calbayog District Hospital','category': 'Hospital', lat: 12.0637, lng: 124.5904 },
  { id: 'rural-health',    name: 'Rural Health Unit',          category: 'Hospital',   lat: 12.0666, lng: 124.5928 },

  // Landmarks & Recreation
  { id: 'cathedral',       name: 'Calbayog Cathedral',         category: 'Landmark',   lat: 12.0676, lng: 124.5943 },
  { id: 'nijaga-park',     name: 'Nijaga Park',                category: 'Landmark',   lat: 12.0685, lng: 124.5957 },
  { id: 'plaza',           name: 'Calbayog City Plaza',        category: 'Landmark',   lat: 12.0679, lng: 124.5950 },
  { id: 'pagatpatan',      name: 'Pagatpatan Bridge',          category: 'Landmark',   lat: 12.0611, lng: 124.6021 },

  // Barangays
  { id: 'brgy-rawis',      name: 'Brgy. Rawis',                category: 'Barangay',   lat: 12.0812, lng: 124.5901 },
  { id: 'brgy-lonoy',      name: 'Brgy. Lonoy',                category: 'Barangay',   lat: 12.0521, lng: 124.5847 },
  { id: 'brgy-oquendo',    name: 'Brgy. Oquendo',              category: 'Barangay',   lat: 12.0453, lng: 124.5779 },
  { id: 'brgy-hamorawon',  name: 'Brgy. Hamorawon',            category: 'Barangay',   lat: 12.0567, lng: 124.6087 },
  { id: 'brgy-aguititan',  name: 'Brgy. Aguit-itan',           category: 'Barangay',   lat: 12.0398, lng: 124.5698 },
  { id: 'brgy-bagacay',    name: 'Brgy. Bagacay',              category: 'Barangay',   lat: 12.0892, lng: 124.6034 },
  { id: 'brgy-san-joaquin','name': 'Brgy. San Joaquin',        'category': 'Barangay', lat: 12.0759, lng: 124.6098 },
  { id: 'brgy-san-pol',    name: 'Brgy. San Policarpo',        category: 'Barangay',   lat: 12.0489, lng: 124.6156 },
  { id: 'brgy-tinaplacan', name: 'Brgy. Tinaplacan',           category: 'Barangay',   lat: 12.0934, lng: 124.5765 },
  { id: 'brgy-cabatuan',   name: 'Brgy. Cabatuan',             category: 'Barangay',   lat: 12.0287, lng: 124.5934 },
  { id: 'brgy-cag-otes',   name: 'Brgy. Cag-otes',             category: 'Barangay',   lat: 12.0845, lng: 124.5678 },
  { id: 'brgy-maguino-o',  name: 'Brgy. Maguino-o',            category: 'Barangay',   lat: 12.0212, lng: 124.6045 },
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
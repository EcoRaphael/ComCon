// src/lib/landmarks.js
// Known Calbayog City pickup/dropoff locations
// Organized by category for easy browsing

export const LANDMARKS = [
  // Government & Civic
  { id: 'city-hall',       name: 'Calbayog City Hall',         category: 'Government'  },
  { id: 'capitol',         name: 'Samar Provincial Capitol',   category: 'Government'  },
  { id: 'lto',             name: 'LTO Calbayog',               category: 'Government'  },
  { id: 'comelec',         name: 'COMELEC Office',             category: 'Government'  },
  { id: 'post-office',     name: 'Post Office',                category: 'Government'  },

  // Terminals & Transport
  { id: 'port',            name: 'Calbayog Port',              category: 'Terminal'    },
  { id: 'airport',         name: 'Calbayog Airport',           category: 'Terminal'    },
  { id: 'bus-terminal',    name: 'Calbayog Bus Terminal',      category: 'Terminal'    },
  { id: 'jeepney-terminal',name: 'Jeepney Terminal',           category: 'Terminal'    },

  // Markets & Commercial
  { id: 'public-market',   name: 'Public Market',              category: 'Market'      },
  { id: 'savemore',        name: 'Savemore Market',            category: 'Market'      },
  { id: 'gaisano',         name: 'Gaisano Mall',               category: 'Market'      },
  { id: 'downtown',        name: 'Downtown Calbayog',          category: 'Market'      },

  // Schools & Education
  { id: 'wsu',             name: 'Western Samar State Univ.',  category: 'School'      },
  { id: 'nwssu',           name: 'Northwest Samar State Univ.',category: 'School'      },
  { id: 'spc',             name: 'St. Peter\'s College',       category: 'School'      },
  { id: 'css',             name: 'Calbayog City High School',  category: 'School'      },
  { id: 'ces',             name: 'Calbayog City Elem. School', category: 'School'      },

  // Hospitals & Health
  { id: 'samar-hospital',  name: 'Samar Provincial Hospital',  category: 'Hospital'    },
  { id: 'calbayog-hospital','name': 'Calbayog District Hospital','category': 'Hospital'},
  { id: 'rural-health',    name: 'Rural Health Unit',          category: 'Hospital'    },

  // Landmarks & Recreation
  { id: 'cathedral',       name: 'Calbayog Cathedral',         category: 'Landmark'    },
  { id: 'nijaga-park',     name: 'Nijaga Park',                category: 'Landmark'    },
  { id: 'plaza',           name: 'Calbayog City Plaza',        category: 'Landmark'    },
  { id: 'pagatpatan',      name: 'Pagatpatan Bridge',          category: 'Landmark'    },

  // Barangays
  { id: 'brgy-rawis',      name: 'Brgy. Rawis',                category: 'Barangay'    },
  { id: 'brgy-lonoy',      name: 'Brgy. Lonoy',                category: 'Barangay'    },
  { id: 'brgy-oquendo',    name: 'Brgy. Oquendo',              category: 'Barangay'    },
  { id: 'brgy-hamorawon',  name: 'Brgy. Hamorawon',            category: 'Barangay'    },
  { id: 'brgy-aguititan',  name: 'Brgy. Aguit-itan',           category: 'Barangay'    },
  { id: 'brgy-bagacay',    name: 'Brgy. Bagacay',              category: 'Barangay'    },
  { id: 'brgy-san-joaquin','name': 'Brgy. San Joaquin',        'category': 'Barangay'  },
  { id: 'brgy-san-pol',    name: 'Brgy. San Policarpo',        category: 'Barangay'    },
  { id: 'brgy-tinaplacan', name: 'Brgy. Tinaplacan',           category: 'Barangay'    },
  { id: 'brgy-cabatuan',   name: 'Brgy. Cabatuan',             category: 'Barangay'    },
  { id: 'brgy-cag-otes',   name: 'Brgy. Cag-otes',             category: 'Barangay'    },
  { id: 'brgy-maguino-o',  name: 'Brgy. Maguino-o',            category: 'Barangay'    },
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
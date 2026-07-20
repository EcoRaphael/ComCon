// src/components/layout/AppLayout.jsx
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Home, Search, Clock, User, Navigation, ChevronRight } from 'lucide-react'
import NotificationBell from '@/components/ui/NotificationBell'

const NAV = [
  { icon: Home,   label: 'Home',     path: '/'          },
  { icon: Search, label: 'Routes',   path: '/routes'    },
  { icon: Clock,  label: 'My Rides', path: '/my-rides'  },
  { icon: User,   label: 'Profile',  path: '/profile'   },
]

// Show floating button only on Home page
const SHOW_FLOAT_ON = ['/']

export default function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const showFloat = SHOW_FLOAT_ON.includes(location.pathname)

  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto relative shadow-2xl">

      <NotificationBell />

      {/* Page content */}
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      {/* Floating "Where are you going?" button — fixed above bottom nav, only on Home */}
      {showFloat && (
        <button
          onClick={() => navigate('/routes')}
          className="fixed bottom-[82px] left-1/2 -translate-x-1/2 z-40
                     flex items-center gap-3 bg-green text-white
                     pl-2 pr-4 py-2 rounded-full
                     shadow-[0_8px_30px_rgba(46,125,50,0.5)]
                     active:scale-95 transition-all hover:bg-green-dark"
          style={{ width: 'min(320px, calc(100vw - 40px))' }}
        >
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Navigation size={18} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm font-black leading-tight">Where are you going?</p>
            <p className="text-[10px] text-white/70">Browse routes in Calbayog</p>
          </div>
          <ChevronRight size={18} className="text-white/60 flex-shrink-0" />
        </button>
      )}

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-30">
        <div className="flex px-2">
          {NAV.map(({ icon: Icon, label, path }) => (
            <NavLink key={path} to={path} end={path === '/'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-all relative ${
                  isActive ? 'text-green' : 'text-sub'
                }`
              }>
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green rounded-full" />
                  )}
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-green-light' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-green' : 'text-sub'}`}>
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
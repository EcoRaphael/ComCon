// src/components/driver/DriverLayout.jsx
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Ticket, Calendar, User } from 'lucide-react'
import NotificationBell from '@/components/ui/NotificationBell'

const NAV = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/driver'          },
  { icon: Ticket,          label: 'Bookings',  path: '/driver/bookings' },
  { icon: Calendar,        label: 'Schedule',  path: '/driver/schedule' },
  { icon: User,            label: 'Profile',   path: '/driver/profile'  },
]

export default function DriverLayout({ children }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col max-w-md mx-auto relative shadow-2xl">

      <NotificationBell />
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border z-30">
        <div className="flex px-2">
          {NAV.map(({ icon: Icon, label, path }) => (
            <NavLink key={path} to={path} end={path === '/driver'}
              className={({ isActive }) =>
                `flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-all relative ${
                  isActive ? 'text-green' : 'text-sub'
                }`}>
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green rounded-full" />}
                  <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-green-light' : ''}`}>
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                  </div>
                  <span className={`text-[10px] font-bold ${isActive ? 'text-green' : 'text-sub'}`}>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
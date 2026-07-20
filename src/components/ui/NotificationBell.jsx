// src/components/ui/NotificationBell.jsx
// Floating notification bell — shows unread broadcasts/alerts sent
// from the admin panel. Works for both commuter and driver accounts
// since it just reads notifications where user_id = the logged-in user.
import { useState, useEffect, useRef } from 'react'
import { Bell, X, Clock, CheckCheck, ShieldAlert, Megaphone } from 'lucide-react'
import { useAuth } from '@/lib/AuthContext'
import { supabase } from '@/lib/supabase/client'

const TYPE_ICONS = {
  booking: <Clock size={15} />,
  payment: <CheckCheck size={15} />,
  report:  <ShieldAlert size={15} />,
  system:  <Bell size={15} />,
  alert:   <Megaphone size={15} />,
}
const TYPE_COLORS = {
  booking: 'bg-emerald-50 text-emerald-700',
  payment: 'bg-blue-50 text-blue-700',
  report:  'bg-red-50 text-red-700',
  system:  'bg-slate-100 text-slate-600',
  alert:   'bg-amber-50 text-amber-700',
}

export default function NotificationBell() {
  const { profile } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const panelRef = useRef(null)

  const unreadCount = items.filter(n => !n.is_read).length

  useEffect(() => {
    if (!profile?.id) return
    fetchNotifications()

    const channel = supabase
      .channel(`notif-${profile.id}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => setItems(prev => [payload.new, ...prev].slice(0, 50))
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile?.id])

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function fetchNotifications() {
    setLoading(true)
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(50)
    if (!error) setItems(data || [])
    setLoading(false)
  }

  async function markAsRead(id) {
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  async function markAllRead() {
    const unreadIds = items.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return
    setItems(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  if (!profile?.id) return null

  return (
    <div className="fixed top-4 right-4 z-50" ref={panelRef}>
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-11 h-11 bg-white rounded-full shadow-lg border border-border flex items-center justify-center active:scale-95 transition-transform"
        aria-label="Notifications"
      >
        <Bell size={19} className="text-navy" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-cta text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-14 right-0 w-[320px] max-h-[70vh] bg-white rounded-2xl shadow-2xl border border-border overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="font-black text-navy text-sm">Notifications</p>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] font-bold text-green hover:underline">
                  Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-sub hover:text-navy">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-6 text-center text-sub text-sm">Loading...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center">
                <Bell size={28} className="text-border mx-auto mb-2" />
                <p className="text-sub text-sm">No notifications yet</p>
              </div>
            ) : (
              items.map(n => (
                <button
                  key={n.id}
                  onClick={() => !n.is_read && markAsRead(n.id)}
                  className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-surface transition-colors flex gap-3 ${!n.is_read ? 'bg-green-light/20' : ''}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[n.type] || TYPE_COLORS.system}`}>
                    {TYPE_ICONS[n.type] || TYPE_ICONS.system}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-cta flex-shrink-0" />}
                      <p className="font-bold text-navy text-xs truncate">{n.title}</p>
                    </div>
                    <p className="text-sub text-xs mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-sub/70 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
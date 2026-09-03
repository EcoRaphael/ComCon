// src/components/ui/UserAvatar.jsx
// Read-only avatar for displaying someone ELSE's profile picture (a
// driver shown to a commuter, or a commuter shown to a driver) — as
// opposed to AvatarPicker.jsx, which is for editing your OWN photo.
//
// Takes the person's `users.id` (NOT drivers.id — a driver's photo lives
// under their user_id, since the avatar bucket is keyed by the shared
// `users` table id for every role) and falls back to initials on a
// colored background if no photo exists or it fails to load.
import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function UserAvatar({ userId, name, size = 40, color, className = '' }) {
  const [broken, setBroken] = useState(false)
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??'

  // getPublicUrl is a pure client-side string construction (no network
  // call), so it's cheap to call per-row in a list without perf concern.
  const publicUrl = userId
    ? supabase.storage.from('avatar').getPublicUrl(`avatar-${userId}.jpg`).data?.publicUrl
    : null
  const showImg = publicUrl && !broken

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center font-black text-white flex-shrink-0 ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35, background: showImg ? undefined : (color || '#2E7D32') }}
    >
      {showImg ? (
        <img src={publicUrl} alt="" className="w-full h-full object-cover" onError={() => setBroken(true)} />
      ) : (
        initials
      )}
    </div>
  )
}
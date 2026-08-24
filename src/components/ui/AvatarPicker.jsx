// src/components/ui/AvatarPicker.jsx
// Tappable profile picture — shows current photo or initials, with a
// small camera badge that opens Take Photo / Gallery options. Uploads to
// the shared 'avatar' storage bucket at a fixed per-user path
// (avatar-{profile.id}.jpg), same convention as the admin panel's own
// avatar feature, so every user type shares one consistent approach.
import { useState, useEffect, useRef } from 'react'
import { Camera, Image, X, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import CameraCapture from './CameraCapture'

export default function AvatarPicker({ profile, size = 64, initials = '??' }) {
  const [avatarUrl, setAvatarUrl] = useState(() => {
    if (!profile?.id) return null
    try { return localStorage.getItem(`cc-avatar-${profile.id}`) || null } catch { return null }
  })
  const [showMenu, setShowMenu] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [uploading, setUploading] = useState(false)
  const galleryInputRef = useRef(null)

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      const { data } = supabase.storage.from('avatar').getPublicUrl(`avatar-${profile.id}.jpg`)
      if (!data?.publicUrl) return
      try {
        const res = await fetch(data.publicUrl, { method: 'HEAD' })
        if (res.ok) {
          const url = data.publicUrl + '?t=' + Date.now()
          setAvatarUrl(url)
          try { localStorage.setItem(`cc-avatar-${profile.id}`, url) } catch {}
        }
      } catch {}
    }
    load()
  }, [profile?.id])

  async function uploadFile(file) {
    if (!profile?.id) return
    setUploading(true)
    try {
      const path = `avatar-${profile.id}.jpg`
      const { error } = await supabase.storage
        .from('avatar')
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg' })
      if (error) throw error

      const { data } = supabase.storage.from('avatar').getPublicUrl(path)
      const url = data.publicUrl + '?t=' + Date.now()
      setAvatarUrl(url)
      try { localStorage.setItem(`cc-avatar-${profile.id}`, url) } catch {}
    } catch (err) {
      console.error('[AvatarPicker] upload failed:', err)
      alert('Failed to upload photo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <button
          type="button"
          onClick={() => setShowMenu(true)}
          className="w-full h-full rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-white font-black overflow-hidden"
          style={{ fontSize: size * 0.3 }}
          aria-label="Change profile picture"
        >
          {uploading ? (
            <RefreshCw size={size * 0.35} className="animate-spin" />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            initials
          )}
        </button>
        <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-cta border-2 border-white flex items-center justify-center pointer-events-none">
          <Camera size={11} className="text-white" />
        </div>
      </div>

      {/* Take Photo / Gallery menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && setShowMenu(false)}
        >
          <div className="bg-white w-full sm:max-w-xs rounded-t-2xl sm:rounded-2xl p-5 animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <p className="font-bold text-navy">Profile Picture</p>
              <button onClick={() => setShowMenu(false)} className="text-sub hover:text-navy">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => { setShowMenu(false); setShowCamera(true) }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-green/40 text-sm font-semibold text-navy"
              >
                <Camera size={16} /> Take Photo
              </button>
              <button
                type="button"
                onClick={() => { setShowMenu(false); galleryInputRef.current?.click() }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-green/40 text-sm font-semibold text-navy"
              >
                <Image size={16} /> Choose from Gallery
              </button>
            </div>
          </div>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={(file) => { setShowCamera(false); uploadFile(file) }}
          onClose={() => setShowCamera(false)}
          onFallbackToGallery={() => galleryInputRef.current?.click()}
        />
      )}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) uploadFile(file)
          e.target.value = ''
        }}
      />
    </>
  )
}
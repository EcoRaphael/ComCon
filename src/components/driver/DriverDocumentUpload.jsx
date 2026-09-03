// src/components/driver/DriverDocumentUpload.jsx
// License/OR/CR document upload — moved here from registration. With
// "Confirm email" required project-wide (needed for commuter OTP),
// supabase.auth.signUp() returns session: null until the account is
// confirmed. Storage uploads require a real session to satisfy RLS
// (storage.objects policies check auth.uid()), so uploading documents
// during registration itself would fail the same way the users/drivers
// table inserts did. This screen runs after the driver's first
// successful login instead — by then they have a genuine session, so
// the exact same upload logic that failed during registration works
// correctly here.
import { useState, useRef } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { useToast } from '@/lib/ToastContext'
import { supabase } from '@/lib/supabase/client'
import { Camera, Image, X, AlertTriangle } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import CameraCapture from '@/components/ui/CameraCapture'

const MAX_DOC_MB = 8

export default function DriverDocumentUpload({ onComplete }) {
  const { profile } = useAuth()
  const { toast } = useToast()

  const [docs, setDocs] = useState({ license_front: null, license_back: null, or: null, cr: null })
  const [cameraFor, setCameraFor] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const galleryFallbackRef = useRef(null)

  const setDoc = (key, file, previewUrl) => {
    setError('')
    setDocs(prev => {
      if (prev[key]?.previewUrl) URL.revokeObjectURL(prev[key].previewUrl)
      return { ...prev, [key]: { file, previewUrl } }
    })
  }

  const handleDocSelect = (key, file) => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please upload an image file (JPG or PNG).'); return }
    if (file.size > MAX_DOC_MB * 1024 * 1024) { setError(`That image is too large — keep it under ${MAX_DOC_MB}MB.`); return }
    setDoc(key, file, URL.createObjectURL(file))
  }

  const handleCameraCapture = (file, previewUrl) => {
    setDoc(cameraFor, file, previewUrl)
    setCameraFor(null)
  }

  const handleFallbackToGallery = () => {
    const key = cameraFor
    setTimeout(() => {
      const input = galleryFallbackRef.current
      if (input) { input.dataset.forKey = key; input.click() }
    }, 50)
  }

  const clearDoc = (key) => {
    setDocs(prev => {
      if (prev[key]?.previewUrl) URL.revokeObjectURL(prev[key].previewUrl)
      return { ...prev, [key]: null }
    })
  }

  const handleSubmit = async () => {
    setError('')
    if (!docs.license_front || !docs.license_back || !docs.or || !docs.cr) {
      setError('Please upload all four photos before continuing.')
      return
    }
    setUploading(true)
    try {
      const uploadDoc = async (key, file) => {
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `${profile.id}/${key}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('driver-documents')
          .upload(path, file, { upsert: true, contentType: file.type })
        if (uploadErr) throw new Error(`Failed to upload ${key.toUpperCase()} photo: ${uploadErr.message}`)
        return path
      }

      const [licenseFrontPath, licenseBackPath, orPath, crPath] = await Promise.all([
        uploadDoc('license_front', docs.license_front.file),
        uploadDoc('license_back', docs.license_back.file),
        uploadDoc('or', docs.or.file),
        uploadDoc('cr', docs.cr.file),
      ])

      const { error: pathErr } = await supabase.from('drivers')
        .update({
          license_photo_path: licenseFrontPath,
          license_back_photo_path: licenseBackPath,
          or_photo_path: orPath,
          cr_photo_path: crPath,
        })
        .eq('user_id', profile.id)
      if (pathErr) throw pathErr

      toast('Documents submitted! Admin will review them shortly.')
      onComplete?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const labelCls = "text-[10px] font-bold uppercase tracking-widest text-sub ml-1"

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm bg-white rounded-3xl p-7 shadow-2xl">
        <h2 className="text-xl font-black text-navy mb-1">One Last Step</h2>
        <p className="text-sub text-sm mb-5">
          Upload your License (front and back), OR, and CR — admin needs these to verify your account before you can go online.
        </p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-2xl p-3 mb-4 text-xs text-red-700">
            <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-3">
          {[
            { key: 'license_front', label: "Driver's License — Front *" },
            { key: 'license_back',  label: "Driver's License — Back *" },
            { key: 'or',            label: 'OR (Official Receipt) *' },
            { key: 'cr',            label: 'CR (Certificate of Registration) *' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className={labelCls}>{label}</label>
              {docs[key] ? (
                <div className="mt-1.5 flex items-center gap-3 bg-surface rounded-2xl p-2.5">
                  <img src={docs[key].previewUrl} alt={label} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" />
                  <p className="flex-1 text-xs font-semibold text-navy truncate">{docs[key].file.name}</p>
                  <button type="button" onClick={() => clearDoc(key)} disabled={uploading}
                    className="p-1.5 text-sub hover:text-red-600 flex-shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCameraFor(key)}
                    disabled={uploading}
                    className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border rounded-2xl text-sub text-xs font-bold hover:border-orange-300 hover:text-cta transition-colors"
                  >
                    <Camera size={16} />
                    Take Photo
                  </button>
                  <label className="flex items-center justify-center gap-2 h-16 border-2 border-dashed border-border rounded-2xl text-sub text-xs font-bold cursor-pointer hover:border-orange-300 hover:text-cta transition-colors">
                    <Image size={16} />
                    Gallery
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={uploading}
                      onChange={e => handleDocSelect(key, e.target.files?.[0])}
                    />
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="w-full mt-5 py-3.5 text-white font-black text-sm uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60 bg-cta hover:opacity-90 transition-opacity"
        >
          {uploading ? <Spinner size={20} /> : 'Submit Documents'}
        </button>
      </div>

      {cameraFor && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setCameraFor(null)}
          onFallbackToGallery={handleFallbackToGallery}
        />
      )}
      <input
        ref={galleryFallbackRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const key = e.target.dataset.forKey
          handleDocSelect(key, e.target.files?.[0])
          e.target.value = ''
        }}
      />
    </div>
  )
}
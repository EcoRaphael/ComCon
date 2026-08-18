// src/components/ui/CameraCapture.jsx
// Real in-app camera capture — a live video preview + shutter button,
// using getUserMedia directly. This is deliberate: relying on a plain
// <input type="file"> to *maybe* surface a camera option via the OS
// picker is inconsistent (desktop browsers largely ignore the `capture`
// attribute, and behavior varies across mobile browsers/webviews). This
// component works the same way everywhere a camera is actually available,
// and fails gracefully with a clear message when it isn't.
import { useEffect, useRef, useState } from 'react'
import { X, RotateCcw, Check, AlertTriangle } from 'lucide-react'

export default function CameraCapture({ onCapture, onClose, onFallbackToGallery }) {
  const videoRef  = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState(null)
  const [captured, setCaptured] = useState(null) // { blob, previewUrl }
  const [facingMode, setFacingMode] = useState('environment')
  const [starting, setStarting] = useState(true)

  useEffect(() => {
    startCamera(facingMode)
    return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode])

  async function startCamera(mode) {
    setStarting(true)
    setError(null)
    stopCamera()
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (err) {
      // Common cases: permission denied, no camera device, insecure
      // context (camera access requires HTTPS, which this app already
      // runs under in production).
      setError(
        err.name === 'NotAllowedError'
          ? 'Camera access was denied. Allow camera permission in your browser settings, or choose a photo from your gallery instead.'
          : err.name === 'NotFoundError'
          ? 'No camera was found on this device. Choose a photo from your gallery instead.'
          : `Couldn't start the camera (${err.message}). Choose a photo from your gallery instead.`
      )
    } finally {
      setStarting(false)
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
  }

  function handleShutter() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || !video.videoWidth) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      if (!blob) return
      const previewUrl = URL.createObjectURL(blob)
      setCaptured({ blob, previewUrl })
      stopCamera() // freeze — no need to keep the camera running while reviewing
    }, 'image/jpeg', 0.9)
  }

  function handleRetake() {
    if (captured?.previewUrl) URL.revokeObjectURL(captured.previewUrl)
    setCaptured(null)
    startCamera(facingMode)
  }

  function handleUsePhoto() {
    if (!captured) return
    const file = new File([captured.blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' })
    onCapture(file, captured.previewUrl)
  }

  function handleClose() {
    stopCamera()
    if (captured?.previewUrl) URL.revokeObjectURL(captured.previewUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <button type="button" onClick={handleClose} className="p-2 text-white">
          <X size={22} />
        </button>
        <p className="text-white text-sm font-bold">Take Photo</p>
        {!captured && !error ? (
          <button
            type="button"
            onClick={() => setFacingMode(m => m === 'environment' ? 'user' : 'environment')}
            className="p-2 text-white"
            aria-label="Switch camera"
          >
            <RotateCcw size={20} />
          </button>
        ) : <div className="w-9" />}
      </div>

      {/* Body */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error ? (
          <div className="max-w-xs text-center px-6">
            <AlertTriangle size={32} className="text-amber-400 mx-auto mb-3" />
            <p className="text-white text-sm">{error}</p>
            <button
              type="button"
              onClick={() => { handleClose(); onFallbackToGallery?.() }}
              className="mt-5 px-5 py-2.5 bg-white text-navy rounded-full text-sm font-bold"
            >
              Choose from gallery instead
            </button>
          </div>
        ) : captured ? (
          <img src={captured.previewUrl} alt="Captured document" className="max-h-full max-w-full object-contain" />
        ) : (
          <>
            {starting && <Spinner />}
            <video ref={videoRef} playsInline muted className="max-h-full max-w-full object-contain" />
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      {!error && (
        <div className="flex items-center justify-center gap-6 py-6 bg-black/80">
          {captured ? (
            <>
              <button
                type="button"
                onClick={handleRetake}
                className="flex flex-col items-center gap-1 text-white/80 text-xs font-semibold"
              >
                <div className="w-12 h-12 rounded-full border-2 border-white/60 flex items-center justify-center">
                  <RotateCcw size={20} />
                </div>
                Retake
              </button>
              <button
                type="button"
                onClick={handleUsePhoto}
                className="flex flex-col items-center gap-1 text-white text-xs font-semibold"
              >
                <div className="w-16 h-16 rounded-full bg-green flex items-center justify-center">
                  <Check size={26} />
                </div>
                Use Photo
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleShutter}
              disabled={starting}
              aria-label="Capture photo"
              className="w-16 h-16 rounded-full bg-white border-4 border-white/40 active:scale-90 transition-transform disabled:opacity-40"
            />
          )}
        </div>
      )}
    </div>
  )
}

// Tiny inline spinner so this file has no cross-import for such a small
// need — matches the visual weight of the rest of the camera UI.
function Spinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
    </div>
  )
}
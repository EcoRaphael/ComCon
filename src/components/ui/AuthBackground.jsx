// src/components/ui/AuthBackground.jsx
// Shared background for every screen in LoginPage.jsx — the Calbayog
// Cathedral photo with a dark overlay for readability, matching the
// admin panel's login screen style. Centralized here instead of
// duplicating the background-image + overlay markup across the several
// separate screens (role selector, commuter/driver sign-in, OTP,
// success) that previously each had their own plain gradient div.
export default function AuthBackground({ children, className = '' }) {
  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-5 relative bg-cover bg-center ${className}`}
      style={{ backgroundImage: "url('/calbayog-cathedral.jpg')" }}
    >
      {/* Dark overlay so white text/cards stay readable over the photo */}
      <div className="absolute inset-0 bg-black/65" />
      <div className="relative z-10 w-full flex flex-col items-center">
        {children}
      </div>
    </div>
  )
}
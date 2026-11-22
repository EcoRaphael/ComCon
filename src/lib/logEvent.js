// Reports an important app action to the Docker container's log (shows in Dozzle).
// Fails silently anywhere /log-event doesn't exist (e.g. Vercel).
export function logEvent(event, details = {}) {
  const params = new URLSearchParams({ event })
  for (const [key, value] of Object.entries(details)) {
    if (value !== null && value !== undefined && value !== '') params.set(key, String(value))
  }
  fetch(`/log-event?${params}`, { keepalive: true }).catch(() => {})
}
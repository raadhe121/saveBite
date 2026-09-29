'use client'

// Leaflet touches `window` at module-evaluation time, so it can never be
// part of the server-rendered bundle — load it dynamically, client-only.
import dynamic from 'next/dynamic'

const LocationPickerInner = dynamic(
  () => import('./location-picker-inner').then((m) => m.LocationPicker),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-[0.65rem] border text-xs"
        style={{ height: 220, borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        Loading map…
      </div>
    ),
  }
)

export function LocationPicker(props: {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  return <LocationPickerInner {...props} />
}

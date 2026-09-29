'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'

const icon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const FALLBACK_CENTER: [number, number] = [40.7128, -74.006] // NYC, used only when no location is known yet

export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null
  lng: number | null
  onChange: (lat: number, lng: number) => void
}) {
  const [center] = useState<[number, number]>(
    lat != null && lng != null ? [lat, lng] : FALLBACK_CENTER
  )

  return (
    <div className="overflow-hidden rounded-[0.65rem] border" style={{ borderColor: 'var(--border)' }}>
      <MapContainer center={center} zoom={12} scrollWheelZoom style={{ height: 220, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={onChange} />
        {lat != null && lng != null && <Marker position={[lat, lng]} icon={icon} />}
      </MapContainer>
      <p
        className="px-2 py-1 text-xs"
        style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
      >
        Click the map to set the pickup location.
      </p>
    </div>
  )
}

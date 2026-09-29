'use client'

import { useRef, useState, useTransition } from 'react'
import { updateProfile } from '@/lib/actions/profile'
import type { Profile } from '@/lib/types'
import { LocationPicker } from '@/components/location-picker'
import { CrosshairIcon } from '@/components/icons'

export function ProfileForm({ profile }: { profile: Profile }) {
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [locating, setLocating] = useState(false)
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: profile.lat,
    lng: profile.lng,
  })
  const [isPending, startTransition] = useTransition()

  const phoneDigits = (profile.phone ?? '').replace(/^\+91\s*/, '')

  function useMyLocation() {
    if (!('geolocation' in navigator)) {
      setError('Your browser does not support location detection. Click the map instead.')
      return
    }
    setError(null)
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      (err) => {
        const message =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow it in your browser settings, or click the map to set your location.'
            : 'Could not get your location. Click the map to set it.'
        setError(message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null)
        setSaved(false)
        const rawPhone = String(formData.get('phone_digits') ?? '').trim()
        formData.set('phone', rawPhone ? `+91 ${rawPhone}` : '')
        startTransition(async () => {
          try {
            await updateProfile(formData)
            setSaved(true)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save profile')
          }
        })
      }}
    >
      {error && <p className="banner banner-error mb-4">{error}</p>}
      {saved && <p className="banner banner-success mb-4">Profile saved.</p>}

      <div className="panel">
        <div className="panel-header">
          <h2>About you</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="field-label">Your name</span>
            <input name="full_name" defaultValue={profile.full_name ?? ''} placeholder="Your name" className="input" />
          </div>
          <div>
            <span className="field-label">Organization name</span>
            <input
              name="org_name"
              defaultValue={profile.org_name ?? ''}
              placeholder="Organization name"
              className="input"
            />
          </div>
        </div>

        <div className="mt-3">
          <span className="field-label">Phone</span>
          <div className="phone-input">
            <span className="phone-input-prefix">+91</span>
            <input name="phone_digits" defaultValue={phoneDigits} placeholder="98765 43210" />
          </div>
        </div>

        {profile.role === 'donor' && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <span className="field-label">Business type</span>
              <input
                name="business_type"
                defaultValue={profile.business_type ?? ''}
                placeholder="Restaurant, bakery…"
                className="input"
              />
            </div>
            <div>
              <span className="field-label">Operating hours</span>
              <input
                name="operating_hours"
                defaultValue={profile.operating_hours ?? ''}
                placeholder="e.g. Mon–Fri 9am–6pm"
                className="input"
              />
            </div>
          </div>
        )}

        <div className="mt-3">
          <span className="field-label">Photo / logo</span>
          <input name="photo" type="file" accept="image/*" className="block w-full text-sm" />
        </div>
      </div>

      <div className="panel mt-4">
        <div className="panel-header">
          <div>
            <h2>Your location</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Used to show food closest to you.
            </p>
          </div>
          <button type="button" onClick={useMyLocation} disabled={locating} className="btn btn-secondary btn-sm">
            <CrosshairIcon size={14} />
            {locating ? 'Locating…' : 'Use my location'}
          </button>
        </div>

        <input
          name="address"
          defaultValue={profile.address ?? ''}
          placeholder="Search your address"
          className="input mb-3"
        />

        <LocationPicker lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
        <input type="hidden" name="lat" value={coords.lat ?? ''} />
        <input type="hidden" name="lng" value={coords.lng ?? ''} />
      </div>

      <div className="mt-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => {
            formRef.current?.reset()
            setCoords({ lat: profile.lat, lng: profile.lng })
            setSaved(false)
            setError(null)
          }}
          className="btn btn-secondary"
        >
          Discard
        </button>
        <button type="submit" disabled={isPending} className="btn btn-primary">
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}

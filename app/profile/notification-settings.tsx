'use client'

import { useEffect, useState, useTransition } from 'react'
import { subscribePush, unsubscribePush, updateNotificationPrefs } from '@/lib/actions/notifications'
import { BellIcon } from '@/components/icons'
import type { Profile } from '@/lib/types'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

type PushState = 'unsupported' | 'checking' | 'denied' | 'off' | 'on'

export function NotificationSettings({ profile }: { profile: Profile }) {
  const [pushState, setPushState] = useState<PushState>('checking')
  const [pushError, setPushError] = useState<string | null>(null)
  const [pushBusy, setPushBusy] = useState(false)

  const [radius, setRadius] = useState(profile.notify_radius_miles ?? 10)
  const [newListings, setNewListings] = useState(profile.notify_new_listings ?? true)
  const [claims, setClaims] = useState(profile.notify_claims ?? true)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    async function check() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        setPushState('unsupported')
        return
      }
      if (Notification.permission === 'denied') {
        setPushState('denied')
        return
      }
      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.getSubscription()
      setPushState(sub ? 'on' : 'off')
    }
    check().catch(() => setPushState('unsupported'))
  }, [])

  async function enablePush() {
    setPushBusy(true)
    setPushError(null)
    try {
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) throw new Error('Push notifications are not configured')

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setPushState(permission === 'denied' ? 'denied' : 'off')
        return
      }

      const reg = await navigator.serviceWorker.register('/sw.js')
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })

      const json = sub.toJSON()
      await subscribePush({
        endpoint: sub.endpoint,
        keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth },
      })
      setPushState('on')
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Could not enable notifications')
    } finally {
      setPushBusy(false)
    }
  }

  async function disablePush() {
    setPushBusy(true)
    setPushError(null)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await unsubscribePush(sub.endpoint)
        await sub.unsubscribe()
      }
      setPushState('off')
    } catch (e) {
      setPushError(e instanceof Error ? e.message : 'Could not disable notifications')
    } finally {
      setPushBusy(false)
    }
  }

  function savePrefs(formData: FormData) {
    setSaved(false)
    startTransition(async () => {
      await updateNotificationPrefs(formData)
      setSaved(true)
    })
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Notifications</h2>
      </div>

      <div className="flex items-center justify-between gap-4 p-3 rounded-lg" style={{ background: 'var(--surface-2, rgba(0,0,0,0.03))' }}>
        <div className="flex items-center gap-3">
          <BellIcon size={20} />
          <div>
            <p className="font-medium">Browser push notifications</p>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {pushState === 'unsupported' && "Your browser doesn't support push notifications."}
              {pushState === 'checking' && 'Checking status…'}
              {pushState === 'denied' && 'Blocked — allow notifications for this site in your browser settings.'}
              {pushState === 'off' && 'Off — turn on to get alerts on this device.'}
              {pushState === 'on' && 'On for this device.'}
            </p>
          </div>
        </div>
        {(pushState === 'off' || pushState === 'on') && (
          <button
            type="button"
            onClick={pushState === 'on' ? disablePush : enablePush}
            disabled={pushBusy}
            className={`btn btn-sm ${pushState === 'on' ? 'btn-secondary' : 'btn-primary'}`}
          >
            {pushBusy ? 'Working…' : pushState === 'on' ? 'Turn off' : 'Turn on'}
          </button>
        )}
      </div>
      {pushError && <p className="banner banner-error mt-3">{pushError}</p>}

      <form action={savePrefs} className="mt-4 flex flex-col gap-3">
        {saved && <p className="banner banner-success">Preferences saved.</p>}

        {(profile.role === 'receiver' || profile.role === 'volunteer') && (
          <>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                name="notify_new_listings"
                checked={newListings}
                onChange={(e) => setNewListings(e.target.checked)}
              />
              Alert me when new food is posted near me
            </label>
            <div className="max-w-xs">
              <span className="field-label">Alert radius (miles)</span>
              <input
                type="number"
                name="notify_radius_miles"
                min={1}
                max={100}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="input"
              />
            </div>
          </>
        )}

        {(profile.role === 'donor' || profile.role === 'admin') && (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="notify_claims"
              checked={claims}
              onChange={(e) => setClaims(e.target.checked)}
            />
            Alert me when someone claims my listing
          </label>
        )}

        <button type="submit" disabled={isPending} className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
          {isPending ? 'Saving…' : 'Save preferences'}
        </button>
      </form>
    </div>
  )
}

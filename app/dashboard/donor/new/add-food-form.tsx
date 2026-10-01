'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createListing } from '@/lib/actions/listings'
import { scanFoodPhoto } from '@/lib/actions/ai-scan'
import { DIETARY_TAGS, type DietaryTag, type FoodCategory } from '@/lib/types'
import { LocationPicker } from '@/components/location-picker'
import { toLocalInputValue } from '@/components/datetime-field'
import {
  ArrowLeftIcon,
  CameraIcon,
  CrosshairIcon,
  AlertIcon,
  SearchIcon,
  ImagePlaceholderIcon,
  SparklesIcon,
} from '@/components/icons'

const CATEGORIES: { value: FoodCategory; label: string }[] = [
  { value: 'cooked_meals', label: 'Cooked meals' },
  { value: 'bakery', label: 'Bakery' },
  { value: 'produce', label: 'Fruits & veg' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'packaged', label: 'Packaged' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'other', label: 'Other' },
]

type Preset = 'next2h' | 'evening' | 'tomorrow' | 'custom'

function presetTimes(preset: Preset) {
  const now = new Date()
  if (preset === 'next2h') {
    const expires = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    return { start: now, end: expires, expires }
  }
  if (preset === 'evening') {
    const end = new Date(now)
    end.setHours(19, 0, 0, 0)
    if (end < now) end.setDate(end.getDate() + 1)
    return { start: now, end, expires: end }
  }
  if (preset === 'tomorrow') {
    const start = new Date(now)
    start.setDate(start.getDate() + 1)
    start.setHours(9, 0, 0, 0)
    const end = new Date(start)
    end.setHours(11, 0, 0, 0)
    return { start, end, expires: end }
  }
  return null
}

export function AddFoodForm({
  postedCount,
  pickedUpCount,
  defaultAddress,
  defaultLat,
  defaultLng,
}: {
  postedCount: number
  pickedUpCount: number
  defaultAddress: string | null
  defaultLat: number | null
  defaultLng: number | null
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<FoodCategory>('cooked_meals')
  const [quantity, setQuantity] = useState(20)
  const [unit, setUnit] = useState('items')
  const [tags, setTags] = useState<DietaryTag[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [address, setAddress] = useState(defaultAddress ?? '')
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: defaultLat,
    lng: defaultLng,
  })
  const [preset, setPreset] = useState<Preset>('next2h')
  const [pickupStart, setPickupStart] = useState('')
  const [pickupEnd, setPickupEnd] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [instructions, setInstructions] = useState('')

  const [locating, setLocating] = useState(false)
  const [locationWarning, setLocationWarning] = useState(defaultLat == null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const [scanning, setScanning] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  const [scanApplied, setScanApplied] = useState(false)

  function applyPreset(p: Preset) {
    setPreset(p)
    const times = presetTimes(p)
    if (times) {
      setPickupStart(toLocalInputValue(times.start))
      setPickupEnd(toLocalInputValue(times.end))
      setExpiresAt(toLocalInputValue(times.expires))
    }
  }

  useEffect(() => {
    applyPreset('next2h')
    // Only seed defaults once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function detectLocation() {
    if (!('geolocation' in navigator)) {
      setLocationWarning(true)
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationWarning(false)
        setLocating(false)
      },
      () => {
        setLocationWarning(true)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  useEffect(() => {
    if (defaultLat == null) detectLocation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function toggleTag(tag: DietaryTag) {
    setTags((current) => (current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag]))
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    setPhotoPreview(file ? URL.createObjectURL(file) : null)
    setScanError(null)
    setScanApplied(false)
  }

  function scanPhoto() {
    if (!photoFile) return
    setScanning(true)
    setScanError(null)
    setScanApplied(false)
    const fd = new FormData()
    fd.set('photo', photoFile)
    startTransition(async () => {
      try {
        const result = await scanFoodPhoto(fd)
        setTitle(result.title)
        setCategory(result.category)
        setQuantity(result.quantity)
        setUnit(result.unit)
        setTags(result.dietary_tags)
        setScanApplied(true)
      } catch (e) {
        setScanError(e instanceof Error ? e.message : 'AI scan failed')
      } finally {
        setScanning(false)
      }
    })
  }

  const step1Done = title.trim().length > 0 && quantity > 0
  const step2Done = coords.lat != null && coords.lng != null
  const step3Done = expiresAt.trim().length > 0
  const stepsDone = [step1Done, step2Done, step3Done].filter(Boolean).length

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createListing(formData)
        router.push('/dashboard/donor')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      }
    })
  }

  return (
    <main>
      <div className="hero-banner" style={{ marginBottom: 0, borderRadius: 0 }}>
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back()
            else router.push('/dashboard/donor')
          }}
          className="back-link mb-4"
        >
          <ArrowLeftIcon size={15} />
          Back
        </button>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <span className="hero-pill">Takes about 2 minutes</span>
            <h1 className="hero-headline" style={{ fontSize: '2rem' }}>
              Share your surplus food
            </h1>
            <p className="hero-copy">Tell nearby NGOs and volunteers what you have, where it is, and when to collect it.</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat-box">
              <strong>{postedCount}</strong>
              <span>Listing posted</span>
            </div>
            <div className="hero-stat-box">
              <strong className="accent">{pickedUpCount}</strong>
              <span>Picked up</span>
            </div>
          </div>
        </div>
      </div>

      <div className="page-main page-main--wide" style={{ paddingTop: '1.5rem' }}>
        {locationWarning && (
          <div className="warn-banner">
            <span className="flex items-center gap-2">
              <AlertIcon size={18} />
              We couldn't detect your location. Tap the map below to drop a pickup pin.
            </span>
            <button type="button" onClick={detectLocation} disabled={locating} className="btn btn-hero-primary btn-sm">
              {locating ? 'Trying…' : 'Try again'}
            </button>
          </div>
        )}

        <div className="grid grid-cols-[1fr_22rem] gap-6 items-start">
          <form id="add-food-form" ref={formRef} action={handleSubmit}>
            {error && <p className="banner banner-error mb-4">{error}</p>}

            {/* Step 1 */}
            <div className="step-card">
              <div className="step-header">
                <span className="step-number">1</span>
                <div>
                  <h3>What are you sharing?</h3>
                  <p>A clear title and photo get food claimed faster.</p>
                </div>
              </div>

              <div className="grid grid-cols-[12rem_1fr] gap-4">
                <div className="flex flex-col gap-2">
                  <label className="photo-dropzone">
                    {photoPreview ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photoPreview} alt="" />
                    ) : (
                      <>
                        <CameraIcon />
                        <span>Add a food photo</span>
                        <small>Drag & drop or browse</small>
                      </>
                    )}
                    <input name="photo" type="file" accept="image/*" onChange={handlePhoto} hidden />
                  </label>

                  {photoFile && (
                    <button
                      type="button"
                      onClick={scanPhoto}
                      disabled={scanning}
                      className="btn btn-secondary btn-sm flex items-center justify-center gap-1.5"
                    >
                      <SparklesIcon size={14} />
                      {scanning ? 'Scanning…' : 'Scan with AI'}
                    </button>
                  )}
                  {scanApplied && !scanning && (
                    <p className="text-xs text-[color:var(--accent)]">✓ Details filled from photo — check before posting</p>
                  )}
                  {scanError && <p className="text-xs" style={{ color: 'var(--danger, #dc2626)' }}>{scanError}</p>}
                </div>

                <div className="flex flex-col gap-3">
                  <div>
                    <span className="field-label">Title</span>
                    <input
                      name="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. 20 veg sandwiches"
                      required
                      className="input"
                    />
                  </div>
                  <div>
                    <span className="field-label">Description</span>
                    <textarea
                      name="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Freshly made today, packed in boxes…"
                      className="input"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span className="field-label">Category</span>
                <input type="hidden" name="category" value={category} />
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setCategory(c.value)}
                      className={`pill-select ${category === c.value ? 'pill-select-active' : ''}`}
                    >
                      {category === c.value && '✓ '}
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <span className="field-label">Quantity</span>
                  <input type="hidden" name="quantity" value={quantity} />
                  <div className="quantity-stepper">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="stepper-btn"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="quantity-value">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => q + 1)}
                      className="stepper-btn"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <span className="field-label">Unit</span>
                  <select name="unit" value={unit} onChange={(e) => setUnit(e.target.value)} className="input">
                    <option value="items">Items</option>
                    <option value="servings">Servings</option>
                    <option value="kg">kg</option>
                    <option value="lbs">lbs</option>
                    <option value="boxes">Boxes</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <span className="field-label">Dietary tags</span>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAGS.map((tag) => {
                    const active = tags.includes(tag)
                    const accent = tag === 'contains_nuts'
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`pill-select capitalize ${active ? (accent ? 'pill-select-active-accent' : 'pill-select-active') : ''}`}
                      >
                        {active && !accent && '✓ '}
                        {tag.replace('_', ' ')}
                      </button>
                    )
                  })}
                </div>
                {tags.map((tag) => (
                  <input key={tag} type="hidden" name="dietary_tags" value={tag} />
                ))}
              </div>
            </div>

            {/* Step 2 */}
            <div className="step-card">
              <div className="step-header">
                <span className="step-number">2</span>
                <div className="flex-1">
                  <h3>Where to pick up?</h3>
                  <p>Drop a pin so volunteers can find you on the live map.</p>
                </div>
                <button type="button" onClick={detectLocation} disabled={locating} className="btn btn-secondary btn-sm">
                  <CrosshairIcon size={15} />
                  {locating ? 'Locating…' : 'Use my location'}
                </button>
              </div>

              <div className="search-bar mb-3" style={{ minWidth: 0 }}>
                <SearchIcon size={16} />
                <input
                  name="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Search pickup address"
                  required
                />
              </div>

              <div className="map-shell">
                <LocationPicker lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
                <span className="map-coords-chip">
                  Lat {coords.lat != null ? coords.lat.toFixed(4) : '—'} · Lng{' '}
                  {coords.lng != null ? coords.lng.toFixed(4) : '—'}
                </span>
              </div>
              <input type="hidden" name="lat" value={coords.lat ?? ''} required />
              <input type="hidden" name="lng" value={coords.lng ?? ''} required />
            </div>

            {/* Step 3 */}
            <div className="step-card" style={{ marginBottom: 0 }}>
              <div className="step-header">
                <span className="step-number">3</span>
                <div>
                  <h3>When can it be collected?</h3>
                  <p>Set a pickup window and when the food should be gone by.</p>
                </div>
              </div>

              <div className="mb-4 flex flex-wrap gap-2">
                {(
                  [
                    ['next2h', 'Next 2 hours'],
                    ['evening', 'This evening'],
                    ['tomorrow', 'Tomorrow morning'],
                    ['custom', 'Custom'],
                  ] as [Preset, string][]
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => applyPreset(value)}
                    className={`pill-select ${preset === value ? 'pill-select-active' : ''}`}
                  >
                    {preset === value && '✓ '}
                    {label}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <span className="field-label">Pickup from</span>
                  <input
                    name="pickup_start"
                    type="datetime-local"
                    value={pickupStart}
                    onChange={(e) => setPickupStart(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <span className="field-label">Pickup until</span>
                  <input
                    name="pickup_end"
                    type="datetime-local"
                    value={pickupEnd}
                    onChange={(e) => setPickupEnd(e.target.value)}
                    className="input"
                  />
                </div>
                <div>
                  <span className="field-label">Expires at</span>
                  <input
                    name="expires_at"
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    required
                    className="input"
                  />
                </div>
              </div>

              <div className="mt-4">
                <span className="field-label">Pickup instructions (optional)</span>
                <textarea
                  name="special_instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="e.g. Ask for Ravi at the back door"
                  className="input"
                />
              </div>
            </div>
          </form>

          <aside className="preview-panel">
            <div className="panel">
              <div className="panel-header">
                <span className="eyebrow">Live preview</span>
                <span className="text-sm text-[color:var(--muted)]">{stepsDone} of 3 steps done</span>
              </div>
              <div className="preview-progress-track">
                <div className="preview-progress-fill" style={{ width: `${(stepsDone / 3) * 100}%` }} />
              </div>

              <div className="preview-card">
                <div className="preview-image-slot">
                  {photoPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoPreview} alt="" />
                  ) : (
                    <ImagePlaceholderIcon />
                  )}
                </div>
                <div className="preview-body">
                  <div className="flex flex-wrap gap-1">
                    <span className="chip">{CATEGORIES.find((c) => c.value === category)?.label}</span>
                    {tags.map((t) => (
                      <span key={t} className="chip capitalize">
                        {t.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  <h4>{title.trim() || 'Your food title'}</h4>
                  <p>
                    {quantity} {unit} · {step2Done ? address || 'Pickup point set' : 'Pickup point not set'}
                  </p>
                </div>
              </div>

              <button type="submit" form="add-food-form" disabled={isPending} className="btn btn-primary btn-block">
                {isPending ? 'Posting…' : 'Post listing →'}
              </button>
              <p className="mt-2 text-center text-xs text-[color:var(--muted)]">
                Nearby NGOs get notified the moment you post.
              </p>
            </div>

            <div className="tips-card">
              <h4>Tips for a quick pickup</h4>
              <ul>
                <li>• Add a real photo of the food</li>
                <li>• Keep the pickup window at least 1 hour</li>
                <li>• Mention packaging and allergens</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

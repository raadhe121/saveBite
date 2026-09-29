'use client'

import { useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateListing } from '@/lib/actions/listings'
import { DIETARY_TAGS, type Listing } from '@/lib/types'
import { LocationPicker } from '@/components/location-picker'
import { DateTimeField, toLocalInputValue } from '@/components/datetime-field'

export function EditListingForm({ listing }: { listing: Listing }) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: listing.lat,
    lng: listing.lng,
  })
  const [isPending, startTransition] = useTransition()

  return (
    <form
      ref={formRef}
      className="form-card"
      action={(formData) => {
        setError(null)
        startTransition(async () => {
          try {
            await updateListing(listing.id, formData)
            router.push('/dashboard/donor')
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Something went wrong')
          }
        })
      }}
    >
      {error && <p className="banner banner-error">{error}</p>}

      <input type="hidden" name="existing_photo_url" value={listing.photo_url ?? ''} />

      <div>
        <span className="field-label">Title</span>
        <input name="title" defaultValue={listing.title} required className="input" />
      </div>
      <div>
        <span className="field-label">Description</span>
        <textarea name="description" defaultValue={listing.description ?? ''} className="input" />
      </div>

      <div>
        <span className="field-label">Replace food photo (optional)</span>
        {listing.photo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={listing.photo_url} alt="" className="mb-2 h-16 w-16 rounded-lg object-cover" />
        )}
        <input name="photo" type="file" accept="image/*" className="block w-full text-sm" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <span className="field-label">Category</span>
          <select name="category" defaultValue={listing.category} className="input">
            <option value="cooked_meals">Cooked meals</option>
            <option value="bakery">Bakery</option>
            <option value="produce">Produce</option>
            <option value="dairy">Dairy</option>
            <option value="packaged">Packaged</option>
            <option value="beverages">Beverages</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <span className="field-label">Quantity</span>
          <input name="quantity" defaultValue={listing.quantity} required className="input" />
        </div>
        <div>
          <span className="field-label">Unit</span>
          <select name="unit" defaultValue={listing.unit} className="input">
            <option value="servings">Servings</option>
            <option value="kg">kg</option>
            <option value="lbs">lbs</option>
            <option value="boxes">Boxes</option>
            <option value="items">Items</option>
          </select>
        </div>
      </div>

      <fieldset>
        <legend className="field-label">Dietary tags</legend>
        <div className="flex flex-wrap gap-2">
          {DIETARY_TAGS.map((tag) => (
            <label key={tag} className="checkbox-pill">
              <input
                type="checkbox"
                name="dietary_tags"
                value={tag}
                defaultChecked={listing.dietary_tags.includes(tag)}
              />
              <span className="capitalize">{tag.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <span className="field-label">Pickup address</span>
        <input name="address" defaultValue={listing.address} required className="input" />
      </div>

      <div>
        <span className="field-label" style={{ marginBottom: '0.5rem' }}>
          Pickup location
        </span>
        <LocationPicker lat={coords.lat} lng={coords.lng} onChange={(lat, lng) => setCoords({ lat, lng })} />
        <div className="mt-2 grid grid-cols-2 gap-3">
          <input name="lat" required readOnly value={coords.lat ?? ''} className="input" />
          <input name="lng" required readOnly value={coords.lng ?? ''} className="input" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <DateTimeField
          name="pickup_start"
          label="Pickup window start"
          defaultValue={listing.pickup_start ? toLocalInputValue(new Date(listing.pickup_start)) : undefined}
          minNow={false}
        />
        <DateTimeField
          name="pickup_end"
          label="Pickup window end"
          defaultValue={listing.pickup_end ? toLocalInputValue(new Date(listing.pickup_end)) : undefined}
          minNow={false}
        />
      </div>

      <DateTimeField
        name="expires_at"
        label="Must be picked up by (expiry)"
        required
        defaultValue={toLocalInputValue(new Date(listing.expires_at))}
        minNow={false}
      />

      <div>
        <span className="field-label">Special pickup instructions</span>
        <textarea name="special_instructions" defaultValue={listing.special_instructions ?? ''} className="input" />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending || coords.lat == null || coords.lng == null}
          className="btn btn-primary"
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={() => router.push('/dashboard/donor')} className="btn btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

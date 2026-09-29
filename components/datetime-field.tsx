'use client'

import { useRef } from 'react'

export function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

export function DateTimeField({
  name,
  label,
  required,
  minNow = true,
  defaultValue,
}: {
  name: string
  label: string
  required?: boolean
  minNow?: boolean
  defaultValue?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  function openPicker() {
    // showPicker() is the reliable way to force the native calendar/clock UI
    // open on click; without it some browsers only open on the small icon.
    // Only call it from a direct click — browsers reject it (throwing
    // NotAllowedError) when triggered by focus events that aren't a real
    // user gesture, e.g. tabbing in or autofill.
    try {
      ref.current?.showPicker?.()
    } catch {
      // Not a user gesture; the input is still focused and usable normally.
    }
  }

  return (
    <label>
      <span className="field-label">{label}</span>
      <input
        ref={ref}
        name={name}
        type="datetime-local"
        required={required}
        defaultValue={defaultValue}
        min={minNow ? toLocalInputValue(new Date()) : undefined}
        onClick={openPicker}
        className="input cursor-pointer"
      />
    </label>
  )
}

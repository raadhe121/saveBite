'use client'

import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from '@/components/icons'

export function PasswordField({
  name,
  placeholder,
  minLength,
}: {
  name: string
  placeholder: string
  minLength?: number
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="input-with-action">
      <input
        name={name}
        type={visible ? 'text' : 'password'}
        required
        minLength={minLength}
        placeholder={placeholder}
        className="input"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="input-action"
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
      </button>
    </div>
  )
}

'use client'

import { useState } from 'react'

export function InviteLinkButton() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/signup`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission can be denied; nothing else to fall back to here.
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="btn btn-block"
      style={{ background: '#b8560f', color: '#ffffff' }}
    >
      {copied ? 'Link copied!' : 'Copy invite link'}
    </button>
  )
}

'use client'

import { useState } from 'react'
import { CopyIcon, CheckIcon } from '@/components/icons'

export function CopyCodeButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard permission can be denied; nothing else to fall back to here.
    }
  }

  return (
    <button type="button" onClick={copy} className="btn btn-secondary btn-sm">
      {copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
      {copied ? 'Copied!' : 'Copy code'}
    </button>
  )
}

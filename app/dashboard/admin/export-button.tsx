'use client'

import type { Listing } from '@/lib/types'

function toCsv(rows: Listing[]) {
  const header = ['title', 'category', 'quantity', 'unit', 'status', 'address', 'created_at']
  const lines = rows.map((r) =>
    header
      .map((key) => `"${String(r[key as keyof Listing] ?? '').replace(/"/g, '""')}"`)
      .join(',')
  )
  return [header.join(','), ...lines].join('\n')
}

export function ExportDataButton({ listings }: { listings: Listing[] }) {
  function handleExport() {
    const csv = toCsv(listings)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `savebite-listings-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <button type="button" onClick={handleExport} className="btn btn-secondary btn-block">
      Export data
    </button>
  )
}

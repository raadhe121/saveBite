type Point = { label: string; value: number }

export function BarChart({
  data,
  color = 'var(--primary)',
  suffix = '',
}: {
  data: Point[]
  color?: string
  suffix?: string
}) {
  const max = Math.max(1, ...data.map((d) => d.value))

  return (
    <div className="flex items-end gap-2" style={{ height: 140 }}>
      {data.map((d, i) => (
        <div key={d.label + i} className="flex flex-1 flex-col items-center gap-1.5">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {d.value}
            {suffix}
          </span>
          <div
            style={{
              width: '100%',
              maxWidth: 32,
              height: Math.max(3, (d.value / max) * 96),
              background: color,
              borderRadius: '0.3rem 0.3rem 0 0',
            }}
          />
          <span className="text-center text-xs" style={{ color: 'var(--muted)', fontSize: '0.68rem' }}>
            {d.label}
          </span>
        </div>
      ))}
    </div>
  )
}

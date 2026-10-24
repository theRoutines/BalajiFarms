export function HerdStatCard({ number, label, subtitle, icon }) {
  return (
    <div className="flex flex-col rounded-3xl border border-forest/15 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
          {label}
        </span>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
      <div className="mt-3 font-display text-4xl font-bold tracking-tight text-forest sm:text-5xl">
        {number ?? '—'}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs font-medium text-gold">{subtitle}</p>
      )}
    </div>
  )
}

export default HerdStatCard


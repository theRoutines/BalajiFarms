export function CategoryBreakdown({ byCategory = {}, totalCows = 0 }) {
  const categories = [
    {
      key: 'MILKING',
      label: 'Milking Cows',
      description: 'Active milk-yielding cows nourished on fresh fodder',
      count: byCategory.MILKING || 0,
      barColor: 'bg-forest',
    },
    {
      key: 'PREGNANT',
      label: 'Pregnant Cows',
      description: 'Expecting mothers in special comfort pastures',
      count: byCategory.PREGNANT || 0,
      barColor: 'bg-gold',
    },
    {
      key: 'DRY',
      label: 'Dry Cows',
      description: 'Resting phase between lactation cycles',
      count: byCategory.DRY || 0,
      barColor: 'bg-amber-600',
    },
    {
      key: 'HEIFER',
      label: 'Heifers',
      description: 'Young cows preparing for maturity',
      count: byCategory.HEIFER || 0,
      barColor: 'bg-emerald-600',
    },
  ]

  const baseTotal = totalCows || categories.reduce((sum, c) => sum + c.count, 0) || 1

  return (
    <div className="rounded-3xl border border-forest/15 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-forest/10 pb-4">
        <div>
          <h3 className="font-display text-xl font-bold text-forest">
            Cow Category Breakdown
          </h3>
          <p className="text-xs text-charcoal/70">
            Real-time status of all active cows in our care
          </p>
        </div>
        <span className="rounded-full bg-forest/10 px-3 py-1 text-xs font-semibold text-forest">
          {totalCows} Total Cows
        </span>
      </div>

      <div className="mt-6 space-y-6">
        {categories.map((cat) => {
          const percent = Math.round((cat.count / baseTotal) * 100) || 0

          return (
            <div key={cat.key} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-semibold text-charcoal">{cat.label}</span>
                  <span className="ml-2 text-xs text-charcoal/60 hidden sm:inline">
                    ({cat.description})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-charcoal">{cat.count}</span>
                  <span className="text-xs text-charcoal/50">({percent}%)</span>
                </div>
              </div>

              {/* Horizontal bar built with plain divs */}
              <div className="h-3 w-full overflow-hidden rounded-full bg-cream border border-stone-200">
                <div
                  className={`h-full rounded-full ${cat.barColor} transition-all duration-700`}
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryBreakdown


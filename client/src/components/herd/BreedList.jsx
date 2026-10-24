export function BreedList({ breeds = [] }) {
  const breedInfo = {
    Gir: 'Renowned indigenous dairy breed originating from Gujarat, famous for high A2 beta-casein milk.',
    Sahiwal: 'Ancient zebu cattle breed known for exceptional heat tolerance and rich, golden cream milk.',
    Rathi: 'Hardy desert breed native to Rajasthan, producing nourishing milk with natural minerals.',
    'Holstein Friesian': 'Cross-adapted dairy breed known for high milk volume, cared for in temperature-controlled sheds.',
  }

  if (!breeds || breeds.length === 0) {
    return null
  }

  return (
    <div className="rounded-3xl border border-forest/15 bg-white p-6 sm:p-8 shadow-sm">
      <div className="border-b border-forest/10 pb-4">
        <h3 className="font-display text-xl font-bold text-forest">
          Our Indigenous & Adapted Breeds
        </h3>
        <p className="text-xs text-charcoal/70">
          The heritage cattle breeds that form the heart of Green Pasture Dairy
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {breeds.map((item) => (
          <div
            key={item.breed}
            className="flex flex-col justify-between rounded-2xl border border-forest/10 bg-cream/40 p-5 transition hover:bg-cream/80 hover:border-forest/30"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-display text-lg font-bold text-forest">
                  {item.breed}
                </span>
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-xs font-bold text-charcoal">
                  {item.count}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-charcoal/70">
                {breedInfo[item.breed] || 'Pure-bred cattle nurtured on organic natural pasture and clean water.'}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-forest/10 flex items-center justify-between text-[11px] font-semibold text-gold uppercase tracking-wider">
              <span>Heritage Strain</span>
              <span>100% Free-Range</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BreedList


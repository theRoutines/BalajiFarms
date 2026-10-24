import { useEffect, useState } from 'react'
import { getHerdStats } from '../api/herdApi.js'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import ImageWithFallback from '../components/common/ImageWithFallback.jsx'
import Loader from '../components/common/Loader.jsx'
import BreedList from '../components/herd/BreedList.jsx'
import CategoryBreakdown from '../components/herd/CategoryBreakdown.jsx'
import HerdStatCard from '../components/herd/HerdStatCard.jsx'
import { BRAND_NAME } from '../utils/constants.js'
import OurStory from '../assets/OurStory.png';
import Bilona from '../assets/Bilona.png';
import ColdPressed from '../assets/ColdPressed.png';
import Cows from '../assets/Cows.png';
import FarmImage1 from '../assets/FarmImage1.png';
import FarmImage2 from '../assets/FarmImage2.png';


export function OurFarmPage() {
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function fetchStats() {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getHerdStats()
        if (isMounted) {
          setStats(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch live herd statistics')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    fetchStats()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="flex flex-col py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-husk/80 shadow-lg min-h-[300px] sm:min-h-[360px] flex items-center justify-center text-center px-6 py-12 sm:px-12 sm:py-16">
          <img
            src={FarmImage2}
            alt="Balaji Farms & Ethical Stewardship"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          {/* Dual Gradient Overlays for contrast & legibility */}
          <div className="absolute inset-0 bg-espresso/35" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 via-espresso/20 to-espresso/10" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-sand/40 bg-sand/20 backdrop-blur-md px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-sand-light shadow-sm">
              <span>🌱</span> Authentic Vedic Roots
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md">
              Our Farm & Ethical Stewardship
            </h1>
            <p className="mt-4 text-sm sm:text-base leading-relaxed text-cream/90 font-medium max-w-2xl mx-auto drop-shadow-sm">
              At BALAJI FARMS, we believe nature cannot be rushed. Our pastures, animals, and artisanal methods are rooted in timeless reverence for the earth and indigenous Indian cattle.
            </p>
          </div>
        </div>

        {/* Story Section 1: Our Beginning */}
        <div className="mt-16 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              01 • Our Beginning
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-forest">
              A return to purity and conscious farming.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/80">
              Years ago, witnessing the commodification and chemical saturation of everyday dairy and edible oils, our founders set out to build a sanctuary. We started with five indigenous Gir cows on uncultivated organic land.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
              Our mission has never been industrial volume; it has always been uncompromised integrity. Every tree planted and shed designed here prioritizes sunlight, fresh air, and stress-free living.
            </p>
          </div>
          <div className="order-1 md:order-2 overflow-hidden rounded-3xl border border-forest/15 bg-white p-4 shadow-md w-full">
            <ImageWithFallback
              src={OurStory}
              alt="Green Pasture Dairy open grasslands"
              aspectRatio="aspect-[4/3]"
              className="rounded-2xl"
            />
          </div>
        </div>

        {/* Story Section 2: The Bilona Ghee Method */}
        <div className="mt-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-forest/15 bg-white p-4 shadow-md">
            <ImageWithFallback
              src={Bilona}
              alt="Traditional wooden bilona churning in clay pots"
              aspectRatio="aspect-[4/3]"
              className="rounded-2xl"
            />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              02 • The Bilona Method
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-forest">
              Crafting Vedic A2 Cow Ghee
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/80">
              Commercial ghee is boiled directly from cream separator waste. In sharp contrast, our ghee strictly adheres to the sacred five-stage Vedic Bilona method:
            </p>
            <ol className="mt-4 space-y-2.5 text-xs text-charcoal/80">
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-cream">1</span>
                <span><strong>Fresh A2 Milk:</strong> Collected only after calves are happily nourished.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-cream">2</span>
                <span><strong>Clay Pot Culturing:</strong> Boiled in earthen vats and cultured with prebiotic curd overnight.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-cream">3</span>
                <span><strong>Bi-directional Churning:</strong> Churned clockwise and counter-clockwise with wooden wooden rods.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-cream">4</span>
                <span><strong>Makkhan Separation:</strong> Pure cultured butter is separated and washed in pristine water.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-forest text-[11px] font-bold text-cream">5</span>
                <span><strong>Slow Woodfire Simmer:</strong> Clarified gently over cow-dung cakes and firewood for golden granules.</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Story Section 3: Wood-Pressed Oils */}
        <div className="mt-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="order-2 md:order-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              03 • Wood-Pressed Oils
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-forest">
              Traditional Kolhu Cold Pressing
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/80">
              Refined grocery oils undergo extreme heat (200°C), hexane solvents, bleaching agents, and deodorizers that strip away essential antioxidants.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal/80">
              Our organic mustard and groundnut seeds are crushed at slow rotations in a traditional wooden mortar and pestle (Kolhu). Temperatures never exceed 45°C. The oil remains unrefined, unfiltered, and deeply aromatic, rich in natural omega fatty acids.
            </p>
          </div>
          <div className="order-1 md:order-2 overflow-hidden rounded-3xl border border-forest/15 bg-white p-4 shadow-md">
            <ImageWithFallback
              src={ColdPressed}
              alt="Wooden Kolhu cold-press oil extraction"
              aspectRatio="aspect-[4/3]"
              className="rounded-2xl"
            />
          </div>
        </div>

        {/* Story Section 4: Caring for Animals */}
        <div className="mt-20 grid grid-cols-1 items-center gap-10 md:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-forest/15 bg-white p-4 shadow-md">
            <ImageWithFallback
              src={Cows}
              alt="Affectionate care for indigenous cows"
              aspectRatio="aspect-[4/3]"
              className="rounded-2xl"
            />
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              04 • Humane Living
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-forest">
              Ethical Care: Non-Violence In Every Drop
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-charcoal/80">
              We operate under the sacred principle of <em>Ahimsa</em> (non-harm). Our cows are cherished family members:
            </p>
            <ul className="mt-4 space-y-2 text-xs text-charcoal/80">
              <li className="flex items-center gap-2">
                <span className="text-gold font-bold">✓</span>
                <span>Calves drink first from two maternal teats until fully satisfied.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold font-bold">✓</span>
                <span>Zero synthetic hormones, oxytocin, or forced artificial insemination.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold font-bold">✓</span>
                <span>Open-shed shelter with soft bedding, classical raga music, and herbal feed.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gold font-bold">✓</span>
                <span>Lifetime retirement sanctuary: elder and non-lactating cows are loved and cared for forever.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* LIVE HERD STATISTICS DASHBOARD */}
        <div className="mt-28 border-t border-forest/15 pt-16">
          <div className="text-center max-w-2xl mx-auto">
            <span className="rounded-full bg-forest/10 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-forest">
              Live Connected Database
            </span>
            <h2 className="mt-3 font-display text-3xl font-bold text-forest sm:text-4xl">
              Live Herd Statistics
            </h2>
            <p className="mt-2 text-sm text-charcoal/70">
              Every animal on our farm is digitally tracked and cared for. These numbers update in real-time from our central farm management registry.
            </p>
          </div>

          {isLoading ? (
            <div className="py-16 flex justify-center">
              <Loader text="Fetching live herd census..." />
            </div>
          ) : error ? (
            <div className="mt-8 max-w-xl mx-auto">
              <ErrorMessage message={error} />
            </div>
          ) : (
            <div className="mt-12 space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                <HerdStatCard
                  label="Total Cattle"
                  number={stats?.total}
                  subtitle="Entire registered herd"
                  icon="🏷️"
                />
                <HerdStatCard
                  label="Cows"
                  number={stats?.cows}
                  subtitle="Female herd"
                  icon="🐄"
                />
                <HerdStatCard
                  label="Milking Cows"
                  number={stats?.milkingCows ?? stats?.byCategory?.MILKING}
                  subtitle="Active lactation"
                  icon="🥛"
                />
                <HerdStatCard
                  label="Bulls"
                  number={stats?.bulls}
                  subtitle="Gentle sires"
                  icon="🐂"
                />
                <HerdStatCard
                  label="Calves"
                  number={stats?.calves}
                  subtitle="Next generation"
                  icon="🌱"
                />
              </div>

              {/* Category Breakdown & Breed List */}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                <CategoryBreakdown
                  byCategory={stats?.byCategory}
                  totalCows={stats?.cows}
                />
                <BreedList breeds={stats?.byBreed} />
              </div>
            </div>
          )}
        </div>

        {/* TRUST SECTION: LAB REPORTS & CERTIFICATIONS */}
        <div className="mt-28 rounded-3xl border border-forest/15 bg-white p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              Quality Assured
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold text-forest sm:text-3xl">
              Certifications & Lab Reports
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-charcoal/70">
              Transparency you can verify. Every production batch is certified for purity, zero heavy metals, and genuine A2 beta-casein protein markers.
            </p>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center rounded-2xl border border-forest/10 bg-cream/30 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-forest text-2xl">
                📜
              </div>
              <h4 className="mt-4 font-display font-bold text-forest">FSSAI Certified</h4>
              <p className="mt-1 text-xs text-charcoal/60">Lic. No. 10022011000492</p>
              <div className="mt-3 rounded-full bg-forest/10 px-3 py-0.5 text-[10px] font-semibold text-forest">
                Verified Clean
              </div>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-forest/10 bg-cream/30 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/15 text-gold text-2xl">
                🧬
              </div>
              <h4 className="mt-4 font-display font-bold text-forest">A2 DNA Verified</h4>
              <p className="mt-1 text-xs text-charcoal/60">Independent genetic allele testing</p>
              <div className="mt-3 rounded-full bg-gold/20 px-3 py-0.5 text-[10px] font-semibold text-charcoal">
                100% Pure A2
              </div>
            </div>

            <div className="flex flex-col items-center rounded-2xl border border-forest/10 bg-cream/30 p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-forest/10 text-forest text-2xl">
                🔬
              </div>
              <h4 className="mt-4 font-display font-bold text-forest">Zero Adulteration</h4>
              <p className="mt-1 text-xs text-charcoal/60">Baudouin & Reichert-Meissl tested</p>
              <div className="mt-3 rounded-full bg-forest/10 px-3 py-0.5 text-[10px] font-semibold text-forest">
                Batch Verified
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OurFarmPage


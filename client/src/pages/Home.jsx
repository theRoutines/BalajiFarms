import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getHerdStats } from '../api/herdApi.js'
import { getProducts } from '../api/productApi.js'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import Loader from '../components/common/Loader.jsx'
import Marquee from '../components/common/Marquee.jsx'
import ProductCard from '../components/product/ProductCard.jsx'
import landingHeroImage from '../assets/LandingPage.png'
import { BRAND_NAME } from '../utils/constants.js'

export function HomePage() {
  const [products, setProducts] = useState([])
  const [herdStats, setHerdStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        setIsLoading(true)
        setError(null)
        const [productData, statsData] = await Promise.all([
          getProducts(),
          getHerdStats(),
        ])
        if (isMounted) {
          setProducts(productData.products || [])
          setHerdStats(statsData)
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Failed to load farm highlights')
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadData()
    return () => {
      isMounted = false
    }
  }, [])

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section - Curved Rectangle Banner */}
      <section className="mx-auto w-full max-w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-5">
        <div className="relative w-full rounded-2xl sm:rounded-3xl lg:rounded-[2rem] overflow-hidden min-h-[560px] sm:min-h-[640px] lg:min-h-[720px] xl:min-h-[760px] flex items-center shadow-xl border border-husk/80">
          {/* Complete Rectangle Background Image */}
          <img
            src={landingHeroImage}
            alt="Balaji Farms pastures and traditional dairy"
            className="absolute inset-0 h-full w-full object-cover object-center"
          />

          {/* Dual Gradient Overlays for optimal contrast & readability on the left */}
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/50 via-espresso/30 to-espresso/20 sm:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-espresso/50 via-transparent to-espresso/30" />

          {/* Content on the Left Side Above the Image */}
          <div className="relative z-10 px-6 sm:px-10 lg:px-16 py-10 sm:py-14 lg:py-16 max-w-xl lg:max-w-2xl text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-sand/40 bg-sand/15 backdrop-blur-md px-3.5 py-1 text-[14px] sm:text-md font-bold uppercase tracking-wider text-sand-light shadow-sm">
              <span>🍃</span> 100% TRADITIONAL BILONA METHOD
            </div>

            <h1 className="mt-12 font-display text-3xl sm:text-4xl lg:text-5xl lg:leading-[1.14] font-bold tracking-tight text-white drop-shadow-md">
              Pure From the Roots, Authentic by Nature.
            </h1>

            <p className="mt-8 text-xs sm:text-sm lg:text-base leading-relaxed text-cream/90 font-medium max-w-lg drop-shadow-sm">
              Experience authentic bilona A2 cow ghee and slow-pressed mustard & groundnut oils, crafted with traditional devotion on our family farm.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3.5">
              <Link
                to="/shop"
                className="rounded-full bg-terracotta px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-terracotta/30 transition hover:bg-terracotta-dark focus:outline-none focus:ring-2 focus:ring-terracotta"
              >
                Shop Now
              </Link>
              <Link
                to="/our-farm"
                className="rounded-full border border-white/40 bg-white/10 backdrop-blur-md px-6 sm:px-7 py-2.5 sm:py-3 text-xs sm:text-sm font-bold text-white transition hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white"
              >
                Explore Our Farm
              </Link>
            </div>

            {/* Mini trust stats on the left above image */}
            <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-6 border-t border-white/20 pt-5 max-w-md">
              <div>
                <div className="font-display text-xl sm:text-2xl font-bold text-sand-light">
                  100%
                </div>
                <div className="text-[11px] sm:text-xs text-white/80 font-medium mt-0.5">
                  A2 Indigenous Cows
                </div>
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-bold text-sand-light">
                  0
                </div>
                <div className="text-[11px] sm:text-xs text-white/80 font-medium mt-0.5">
                  Chemicals or Heat
                </div>
              </div>
              <div>
                <div className="font-display text-xl sm:text-2xl font-bold text-sand-light">
                  Vedic
                </div>
                <div className="text-[11px] sm:text-xs text-white/80 font-medium mt-0.5">
                  Bilona Churned
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Initial Infinite Rotation Banner */}
      <section className="border-y border-husk/80 bg-gradient-to-r from-[#87341D] via-terracotta to-[#87341D] text-white py-3.5 sm:py-4 overflow-hidden shadow-sm">
        <Marquee
          speed="28s"
          pauseOnHover={true}
          items={[
            '🌿 Direct from our dairy farm to your doorstep',
            'Fresh batch dispatch daily across India',
            'Free delivery on orders above ₹999',
            '100% Traditional Bilona A2 Desi Cow Ghee',
            'Wood-Pressed Virgin Oils (Mustard & Groundnut)',
            'Zero Chemical Preservatives Or Additives',
            'Ethical Ahimsa Gau-Seva & Natural Grazing',
          ]}
          separator="✦"
          innerClassName="text-xs sm:text-sm font-semibold tracking-wide text-sand-light"
        />
      </section>

      {/* 3. Herd Numbers Strip */}
      <section className="border-y border-forest/15 bg-white py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                Live Transparency
              </span>
              <h2 className="font-display text-2xl font-bold text-forest">
                Our Living Herd At A Glance
              </h2>
              <p className="text-xs text-charcoal/70">
                Connected directly to our farm animal registry
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12">
              <div className="flex flex-col">
                <span className="text-xs text-charcoal/60 uppercase">Total Cattle</span>
                <span className="font-display text-3xl font-bold text-forest">
                  {herdStats?.total ?? '—'}
                </span>
                <span className="text-[11px] text-gold font-medium">Under daily care</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-charcoal/60 uppercase">Milking Cows</span>
                <span className="font-display text-3xl font-bold text-forest">
                  {herdStats?.milkingCows ?? herdStats?.byCategory?.MILKING ?? '—'}
                </span>
                <span className="text-[11px] text-gold font-medium">A2 milk active</span>
              </div>
              <div className="flex flex-col col-span-2 sm:col-span-1">
                <span className="text-xs text-charcoal/60 uppercase">Calves & Bulls</span>
                <span className="font-display text-3xl font-bold text-forest">
                  {((herdStats?.calves || 0) + (herdStats?.bulls || 0)) || '—'}
                </span>
                <span className="text-[11px] text-gold font-medium">Protected for life</span>
              </div>
            </div>

            <Link
              to="/our-farm"
              className="inline-flex items-center text-sm font-semibold text-forest hover:text-forest/80 underline underline-offset-4"
            >
              View detailed herd stats →
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Product Highlights */}
      <section className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                Fresh From The Farm
              </span>
              <h2 className="mt-1 font-display text-3xl font-bold text-forest sm:text-4xl">
                Our Signature Products
              </h2>
              <p className="mt-2 text-sm text-charcoal/70">
                Small-batch bilona ghee and wood-pressed oils with complete traceability.
              </p>
            </div>
            <Link
              to="/shop"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-forest hover:underline"
            >
              Browse all products
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          {isLoading ? (
            <div className="mt-12 flex justify-center py-12">
              <Loader text="Loading fresh products..." />
            </div>
          ) : error ? (
            <div className="mt-8">
              <ErrorMessage message={error} />
            </div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {products.slice(0, 3).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Trust Points */}
      <section className="bg-white py-20 border-t border-forest/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gold">
              The Green Pasture Difference
            </span>
            <h2 className="mt-2 font-display text-3xl font-bold text-forest sm:text-4xl">
              Why Our Purity Is Unmatched
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-charcoal/70">
              We reject industrial shortcuts. Every drop is crafted in harmony with ancient ayurvedic wisdom.
            </p>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="rounded-3xl border border-forest/15 bg-cream/30 p-8 text-center transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-2xl text-cream">
                🧈
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-forest">
                100% Traditional Bilona
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
                Milk is cultured into curd and bi-directionally churned before slow wood-fire clarification. No raw cream boiling, ever.
              </p>
            </div>

            <div className="rounded-3xl border border-forest/15 bg-cream/30 p-8 text-center transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold text-2xl text-cream">
                🪵
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-forest">
                Slow Wood-Pressed Oils
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
                Crushed slowly in wooden Kolhu churns below 45°C. Preserving all natural tocopherols, natural aroma, and wholesome nutrients.
              </p>
            </div>

            <div className="rounded-3xl border border-forest/15 bg-cream/30 p-8 text-center transition hover:shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-forest text-2xl text-cream">
                🚪
              </div>
              <h3 className="mt-6 font-display text-xl font-bold text-forest">
                Direct From Farm To Door
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-charcoal/70">
                We handle our own deliveries with dedicated staff and secure OTP verification to guarantee freshness without middlemen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mid-Page Infinite Rotation Ribbon */}
      <section className="border-y border-sand/40 bg-[#F9F4EB] py-3 sm:py-3.5 overflow-hidden">
        <Marquee
          speed="34s"
          reverse={true}
          pauseOnHover={true}
          items={[
            '🌾 Single-Origin Pure Farm Harvest',
            '🐄 Ethical Ahimsa Vedic Gau-Seva',
            '🧪 NABL Lab-Certified For Zero Adulteration',
            '🏺 Hand-Churned In Porous Clay Pots At Dawn',
            '📦 Eco-Friendly Glass Jars & Secure Transit Packaging',
            '✨ Nourishing 50,000+ Conscious Families Daily',
          ]}
          separator="•"
          innerClassName="text-xs sm:text-sm font-bold tracking-wide text-espresso/90"
        />
      </section>

      {/* 5. Story Teaser */}
      <section className="bg-forest py-20 text-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-gold">
                Our Story & Philosophy
              </span>
              <h2 className="mt-3 font-display text-3xl font-bold sm:text-5xl">
                Caring for the cows that care for us.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-stone-200">
                Green Pasture Dairy began with a single family farm dedicated to preserving indigenous Indian cattle breeds like Gir and Sahiwal. Our calves drink their mother’s milk first, our cows graze freely under open skies, and retired elders live out their natural lives in peace.
              </p>
              <div className="mt-8">
                <Link
                  to="/our-farm"
                  className="rounded-full bg-gold px-8 py-3.5 text-sm font-semibold text-charcoal shadow-md hover:bg-gold/90 focus:outline-none focus:ring-2 focus:ring-gold"
                >
                  Read Our Full Story →
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-sm">
              <h3 className="font-display text-2xl font-bold text-gold">
                The Sacred Calf Guarantee
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-stone-200">
                Unlike industrial dairies, we never separate newborn calves from their mothers. Only excess milk after the calf is completely nourished is used to prepare our divine bilona ghee.
              </p>
              <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-6">
                <div>
                  <div className="text-lg font-bold text-cream">No Antibiotics</div>
                  <div className="text-xs text-stone-300">Natural herbal remedies</div>
                </div>
                <div className="h-8 w-px bg-white/20" />
                <div>
                  <div className="text-lg font-bold text-cream">Cruelty Free</div>
                  <div className="text-xs text-stone-300">Lifetime cow sanctuary</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage


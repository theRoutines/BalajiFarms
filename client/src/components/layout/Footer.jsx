import { Link } from 'react-router-dom'
import { BRAND_NAME } from '../../utils/constants.js'
import balajiLogo from '../../assets/BalajiFarmsLogo.png'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-forest/15 bg-stone-900 text-stone-200">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand & Tagline */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-3 group">
              <img
                src={balajiLogo}
                alt="Balaji Farms"
                className="h-12 w-12 object-contain rounded-xl shadow-xs transition duration-200 group-hover:scale-105"
              />
              <span className="font-display text-2xl font-bold text-cream">
                {BRAND_NAME}
              </span>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-400">
              Dedicated to traditional Vedic methods of bilona churned A2 cow ghee and cold-pressed, unrefined cooking oils. Ethically sourced from our well-cared-for indigenous cows and farms.
            </p>
            <div className="mt-4 flex items-center gap-3 text-xs text-gold font-medium">
              <span>✓ 100% Pure & Lab Tested</span>
              <span>•</span>
              <span>✓ No Additives</span>
              <span>•</span>
              <span>✓ Direct Farm Delivery</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-base font-semibold text-cream">Explore</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/" className="text-stone-400 transition hover:text-gold">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/shop" className="text-stone-400 transition hover:text-gold">
                  Shop Farm Products
                </Link>
              </li>
              <li>
                <Link to="/our-farm" className="text-stone-400 transition hover:text-gold">
                  Our Farm & Story
                </Link>
              </li>
              <li>
                <Link to="/cart" className="text-stone-400 transition hover:text-gold">
                  Your Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer & Info */}
          <div>
            <h4 className="font-display text-base font-semibold text-cream">Customer</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link to="/login" className="text-stone-400 transition hover:text-gold">
                  Customer Login
                </Link>
              </li>
              <li>
                <Link to="/register" className="text-stone-400 transition hover:text-gold">
                  Register Account
                </Link>
              </li>
              <li>
                <Link to="/orders" className="text-stone-400 transition hover:text-gold">
                  Track Orders
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-stone-800 pt-6 text-center text-xs text-stone-500">
          <p>© {currentYear} {BRAND_NAME}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer


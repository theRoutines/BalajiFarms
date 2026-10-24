import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import Marquee from '../common/Marquee.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCart } from '../../context/CartContext.jsx'
import { BRAND_NAME } from '../../utils/constants.js'
import balajiLogo from '../../assets/BalajiFarmsLogo.png'

export function Navbar() {
  const { user, logout, isAdmin, isDelivery } = useAuth()
  const { itemCount } = useCart()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const navigate = useNavigate()

  async function handleLogout() {
    setUserDropdownOpen(false)
    setMobileMenuOpen(false)
    await logout()
    navigate('/')
  }

  const navLinkClass = ({ isActive }) =>
    `text-sm font-medium transition-colors hover:text-terracotta ${
      isActive
        ? 'text-terracotta font-semibold underline underline-offset-8 decoration-sand decoration-2'
        : 'text-espresso/80'
    }`

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
      {/* 1. Top Announcement Bar - Infinite Marquee */}
      <div className="bg-[#87341D] text-white py-2 font-medium tracking-wide shadow-inner overflow-hidden border-b border-white/10">
        <Marquee
          speed="28s"
          pauseOnHover={true}
          items={[
            '🌿 Direct from our dairy farm to your doorstep',
            'Fresh batch dispatch daily across India',
            'Free delivery on orders above ₹999',
            '100% Traditional Bilona A2 Desi Cow Ghee',
            'Wood-Pressed Virgin Oils (Mustard & Groundnut)',
            'Pure • Vedic • Direct From Our Pastures',
          ]}
          separator="|"
          innerClassName="text-white font-medium text-[11px] sm:text-xs"
        />
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="mx-auto flex h-24 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 border-b border-husk/80">
        {/* Brand with Balaji Farms Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta rounded-xl group py-1"
        >
          <img
            src={balajiLogo}
            alt="Balaji Farms Logo"
            className="h-20 w-20 sm:h-20 sm:w-20 object-contain rounded-xl shadow-xs transition duration-200 group-hover:scale-105"
          />
          
        </Link>

        {/* Desktop Navigation with Home Button */}
        <nav className="hidden md:flex items-center gap-7 lg:gap-8">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/shop" className={navLinkClass}>
            Shop Products
          </NavLink>
          <NavLink to="/our-farm" className={navLinkClass}>
            Our Farm
          </NavLink>
          <NavLink to="/orders" className={navLinkClass}>
            Track Orders
          </NavLink>
        </nav>

        {/* Right side: Cart & Auth */}
        <div className="hidden md:flex items-center gap-5">
          {/* Cart Icon */}
          <Link
            to="/cart"
            aria-label={`Cart with ${itemCount} items`}
            className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-husk bg-cream text-espresso transition hover:bg-sand-light hover:border-terracotta/40 focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            <svg
              className="h-5 w-5 text-espresso"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.189-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119.993z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-terracotta text-[11px] font-bold text-white shadow">
                {itemCount}
              </span>
            )}
          </Link>

          {/* User Section */}
          {user ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 rounded-xl border border-husk bg-white py-2 pl-3 pr-4 text-sm font-semibold text-espresso hover:border-terracotta/40 focus:outline-none focus:ring-2 focus:ring-terracotta"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-terracotta/10 font-bold text-terracotta">
                  {user.name?.charAt(0) || 'U'}
                </span>
                <span className="max-w-[120px] truncate">{user.name}</span>
                <svg
                  className="h-4 w-4 text-espresso/60"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {userDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 rounded-xl border border-husk bg-white py-2 shadow-xl ring-1 ring-black/5"
                  onMouseLeave={() => setUserDropdownOpen(false)}
                >
                  <div className="border-b border-husk/50 px-4 py-2">
                    <p className="text-xs text-espresso/60">Signed in as</p>
                    <p className="truncate text-xs font-semibold text-espresso">{user.email}</p>
                  </div>

                  <Link
                    to="/orders"
                    onClick={() => setUserDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-espresso hover:bg-cream hover:text-terracotta"
                  >
                    My Orders
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-terracotta font-medium hover:bg-cream"
                    >
                      Admin Panel
                    </Link>
                  )}

                  {isDelivery && (
                    <Link
                      to="/delivery"
                      onClick={() => setUserDropdownOpen(false)}
                      className="block px-4 py-2 text-sm text-forest font-medium hover:bg-cream"
                    >
                      Delivery Portal
                    </Link>
                  )}

                  <div className="border-t border-husk/50 mt-1 pt-1">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-rose-700 hover:bg-rose-50"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="rounded-lg bg-terracotta px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-terracotta-dark focus:outline-none focus:ring-2 focus:ring-terracotta focus:ring-offset-2 transition"
            >
              Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu and cart button */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            to="/cart"
            aria-label={`Cart with ${itemCount} items`}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-husk text-espresso"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.75"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25c-.67 0-1.189-.578-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119.993z"
              />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="rounded-lg border border-husk p-2 text-espresso focus:outline-none focus:ring-2 focus:ring-terracotta"
          >
            {mobileMenuOpen ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-husk bg-white px-4 pt-3 pb-6 md:hidden shadow-lg">
          <nav className="flex flex-col gap-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-espresso hover:bg-cream"
            >
              Home
            </Link>
            <Link
              to="/shop"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-espresso hover:bg-cream"
            >
              Shop Products
            </Link>
            <Link
              to="/our-farm"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-espresso hover:bg-cream"
            >
              Our Farm
            </Link>
            <Link
              to="/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="rounded-lg px-3 py-2 text-base font-medium text-espresso hover:bg-cream"
            >
              Track Orders
            </Link>

            {user ? (
              <>
                <div className="my-1 border-t border-husk" />
                <div className="px-3 py-1">
                  <p className="text-xs text-espresso/60">Signed in as</p>
                  <p className="text-sm font-semibold text-terracotta">{user.name}</p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-lg px-3 py-2 text-left text-base font-medium text-rose-700 hover:bg-rose-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="mt-2 pt-2 border-t border-husk flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-lg bg-terracotta py-2.5 text-center text-sm font-semibold text-white"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full rounded-lg border border-espresso py-2.5 text-center text-sm font-medium text-espresso"
                >
                  Create an account
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

export default Navbar

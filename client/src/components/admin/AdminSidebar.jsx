import { Link, NavLink } from 'react-router-dom'
import { BRAND_NAME } from '../../utils/constants.js'

export function AdminSidebar() {
  const navLinks = [
    { to: '/admin/orders', label: 'Orders', icon: '📦' },
    { to: '/admin/products', label: 'Products & Stock', icon: '🧈' },
    { to: '/admin/zones', label: 'Delivery Zones', icon: '🚚' },
    { to: '/admin/herd', label: 'Herd Records', icon: '🐄' },
  ]

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition ${
      isActive
        ? 'bg-terracotta text-white shadow-sm'
        : 'text-espresso/70 hover:bg-cream hover:text-espresso'
    }`

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 border-r border-husk bg-white p-6">
      {/* Brand & Badge */}
      <div className="border-b border-husk/60 pb-6">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta text-white font-bold text-base">
            🌿
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-espresso leading-tight">
              {BRAND_NAME === 'Green Pasture Dairy' ? 'BalajiFarms' : BRAND_NAME}
            </h2>
            <span className="rounded-md bg-sand-light border border-sand/40 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-espresso">
              Staff Admin
            </span>
          </div>
        </Link>
      </div>

      {/* Nav List */}
      <nav className="mt-6 flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className={linkClass}>
            <span className="text-lg">{link.icon}</span>
            <span className="whitespace-nowrap">{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Back to Customer Store */}
      <div className="mt-8 border-t border-husk/60 pt-6 hidden lg:block">
        <Link
          to="/"
          className="flex items-center gap-2 text-xs font-semibold text-espresso/60 hover:text-terracotta transition"
        >
          <span>←</span>
          <span>Return to Customer Store</span>
        </Link>
      </div>
    </aside>
  )
}

export default AdminSidebar


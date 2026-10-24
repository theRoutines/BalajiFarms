import { Outlet } from 'react-router-dom'
import AdminSidebar from '../../components/admin/AdminSidebar.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export function AdminLayout() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen flex-col lg:flex-row bg-cream text-espresso">
      {/* Sidebar Navigation */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header bar */}
        <header className="border-b border-husk bg-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-terracotta">
              BalajiFarms Operations Control
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-terracotta/10 font-bold text-xs text-terracotta">
              {user?.name?.charAt(0) || 'A'}
            </span>
            <div className="hidden sm:block text-right">
              <span className="text-xs font-bold text-espresso block">{user?.name}</span>
              <span className="text-[10px] text-espresso/60 uppercase font-semibold">Administrator</span>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 p-6 sm:p-8 lg:p-10 max-w-7xl">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout


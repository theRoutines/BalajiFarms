import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './components/common/ProtectedRoute.jsx'
import Layout from './components/layout/Layout.jsx'
import AdminHerdPage from './pages/admin/AdminHerdPage.jsx'
import AdminLayout from './pages/admin/AdminLayout.jsx'
import AdminOrdersPage from './pages/admin/AdminOrdersPage.jsx'
import AdminProductsPage from './pages/admin/AdminProductsPage.jsx'
import AdminZonesPage from './pages/admin/AdminZonesPage.jsx'
import CartPage from './pages/CartPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import DeliveryOrdersPage from './pages/delivery/DeliveryOrdersPage.jsx'
import HomePage from './pages/Home.jsx'
import LoginPage from './pages/Login.jsx'
import NotFoundPage from './pages/NotFound.jsx'
import OrderDetailPage from './pages/OrderDetailPage.jsx'
import OrdersPage from './pages/OrdersPage.jsx'
import OurFarmPage from './pages/OurFarm.jsx'
import ProductDetailPage from './pages/ProductDetail.jsx'
import RegisterPage from './pages/Register.jsx'
import ShopPage from './pages/Shop.jsx'

export function App() {
  return (
    <Routes>
      {/* 1. Storefront & Customer Routes in Layout */}
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/:slug" element={<ProductDetailPage />} />
        <Route path="our-farm" element={<OurFarmPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />

        {/* Protected Customer Routes */}
        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <CheckoutPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Delivery Route */}
        <Route
          path="delivery"
          element={
            <ProtectedRoute roles={['DELIVERY', 'ADMIN']}>
              <DeliveryOrdersPage />
            </ProtectedRoute>
          }
        />

        {/* 404 Fallback */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>

      {/* 2. Protected Admin Portal Routes in AdminLayout */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="orders" replace />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="zones" element={<AdminZonesPage />} />
        <Route path="herd" element={<AdminHerdPage />} />
      </Route>
    </Routes>
  )
}

export default App

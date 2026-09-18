import { useEffect } from 'react'
import { Route, Routes, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { setUser, setTokens } from './features/authSlice'
import * as authService from './services/authService'
import Navbar from './layouts/Navbar'
import Footer from './layouts/Footer'
import AdminLayout from './layouts/AdminLayout'
import HomePage from './pages/HomePage'
import MenuPage from './pages/MenuPage'
import NashtaPage from './pages/NashtaPage'
import BranchSelectPage from './pages/BranchSelectPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderSuccessPage from './pages/OrderSuccessPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import SetupStatusPage from './pages/SetupStatusPage'
import AboutUsPage from './pages/AboutUsPage'
import PrivacyPolicyPage from './pages/PrivacyPolicyPage'
import AdminDashboardPage from './pages/admin/AdminDashboardPage'
import AdminOrdersPage from './pages/admin/AdminOrdersPage'
import AdminProductsPage from './pages/admin/AdminProductsPage'
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage'
import AdminInventoryPage from './pages/admin/AdminInventoryPage'
import AdminBranchesPage from './pages/admin/AdminBranchesPage'
import AdminDeliveryAreasPage from './pages/admin/AdminDeliveryAreasPage'
import AdminDealsPage from './pages/admin/AdminDealsPage'
import AdminCouponsPage from './pages/admin/AdminCouponsPage'
import AdminCustomersPage from './pages/admin/AdminCustomersPage'

const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN']

function PrivateRoute({ children }) {
  const user = useSelector((s) => s.auth.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  return user ? children : null
}

function AdminRoute({ children }) {
  const user = useSelector((s) => s.auth.user)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
    else if (!ADMIN_ROLES.includes(user.role)) navigate('/')
  }, [user, navigate])

  return user && ADMIN_ROLES.includes(user.role) ? children : null
}

function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  )
}

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      authService
        .getMe()
        .then((res) => {
          dispatch(setUser(res.data.user))
          dispatch(setTokens({ accessToken: token }))
        })
        .catch(() => localStorage.removeItem('accessToken'))
    }
  }, [dispatch])

  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/setup" element={<SetupStatusPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/nashta" element={<NashtaPage />} />
        <Route path="/branch-select" element={<BranchSelectPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/order-success/:id" element={<OrderSuccessPage />} />
        <Route
          path="/orders"
          element={
            <PrivateRoute>
              <OrdersPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about-us" element={<AboutUsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      </Route>

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="branches" element={<AdminBranchesPage />} />
        <Route path="delivery-areas" element={<AdminDeliveryAreasPage />} />
        <Route path="deals" element={<AdminDealsPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
      </Route>
    </Routes>
  )
}

export default App

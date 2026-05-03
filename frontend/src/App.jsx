import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Dashboard from './components/Dashboard'
import Users from './components/Users'
import Category from './components/Category'
import Products from './components/Products'
import Brand from './components/Brand'
import ProductsList from './components/ProductsList'
import Checkout from './components/Checkout'
import Orders from './components/Orders'
import './styles/Auth.css'

// ── Auth page: shows Login tab by default, Register tab on /register ──────────
function AuthPage({ defaultTab }) {
  const [tab, setTab] = useState(() => defaultTab || sessionStorage.getItem('authTab') || 'login')

  const switchTab = (newTab) => {
    sessionStorage.setItem('authTab', newTab)
    setTab(newTab)
  }

  return (
    <div className="authPage">
      <div className="bgBlob bgBlob1" />
      <div className="bgBlob bgBlob2" />
      <div className="bgBlob bgBlob3" />
      <div className="bgGrid" />

      <div className="card">
        <div className="cardHeader">
          <div className="brandRow">
            <div className="brandGem">✦</div>
            <span className="brandName">Aurum</span>
          </div>

          <div className="tabRow" role="tablist">
            <button
              className={`tabBtn${tab === 'login' ? ' active' : ''}`}
              onClick={() => switchTab('login')}
              role="tab"
              aria-selected={tab === 'login'}
            >
              Sign In
            </button>
            <button
              className={`tabBtn${tab === 'register' ? ' active' : ''}`}
              onClick={() => switchTab('register')}
              role="tab"
              aria-selected={tab === 'register'}
            >
              Register
            </button>
          </div>
        </div>

        <div className="cardBody" key={tab}>
          {tab === 'login' ? (
            <LoginForm onSwitchToRegister={() => switchTab('register')} />
          ) : (
            <RegisterForm onSwitchToLogin={() => switchTab('login')} />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helper to read user from localStorage ─────────────────────────────────────
function getUser() {
  try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
}

// ── Redirect after login based on role ───────────────────────────────────────
function RoleRedirect() {
  const user = getUser()
  if (!user) return <Navigate to="/" replace />
  return user.role === 'Admin'
    ? <Navigate to="/users" replace />
    : <Navigate to="/lists" replace />
}

// ── Admin-only route: must be logged in AND be Admin ─────────────────────────
function AdminRoute({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/" replace />
  if (user.role !== 'Admin') return <Navigate to="/lists" replace />
  return children
}

// ── User route: must be logged in (any role) ─────────────────────────────────
function UserRoute({ children }) {
  const user = getUser()
  if (!user) return <Navigate to="/" replace />
  return children
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Auth routes — no dashboard shell */}
        <Route path="/"         element={<AuthPage defaultTab="login" />} />
        <Route path="/login"    element={<AuthPage defaultTab="login" />} />
        <Route path="/register" element={<AuthPage defaultTab="register" />} />

        {/* After login, redirect to the correct screen based on role */}
        <Route path="/home" element={<RoleRedirect />} />

        {/* ── User-only routes: standalone, NO dashboard sidebar ── */}
        <Route
          path="/lists"
          element={
            <UserRoute>
              <ProductsList />
            </UserRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <UserRoute>
              <Checkout />
            </UserRoute>
          }
        />

        {/* ── Admin dashboard: sidebar + nested pages ── */}
        <Route
          path="/"
          element={
            <AdminRoute>
              <Dashboard />
            </AdminRoute>
          }
        >
          <Route path="users"    element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="products" element={<AdminRoute><Products /></AdminRoute>} />
          <Route path="category" element={<AdminRoute><Category /></AdminRoute>} />
          <Route path="brands"   element={<AdminRoute><Brand /></AdminRoute>} />
          <Route path="orders"   element={<AdminRoute><Orders /></AdminRoute>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
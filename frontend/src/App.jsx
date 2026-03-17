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

// ── Route protection for admin-only pages ─────────────────────────────────────
function ProtectedRoute({ children, allowUser = false }) {
  const user = JSON.parse(localStorage.getItem('user'))
  const role = user?.role

  if (!user) return <Navigate to="/" replace />
  if (role === 'User' && !allowUser) return <Navigate to="/lists" replace />

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

        {/* ── ProductsList: standalone, NO dashboard sidebar/topbar ── */}
        <Route
          path="/lists"
          element={
            <ProtectedRoute allowUser={true}>
              <ProductsList />
            </ProtectedRoute>
          }
        />

        {/* ── Checkout: standalone, protected, accessible by users ── */}
        <Route
          path="/checkout"
          element={
            <ProtectedRoute allowUser={true}>
              <Checkout />
            </ProtectedRoute>
          }
        />

        {/* ── Dashboard layout wraps admin-only pages ── */}
        <Route path="/" element={<Dashboard />}>
          <Route path="users"    element={<ProtectedRoute><Users /></ProtectedRoute>} />
          <Route path="products" element={<ProtectedRoute><Products /></ProtectedRoute>} />
          <Route path="category" element={<ProtectedRoute><Category /></ProtectedRoute>} />
          <Route path="brands"   element={<ProtectedRoute><Brand /></ProtectedRoute>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </BrowserRouter>
  )
}
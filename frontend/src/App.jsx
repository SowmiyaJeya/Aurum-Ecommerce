// ============================================================
// App.jsx — Root component
// Renders the auth card with Login / Register tab switcher.
// Tab state lives here so both forms can trigger a tab switch.
// ============================================================

import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginForm from './components/LoginForm'
import RegisterForm from './components/RegisterForm'
import Dashboard from './components/Dashboard'
import './styles/Auth.css'

function AuthPage() {
  // Persist tab across refresh using sessionStorage
  const [tab, setTab] = useState(() => sessionStorage.getItem('authTab') || 'login')

  const switchTab = (newTab) => {
    sessionStorage.setItem('authTab', newTab)
    setTab(newTab)
  }

  return (
    <div className="authPage">

      {/* ---- Decorative background elements ---- */}
      <div className="bgBlob bgBlob1" />
      <div className="bgBlob bgBlob2" />
      <div className="bgBlob bgBlob3" />
      <div className="bgGrid" />

      {/* ---- Auth Card ---- */}
      <div className="card">

        {/* Card Header: Brand + Tabs */}
        <div className="cardHeader">

          {/* Brand mark */}
          <div className="brandRow">
            <div className="brandGem">✦</div>
            <span className="brandName">Aurum</span>
          </div>

          {/* Tab switcher */}
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

        {/* Card Body: Form content — key forces remount on tab switch */}
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        {/* Catch-all → back to home */}
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
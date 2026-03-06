import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Toast from './Toast'
import '../styles/Auth.css'
// import { useEffect } from "react";
import { toast } from "react-toastify";
// import toast, { Toaster } from "react-hot-toast";
import { useSearchParams } from "react-router-dom";
import { startIdleTimer } from "../utils/idleTimer"

// const handlesubmit = async (e) => {

//   e.preventDefault()

//   try {

//     const response = await axios.post("/api/login", {
//       username,
//       password
//     })

//     if (response.data.success) {

//       startIdleTimer()   // 🔥 start timer after login

//       navigate("/dashboard")

//     }

//   } catch (error) {
//     console.log(error)
//   }
// }
function validate(form) {
  const errors = {}

  if (!form.username.trim())
    errors.username = 'Username is required'
  else if (form.username.trim().length < 3)
    errors.username = 'Username must be at least 3 characters'

  if (!form.password)
    errors.password = 'Password is required'
  else if (form.password.length < 6)
    errors.password = 'Password must be at least 6 characters'

  return errors
}

export default function LoginForm({ onSwitchToRegister }) {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeToast, setActiveToast] = useState(null) // { type, title, message }

  const setField = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: '' }))
  }

  const showToast = (type, title, message) => {
    setActiveToast({ type, title, message })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Frontend validation
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username.trim(),
          password: form.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Map backend error messages to field-level or toast errors
        const msg = data.message || 'Login failed'

        if (msg.toLowerCase().includes('user not found') || msg.toLowerCase().includes('not registered')) {
          setErrors({ username: 'No account found with this username' })
          showToast('error', 'User Not Found', 'This username is not registered.')
        } else if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('invalid credentials')) {
          setErrors({ password: 'Incorrect password' })
          showToast('error', 'Wrong Password', 'The password you entered is incorrect.')
        } else {
          showToast('error', 'Login Failed', msg)
        }
        return
      }

      // ✅ Success
      startIdleTimer() // 🔥 start session idle timer
      if (data.token) localStorage.setItem('token', data.token)
      if (data.user)  localStorage.setItem('user', JSON.stringify(data.user))

      showToast('success', '👋 Welcome back!', `Logged in as ${form.username}. Redirecting...`)

      setTimeout(() => {
        navigate('/users')
      }, 1500)

    } catch (err) {
      console.error('Login error:', err)
      showToast('error', 'Server Error', 'Could not connect to server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {activeToast && (
        <Toast
          title={activeToast.title}
          message={activeToast.message}
          type={activeToast.type}
          onHide={() => setActiveToast(null)}
        />
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="sectionTitle">Welcome back</div>
        <div className="sectionSub">Sign in to continue to your account</div>

        {/* --- Username --- */}
        <div className="fieldGroup">
          <label className="fieldLabel" htmlFor="login-username">Username</label>
          <div className="fieldWrap">
            <span className="fieldIcon">👤</span>
            <input
              id="login-username"
              className={`fieldInput${errors.username ? ' hasError' : ''}`}
              type="text"
              placeholder="your_username"
              value={form.username}
              onChange={e => setField('username', e.target.value)}
              autoComplete="username"
            />
          </div>
          {errors.username && <div className="errMsg">⚠ {errors.username}</div>}
        </div>

        {/* --- Password --- */}
        <div className="fieldGroup">
          <label className="fieldLabel" htmlFor="login-password">Password</label>
          <div className="fieldWrap">
            <span className="fieldIcon">🔑</span>
            <input
              id="login-password"
              className={`fieldInput${errors.password ? ' hasError' : ''}`}
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              value={form.password}
              onChange={e => setField('password', e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="eyeBtn"
              onClick={() => setShowPw(s => !s)}
              aria-label={showPw ? 'Hide password' : 'Show password'}
            >
              {showPw ? '🙈' : '👁'}
            </button>
          </div>
          {errors.password && <div className="errMsg">⚠ {errors.password}</div>}
        </div>

        {/* --- Submit --- */}
        <button type="submit" className="submitBtn" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In →'}
        </button>

        {/* --- Switch to Register --- */}
        <div className="switchLink">
          New here?{' '}
          <button type="button" className="linkBtn" onClick={onSwitchToRegister}>
            Create an account
          </button>
        </div>
      </form>
    </>
  )
}
// ============================================================
// OtpStep.jsx
// Renders the 6-box OTP entry after registration form submit.
// Props:
//   username  (string) — needed for OTP verification
//   onResend  (func)   — trigger resend OTP
//   onBack    (func)   — go back to registration form
//   onSuccess (func)   — optional (switch to login after success)
// ============================================================

import { useState, useRef } from 'react'
import '../styles/Auth.css'

export default function OtpStep({ username, onResend, onBack, onSuccess }) {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRefs = useRef([])

  // Handle typing into an OTP box
  const handleChange = (index, value) => {
    if (!/^\d?$/.test(value)) return

    const next = [...otp]
    next[index] = value
    setOtp(next)
    setOtpError('')

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  // Handle paste
  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, 6)

    const next = [...otp]
    pasted.split('').forEach((ch, i) => {
      next[i] = ch
    })

    setOtp(next)

    const lastIdx = Math.min(pasted.length, 5)
    inputRefs.current[lastIdx]?.focus()
  }

  // 🔥 VERIFY OTP API CALL
  const handleVerify = async (e) => {
    e.preventDefault()

    const code = otp.join('')

    if (code.length < 6) {
      setOtpError('Please enter all 6 digits')
      return
    }

    try {
      setLoading(true)

      const response = await fetch(
        "http://localhost:5000/api/auth/verify-otp",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username,
            otp: code
          })
        }
      )

      const data = await response.json()

      if (data.success) {
        alert("Registration successful 🎉 Please login.")

        // Reset OTP boxes
        setOtp(['', '', '', '', '', ''])

        // If parent passed onSuccess (switch to login)
        if (onSuccess) {
          onSuccess()
        }
      } else {
        setOtpError(data.message || "Invalid or expired OTP")
      }

    } catch (error) {
      console.error("OTP verification error:", error)
      setOtpError("Server error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleVerify} noValidate>
      <div className="sectionTitle">Verify OTP</div>
      <div className="sectionSub">
        Enter the 6-digit code sent to your Telegram
      </div>

      <div className="otpInfoBox">
        📩 OTP is sent. Please enter the OTP to proceed with the registration.
      </div>

      <label className="fieldLabel otpCenteredLabel">
        Enter 6-digit OTP
      </label>

      <div className="otpRow" onPaste={handlePaste}>
        {otp.map((val, i) => (
          <input
            key={i}
            ref={el => inputRefs.current[i] = el}
            className={`otpBox${val ? ' otpFilled' : ''}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={val}
            onChange={e => handleChange(i, e.target.value)}
            onKeyDown={e => handleKeyDown(i, e)}
            aria-label={`OTP digit ${i + 1}`}
          />
        ))}
      </div>

      {otpError && (
        <div className="errMsg" style={{ justifyContent: 'center' }}>
          ⚠ {otpError}
        </div>
      )}

      <button
        type="submit"
        className="submitBtn"
        disabled={loading}
      >
        {loading ? "Verifying..." : "Verify & Register ✓"}
      </button>

      <div className="resendRow">
        Didn't receive the code?{' '}
        <button
          type="button"
          className="resendBtn"
          onClick={onResend}
          disabled={loading}
        >
          Resend OTP
        </button>
      </div>

      <div className="switchLink">
        <button
          type="button"
          className="linkBtn"
          onClick={onBack}
          disabled={loading}
        >
          ← Back to form
        </button>
      </div>
    </form>
  )
}
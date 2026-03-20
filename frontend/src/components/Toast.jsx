import { useState, useEffect } from 'react'
import '../styles/Toast.css'

export default function Toast({ title = 'OTP Sent!', message, icon = '✉️', onHide }) {
  const [exiting, setExiting] = useState(false)

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onHide, 350)   // wait for exit animation
    }, 5000)
    return () => clearTimeout(timer)
  }, [onHide])

  const handleClose = () => {
    setExiting(true)
    setTimeout(onHide, 350)
  }

  return (
    <div className="toastWrap">
      <div className={`toast${exiting ? ' exiting' : ''}`} role="alert" aria-live="polite">
        <span className="toastIcon">{icon}</span>
        <div className="toastBody">
          <div className="toastTitle">{title}</div>
          <div className="toastMsg">{message}</div>
        </div>
        <button className="toastClose" onClick={handleClose} aria-label="Dismiss">✕</button>
      </div>
    </div>
  )
}

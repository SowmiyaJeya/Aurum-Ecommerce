import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Checkout.css'

// ─── Tiny helper: format INR ────────────────────────────────────────────────
const fmt = n =>
  n != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
    : '—'

// ─── Convert raw hex/buffer image to object URL ──────────────────────────────
function bufferToObjectUrl(imageData) {
  if (!imageData) return null
  try {
    let bytes
    if (typeof imageData === 'string') {
      const hex = imageData.replace(/^\\x|^0x/i, '').replace(/\\x/g, '')
      const arr = []
      for (let i = 0; i < hex.length; i += 2) arr.push(parseInt(hex.slice(i, i + 2), 16))
      bytes = new Uint8Array(arr)
    } else if (imageData?.data) {
      bytes = new Uint8Array(imageData.data)
    } else if (imageData instanceof Uint8Array) {
      bytes = imageData
    } else {
      return null
    }
    if (!bytes || bytes.length < 4) return null
    const m =
      bytes[0] === 0xff && bytes[1] === 0xd8 ? 'image/jpeg' :
      bytes[0] === 0x89 && bytes[1] === 0x50 ? 'image/png'  :
      bytes[0] === 0x47 && bytes[1] === 0x49 ? 'image/gif'  : 'image/jpeg'
    return URL.createObjectURL(new Blob([bytes], { type: m }))
  } catch { return null }
}

function useObjectUrl(imageData) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!imageData) { setSrc(null); return }
    const u = bufferToObjectUrl(imageData)
    setSrc(u)
    return () => { if (u) URL.revokeObjectURL(u) }
  }, [imageData])
  return src
}

function ItemThumb({ imageData }) {
  const src = useObjectUrl(imageData)
  if (src) return <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
  return <span>📦</span>
}

// ─── Field validation ────────────────────────────────────────────────────────
function validate(fields) {
  const errors = {}
  if (!fields.fullName.trim())        errors.fullName    = 'Full name is required'
  else if (fields.fullName.trim().length < 2) errors.fullName = 'Enter a valid name'

  if (!fields.email.trim())           errors.email       = 'Email is required'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) errors.email = 'Enter a valid email'

  if (!fields.phone.trim())           errors.phone       = 'Phone number is required'
  else if (!/^\d{10}$/.test(fields.phone.replace(/\s/g, ''))) errors.phone = 'Enter a valid 10-digit number'

  if (!fields.address1.trim())        errors.address1    = 'Address is required'
  if (!fields.city.trim())            errors.city        = 'City is required'
  if (!fields.state.trim())           errors.state       = 'State is required'
  if (!fields.pinCode.trim())         errors.pinCode     = 'PIN code is required'
  else if (!/^\d{6}$/.test(fields.pinCode)) errors.pinCode = 'Enter a valid 6-digit PIN'
  if (!fields.country.trim())         errors.country     = 'Country is required'

  return errors
}

// ─── Indian states list ──────────────────────────────────────────────────────
const INDIA_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu',
  'Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry',
]

// ─── Success modal ───────────────────────────────────────────────────────────
function SuccessModal({ orderId, onContinue }) {
  return (
    <div className="checkout-success-overlay">
      <div className="checkout-success-box">
        <div className="success-check-wrap">
          <svg className="success-check-svg" viewBox="0 0 40 40">
            <path d="M8 21 L17 30 L32 14" />
          </svg>
        </div>
        <div className="success-title">Order Placed! 🎉</div>
        <p className="success-sub">
          Thank you for shopping with Aurum. Your order has been confirmed
          and will be delivered soon.
        </p>
        <div className="success-order-id">ORDER #{orderId}</div>
        <button className="success-continue-btn" onClick={onContinue}>
          ← Continue Shopping
        </button>
      </div>
    </div>
  )
}

// ─── Main Checkout component ─────────────────────────────────────────────────
export default function Checkout({ cart: cartProp, onBack: onBackProp, onSuccess: onSuccessProp }) {
  const navigate = useNavigate()

  // ── Read cart: prefer prop (legacy in-app usage), else localStorage ────────
  const cart = cartProp && cartProp.length > 0
    ? cartProp
    : (() => {
        try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
      })()

  // ── Navigation helpers — work both as prop callbacks and via router ─────────
  const handleBack = () => {
    if (onBackProp) { onBackProp(); return }
    navigate('/lists')
  }

  const handleSuccessContinue = () => {
    localStorage.removeItem('cart')           // clear persisted cart
    setSuccess(false)
    if (onSuccessProp) { onSuccessProp(); return }
    navigate('/lists')
  }

  // ── Pre-fill from stored user ──────────────────────────────────────────────
  const storedUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')) || {} } catch { return {} }
  })()

  const [fields, setFields] = useState({
    fullName : storedUser.name || storedUser.username || '',
    email    : storedUser.email    || '',
    phone    : storedUser.phone    || '',
    address1 : storedUser.address  || '',
    address2 : '',
    city     : storedUser.city     || '',
    state    : storedUser.state    || '',
    pinCode  : storedUser.pin_code || '',
    country  : storedUser.country  || 'India',
  })
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const isAutoFilled = !!storedUser.email

  // Derived totals
  const subtotal       = cart.reduce((s, i) => s + (i.price || 0), 0)
  const deliveryCharge = 0
  const total          = subtotal + deliveryCharge

  const set = (key, val) => {
    setFields(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleBlur = key => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const errs = validate({ ...fields })
    setErrors(prev => ({ ...prev, [key]: errs[key] }))
  }

  const handleSubmit = useCallback(async () => {
    const allTouched = Object.keys(fields).reduce((a, k) => ({ ...a, [k]: true }), {})
    setTouched(allTouched)
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      // Replace with your real order endpoint:
      // const res  = await fetch('http://localhost:5000/placeOrder', { method:'POST', ... })
      // const json = await res.json()
      await new Promise(r => setTimeout(r, 1400))
      const fakeOrderId = `AUR${Date.now().toString().slice(-8).toUpperCase()}`
      setOrderId(fakeOrderId)
      setSuccess(true)
    } catch {
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [fields])

  // ── Empty cart guard ───────────────────────────────────────────────────────
  if (cart.length === 0 && !success) {
    return (
      <div className="checkout-page">
        <div className="checkout-title-bar">
          <h2 className="checkout-title-text">Checkout</h2>
          <div className="checkout-breadcrumb">
            <span className="bc-link" onClick={handleBack}>Home</span>
            <span className="bc-sep">/</span>
            <span className="bc-current">Checkout</span>
          </div>
        </div>
        <div className="checkout-empty">
          <div className="checkout-empty-icon">🛒</div>
          <div className="checkout-empty-title">Your cart is empty</div>
          <p className="checkout-empty-sub">Add some products before checking out.</p>
          <button className="checkout-empty-btn" onClick={handleBack}>← Back to Products</button>
        </div>
      </div>
    )
  }

  // ── Input props factory ────────────────────────────────────────────────────
  const inp = (key, extra = {}) => ({
    className : `form-input${errors[key] && touched[key] ? ' error' : ''}${isAutoFilled && fields[key] ? ' autofilled' : ''}`,
    value     : fields[key],
    onChange  : e => set(key, e.target.value),
    onBlur    : () => handleBlur(key),
    ...extra,
  })

  return (
    <div className="checkout-page">
      {success && <SuccessModal orderId={orderId} onContinue={handleSuccessContinue} />}

      {/* ── Page title ────────────────────────────────────────────── */}
      <div className="checkout-title-bar">
        <h2 className="checkout-title-text">Checkout</h2>
        <div className="checkout-breadcrumb">
          <span className="bc-link" onClick={handleBack}>Home</span>
          <span className="bc-sep">/</span>
          <span className="bc-link" onClick={handleBack}>Products</span>
          <span className="bc-sep">/</span>
          <span className="bc-current">Checkout</span>
        </div>
      </div>

      {/* ── Step indicator ────────────────────────────────────────── */}
      <div className="checkout-steps">
        {[
          { label: 'Cart',     num: 1, state: 'done'   },
          { label: 'Details',  num: 2, state: 'active'  },
          { label: 'Confirm',  num: 3, state: ''        },
        ].map((s, i) => (
          <div key={s.label} className={`checkout-step ${s.state}`} style={{ animationDelay: `${i * 0.08}s` }}>
            <div className="step-circle">
              {s.state === 'done'
                ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 7.5 L5.5 10.5 L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
                : s.num
              }
            </div>
            <span className="step-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── Two-column body ───────────────────────────────────────── */}
      <div className="checkout-body">

        {/* ══════════════════════════════════════════════════════════
            CARD 1 — Personal Details
        ═══════════════════════════════════════════════════════════ */}
        <div className="checkout-card checkout-details-card">
          <div className="card-header">
            <div className="card-header-icon green">👤</div>
            <div className="card-header-text">
              <div className="card-header-title">Personal &amp; Delivery Details</div>
              <div className="card-header-sub">All fields marked <span style={{ color:'#e03030' }}>*</span> are required</div>
            </div>
          </div>

          <div className="card-body">
            {isAutoFilled && (
              <div className="autofill-banner">
                <span className="autofill-icon">⚡</span>
                We've pre-filled your details from your account. Please verify before proceeding.
              </div>
            )}

            <div className="section-label">Personal Information</div>

            <div className="form-row full">
              <div className="form-group">
                <label className="form-label">Full Name <span className="req">*</span></label>
                <input {...inp('fullName')} placeholder="e.g. Arjun Sharma" />
                {errors.fullName && touched.fullName && <span className="form-error">⚠ {errors.fullName}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email Address <span className="req">*</span></label>
                <input {...inp('email')} type="email" placeholder="you@example.com" />
                {errors.email && touched.email && <span className="form-error">⚠ {errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number <span className="req">*</span></label>
                <div className="phone-input-wrap">
                  <span className="phone-prefix">🇮🇳 +91</span>
                  <input
                    className={`form-input${errors.phone && touched.phone ? ' error' : ''}${isAutoFilled && fields.phone ? ' autofilled' : ''}`}
                    value={fields.phone}
                    onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onBlur={() => handleBlur('phone')}
                    placeholder="98765 43210"
                    maxLength={10}
                    inputMode="numeric"
                  />
                </div>
                {errors.phone && touched.phone && <span className="form-error">⚠ {errors.phone}</span>}
              </div>
            </div>

            <div className="form-divider" />

            <div className="section-label">Delivery Address</div>

            <div className="form-row full">
              <div className="form-group">
                <label className="form-label">Address Line 1 <span className="req">*</span><span className="opt"> (House / Street)</span></label>
                <input {...inp('address1')} placeholder="e.g. 42, MG Road" />
                {errors.address1 && touched.address1 && <span className="form-error">⚠ {errors.address1}</span>}
              </div>
            </div>

            <div className="form-row full">
              <div className="form-group">
                <label className="form-label">Address Line 2 <span className="opt">(optional — Apartment / Landmark)</span></label>
                <input {...inp('address2')} placeholder="e.g. Near City Mall, 3rd Floor" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">City <span className="req">*</span></label>
                <input {...inp('city')} placeholder="e.g. Chennai" />
                {errors.city && touched.city && <span className="form-error">⚠ {errors.city}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">State <span className="req">*</span></label>
                <select
                  className={`form-input form-select${errors.state && touched.state ? ' error' : ''}${isAutoFilled && fields.state ? ' autofilled' : ''}`}
                  value={fields.state}
                  onChange={e => set('state', e.target.value)}
                  onBlur={() => handleBlur('state')}
                >
                  <option value="">Select state…</option>
                  {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                {errors.state && touched.state && <span className="form-error">⚠ {errors.state}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">PIN Code <span className="req">*</span></label>
                <input
                  {...inp('pinCode')}
                  placeholder="e.g. 600001"
                  maxLength={6}
                  inputMode="numeric"
                  onChange={e => set('pinCode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                />
                {errors.pinCode && touched.pinCode && <span className="form-error">⚠ {errors.pinCode}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Country <span className="req">*</span></label>
                <select
                  className={`form-input form-select${errors.country && touched.country ? ' error' : ''}${isAutoFilled && fields.country ? ' autofilled' : ''}`}
                  value={fields.country}
                  onChange={e => set('country', e.target.value)}
                  onBlur={() => handleBlur('country')}
                >
                  <option value="India">India</option>
                  <option value="USA">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="UAE">UAE</option>
                  <option value="Canada">Canada</option>
                  <option value="Australia">Australia</option>
                  <option value="Singapore">Singapore</option>
                </select>
                {errors.country && touched.country && <span className="form-error">⚠ {errors.country}</span>}
              </div>
            </div>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            CARD 2 — Order Summary
        ═══════════════════════════════════════════════════════════ */}
        <div className="checkout-card checkout-order-card">
          <div className="card-header">
            <div className="card-header-icon yellow">🛒</div>
            <div className="card-header-text">
              <div className="card-header-title">Order Summary</div>
              <div className="card-header-sub">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</div>
            </div>
          </div>

          <div className="card-body">
            <div className="section-label">Items</div>
            <div style={{ marginBottom: 4 }}>
              {cart.map((item, i) => (
                <div className="order-item" key={item.id} style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="order-item-thumb">
                    {item.firstImage ? <ItemThumb imageData={item.firstImage} /> : <span>📦</span>}
                  </div>
                  <div className="order-item-info">
                    <div className="order-item-name" title={item.name}>{item.name}</div>
                    <div className="order-item-qty">Qty: 1</div>
                  </div>
                  <div className="order-item-price">{fmt(item.price)}</div>
                </div>
              ))}
            </div>

            <div className="section-label" style={{ marginTop: 18 }}>Price Details</div>
            <div className="price-breakdown">
              <div className="price-row">
                <span>Subtotal ({cart.length} item{cart.length !== 1 ? 's' : ''})</span>
                <span className="val">{fmt(subtotal)}</span>
              </div>
              <div className="price-row">
                <span>Delivery Charges</span>
                <span className="val free">FREE</span>
              </div>
              {deliveryCharge > 0 && (
                <div className="price-row">
                  <span>Tax &amp; Fees</span>
                  <span className="val">{fmt(deliveryCharge)}</span>
                </div>
              )}
              <div className="price-divider" />
              <div className="price-total-row">
                <span className="price-total-label">Total Payable</span>
                <span className="price-total-amount">{fmt(total)}</span>
              </div>
            </div>

            <button className="checkout-cta" onClick={handleSubmit} disabled={loading}>
              {loading
                ? <><span className="cta-spinner" /> Processing…</>
                : <><span style={{ fontSize: 17 }}>✦</span> Confirm Order — {fmt(total)}</>
              }
            </button>
            <button className="checkout-back-btn" onClick={handleBack}>
              ← Back to Cart
            </button>

            <div className="trust-badges">
              {[
                { icon: '🔒', text: 'Secure &amp; encrypted checkout' },
                { icon: '🚚', text: 'Free delivery on all orders'     },
                { icon: '↩',  text: 'Easy 30-day returns'             },
              ].map(b => (
                <div className="trust-badge" key={b.text}>
                  <div className="trust-badge-icon">{b.icon}</div>
                  <span dangerouslySetInnerHTML={{ __html: b.text }} />
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
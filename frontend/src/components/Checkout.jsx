import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Checkout.css'

// ─── Tiny helper: format INR ────────────────────────────────────────────────
const fmt = n =>
  n != null
    ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
    : '—'

// ─── Detect mime type from first bytes ────────────────────────────────────── 
function detectMime(bytes) {
  if (bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg'
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png'
  if (bytes[0] === 0x47 && bytes[1] === 0x49) return 'image/gif'
  if (bytes[0] === 0x52 && bytes[1] === 0x49) return 'image/webp'
  return 'image/jpeg'
}

// ─── Resolve any image format to a renderable src string ────────────────────
function resolveImageSrc(imageData) {
  if (!imageData) return null

  // Already a usable URL or base64 data URI
  if (typeof imageData === 'string') {
    const trimmed = imageData.trim()
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
      return trimmed
    }
    if (trimmed.startsWith('data:image')) {
      return trimmed
    }
    // Raw base64 (no data: prefix)
    if (/^[A-Za-z0-9+/=]+$/.test(trimmed) && trimmed.length > 100) {
      return `data:image/jpeg;base64,${trimmed}`
    }
    // Hex string → bytes → blob URL (handled below via buffer path)
  }

  // Buffer-like object: { type:'Buffer', data:[...] } or { data:[...] }
  if (imageData?.type === 'Buffer' && Array.isArray(imageData.data)) {
    try {
      const bytes = new Uint8Array(imageData.data)
      if (bytes.length < 4) return null
      return URL.createObjectURL(new Blob([bytes], { type: detectMime(bytes) }))
    } catch { return null }
  }

  if (imageData?.data && (Array.isArray(imageData.data) || imageData.data instanceof ArrayBuffer)) {
    try {
      const bytes = new Uint8Array(imageData.data)
      if (bytes.length < 4) return null
      return URL.createObjectURL(new Blob([bytes], { type: detectMime(bytes) }))
    } catch { return null }
  }

  // Raw Uint8Array / ArrayBuffer
  if (imageData instanceof Uint8Array || imageData instanceof ArrayBuffer) {
    try {
      const bytes = imageData instanceof ArrayBuffer ? new Uint8Array(imageData) : imageData
      if (bytes.length < 4) return null
      return URL.createObjectURL(new Blob([bytes], { type: detectMime(bytes) }))
    } catch { return null }
  }

  // Hex string fallback
  if (typeof imageData === 'string') {
    try {
      const hex = imageData.replace(/^0x/i, '').replace(/[^0-9a-fA-F]/g, '')
      if (hex.length < 8) return null
      const arr = []
      for (let i = 0; i < hex.length; i += 2) arr.push(parseInt(hex.slice(i, i + 2), 16))
      const bytes = new Uint8Array(arr)
      return URL.createObjectURL(new Blob([bytes], { type: detectMime(bytes) }))
    } catch { return null }
  }

  return null
}

// ─── Hook: resolves image and revokes blob URLs on cleanup ──────────────────
function useResolvedImage(imageData) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    const result = resolveImageSrc(imageData)
    setSrc(result)
    // Only revoke if we created a blob URL (not a plain string URL from backend)
    return () => {
      if (result && result.startsWith('blob:')) URL.revokeObjectURL(result)
    }
  }, [imageData])
  return src
}

// ─── Item thumbnail with fallback ────────────────────────────────────────────
function ItemThumb({ imageData }) {
  const src = useResolvedImage(imageData)
  const [errored, setErrored] = useState(false)

  if (src && !errored) {
    return (
      <img
        src={src}
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        onError={() => setErrored(true)}
      />
    )
  }
  return <span style={{ fontSize: 22 }}>📦</span>
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

// ─── Payment validation ──────────────────────────────────────────────────────
function validatePayment(method, payFields) {
  const errors = {}
  if (method === 'card') {
    const raw = payFields.cardNumber.replace(/\s/g, '')
    if (!raw) errors.cardNumber = 'Card number is required'
    else if (!/^\d{16}$/.test(raw)) errors.cardNumber = 'Enter a valid 16-digit card number'
    if (!payFields.cardName.trim()) errors.cardName = 'Name on card is required'
    if (!payFields.expiry.trim()) errors.expiry = 'Expiry is required'
    else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(payFields.expiry)) errors.expiry = 'Use MM/YY format'
    if (!payFields.cvv.trim()) errors.cvv = 'CVV is required'
    else if (!/^\d{3,4}$/.test(payFields.cvv)) errors.cvv = 'Enter 3 or 4 digit CVV'
  }
  // COD has no required fields
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

// ─── Common countries for datalist suggestions ───────────────────────────────
const COUNTRY_SUGGESTIONS = [
  'India','United States','United Kingdom','UAE','Canada','Australia','Singapore',
  'Germany','France','Japan','China','Brazil','South Africa','New Zealand',
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
          Thank you for shopping with Shiva Systems. Your order has been confirmed
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

// ─── Payment Step component ──────────────────────────────────────────────────
function PaymentStep({ total, cart, fields, onBack, onSuccess }){
  const [method, setMethod]     = useState('card')   // 'card' | 'cod'
  const [payFields, setPayFields] = useState({
    cardNumber : '',
    cardName   : '',
    expiry     : '',
    cvv        : '',
    customer: {
  username: fields.fullName,
  email: fields.email,
  mobile: fields.phone,
  address_line1: fields.address1,
  address_line2: fields.address2,
  city: fields.city,
  state: fields.state,
  pincode: fields.pinCode,
  country: fields.country
}
  })
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [showCvv, setShowCvv] = useState(false)

  const setF = (key, val) => {
    setPayFields(prev => ({ ...prev, [key]: val }))
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }))
  }

  const handleBlur = key => {
    setTouched(prev => ({ ...prev, [key]: true }))
    const errs = validatePayment(method, { ...payFields })
    setErrors(prev => ({ ...prev, [key]: errs[key] }))
  }

  // Format card number with spaces every 4 digits
  const formatCard = val => {
    const digits = val.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  // Format expiry MM/YY
  const formatExpiry = val => {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
    return digits
  }

  const inp = (key, extra = {}) => ({
    className : `form-input${errors[key] && touched[key] ? ' error' : ''}`,
    value     : payFields[key],
    onBlur    : () => handleBlur(key),
    ...extra,
  })

  const handlePay = useCallback(async () => {
  const allTouched = Object.keys(payFields).reduce((a, k) => ({ ...a, [k]: true }), {})
  setTouched(allTouched)

  const errs = validatePayment(method, payFields)
  if (Object.keys(errs).length > 0) {
    setErrors(errs)
    return
  }

  setLoading(true)

  try {
    // 🔹 Get user from localStorage
    // const user = JSON.parse(localStorage.getItem('user')) || {}

    // 🔹 Prepare items from cart
    const items = cart.map(item => ({
      product_id: item.id,
      quantity: 1,
      price: item.price
    }))
const [month, year] = payFields.expiry.split('/')

const formattedExpiry = `20${year}-${month}-01`  // YYYY-MM-DD
    // 🔹 Prepare request body
    const payload = {
  type: "createOrder",
  usercode: JSON.parse(localStorage.getItem('user'))?.usercode, // only for usercode
  total_amount: total,

  items: cart.map(item => ({
    product_id: item.id,
    quantity: 1,
    price: item.price
  })),

  customer: {
    username: fields.fullName,
    email: fields.email,
    mobile: fields.phone,
    address_line1: fields.address1,
    address_line2: fields.address2,
    city: fields.city,
    state: fields.state,
    pincode: fields.pinCode,
    country: fields.country
  },

  payment:
    method === "cod"
      ? { method: "COD" }
      : {
          method: "CARD",
          cardholder_name: payFields.cardName,
          expiry_date: formattedExpiry,
          cvv: Number(payFields.cvv)
        }
}

    // 🔹 API CALL
    const res = await fetch("http://localhost:5000/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    const data = await res.json()

    if (!data.success) {
      throw new Error(data.message || "Order failed")
    }

    // ✅ SUCCESS
    onSuccess(data.order_id)

  } catch (err) {
    console.error(err)
    alert("Order failed. Please try again.")
  } finally {
    setLoading(false)
  }

}, [method, payFields, cart, total, onSuccess])

  const payBtnLabel = method === 'cod' ? 'Place COD Order' : 'Pay with Card'

  return (
    <div className="checkout-card checkout-details-card payment-step-card">
      <div className="card-header">
        <div className="card-header-icon blue">💳</div>
        <div className="card-header-text">
          <div className="card-header-title">Payment Details</div>
          <div className="card-header-sub">Choose your preferred payment method</div>
        </div>
      </div>

      <div className="card-body">

        {/* ── Payment method tabs ──────────────────────────────── */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[
            { id: 'card', label: 'Credit / Debit Card', icon: '💳' },
            { id: 'cod',  label: 'Cash on Delivery',    icon: '🚚' },
          ].map(m => {
            const isActive = method === m.id
            return (
              <button
                key={m.id}
                onClick={() => { setMethod(m.id); setErrors({}); setTouched({}) }}
                type="button"
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  borderRadius: 10,
                  border: isActive ? '2px solid #1a7a4a' : '2px solid #d0d0d0',
                  background: isActive ? '#1a7a4a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#555555',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: 14,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? '0 2px 10px rgba(26,122,74,0.25)' : 'none',
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 18, lineHeight: 1 }}>{m.icon}</span>
                {m.label}
              </button>
            )
          })}
        </div>

        {/* ── Card ────────────────────────────────────────────── */}
        {method === 'card' && (
          <div className="payment-fields">
            <div className="payment-info-banner">
              <span>🔒</span> Your card details are encrypted and secure.
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="form-label">Card Number <span className="req">*</span></label>
              <div className="card-number-wrap">
                <input
                  {...inp('cardNumber')}
                  placeholder="1234 5678 9012 3456"
                  inputMode="numeric"
                  maxLength={19}
                  onChange={e => setF('cardNumber', formatCard(e.target.value))}
                />
                <span className="card-network-badge">{
                  (() => {
                    const d = payFields.cardNumber.replace(/\s/g, '')
                    if (d.startsWith('4')) return 'VISA'
                    if (/^5[1-5]/.test(d)) return 'MC'
                    if (d.startsWith('6')) return 'RuPay'
                    if (d.startsWith('3')) return 'AMEX'
                    return '💳'
                  })()
                }</span>
              </div>
              {errors.cardNumber && touched.cardNumber && <span className="form-error">⚠ {errors.cardNumber}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Name on Card <span className="req">*</span></label>
              <input
                {...inp('cardName')}
                placeholder="e.g. Arjun Sharma"
                onChange={e => setF('cardName', e.target.value)}
              />
              {errors.cardName && touched.cardName && <span className="form-error">⚠ {errors.cardName}</span>}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expiry Date <span className="req">*</span></label>
                <input
                  {...inp('expiry')}
                  placeholder="MM/YY"
                  inputMode="numeric"
                  maxLength={5}
                  onChange={e => setF('expiry', formatExpiry(e.target.value))}
                />
                {errors.expiry && touched.expiry && <span className="form-error">⚠ {errors.expiry}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">CVV <span className="req">*</span></label>
                <div className="cvv-input-wrap">
                  <input
                    {...inp('cvv')}
                    placeholder="•••"
                    type={showCvv ? 'text' : 'password'}
                    inputMode="numeric"
                    maxLength={4}
                    onChange={e => setF('cvv', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                  <button
                    type="button"
                    className="cvv-toggle"
                    onClick={() => setShowCvv(v => !v)}
                    tabIndex={-1}
                  >{showCvv ? '🙈' : '👁'}</button>
                </div>
                {errors.cvv && touched.cvv && <span className="form-error">⚠ {errors.cvv}</span>}
              </div>
            </div>
          </div>
        )}

        {/* ── COD ─────────────────────────────────────────────── */}
        {method === 'cod' && (
          <div className="payment-fields">
            <div className="cod-info-box">
              <div className="cod-info-icon">🚚</div>
              <div>
                <div className="cod-info-title">Pay when your order arrives</div>
                <p className="cod-info-sub">
                  Keep exact change ready. Our delivery partner accepts cash only.
                  A confirmation SMS will be sent to your registered phone number.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Amount summary ───────────────────────────────────── */}
        <div className="payment-amount-summary">
          <span className="payment-amount-label">Amount to pay</span>
          <span className="payment-amount-value">{fmt(total)}</span>
        </div>

        {/* ── Actions ──────────────────────────────────────────── */}
        <button className="checkout-cta" onClick={handlePay} disabled={loading}>
          {loading
            ? <><span className="cta-spinner" /> Processing…</>
            : <><span style={{ fontSize: 17 }}>✦</span> {payBtnLabel} — {fmt(total)}</>
          }
        </button>

        {/* Back button styled as a secondary CTA to match the UI */}
        <button
          onClick={onBack}
          disabled={loading}
          type="button"
          style={{
            width: '100%',
            padding: '14px',
            marginTop: 10,
            borderRadius: 10,
            border: '2px solid #1a7a4a',
            background: 'transparent',
            color: '#1a7a4a',
            fontWeight: 600,
            fontSize: 15,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
            transition: 'all 0.18s ease',
            fontFamily: 'inherit',
            letterSpacing: '0.01em',
          }}
        >
          ← Back to Details
        </button>

        <div className="trust-badges">
          {[
            { icon: '🔒', text: '256-bit SSL encrypted' },
            { icon: '🛡', text: 'PCI DSS compliant'     },
            { icon: '↩',  text: 'Easy 30-day returns'   },
          ].map(b => (
            <div className="trust-badge" key={b.text}>
              <div className="trust-badge-icon">{b.icon}</div>
              <span>{b.text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ─── Main Checkout component ─────────────────────────────────────────────────
export default function Checkout({ cart: cartProp, onBack: onBackProp, onSuccess: onSuccessProp }) {
  const navigate = useNavigate()

  const cart = cartProp && cartProp.length > 0
    ? cartProp
    : (() => {
        try { return JSON.parse(localStorage.getItem('cart') || '[]') } catch { return [] }
      })()

  // step: 'details' | 'payment' | 'success'
  const [step, setStep] = useState('details')
  const [orderId, setOrderId] = useState(null)

  const handleBack = () => {
    if (step === 'payment') { setStep('details'); return }
    if (onBackProp) { onBackProp(); return }
    navigate('/lists')
  }

  const handleSuccessContinue = () => {
    localStorage.removeItem('cart')
    setStep('details')
    if (onSuccessProp) { onSuccessProp(); return }
    navigate('/lists')
  }

const storedUser = (() => {
  try {
    const enriched = localStorage.getItem('checkoutUser')
    if (enriched) {
      localStorage.removeItem('checkoutUser')
      return JSON.parse(enriched)
    }
    return JSON.parse(localStorage.getItem('user')) || {}
  } catch { return {} }
})()

const [fields, setFields] = useState(() => {
  try {
    const enriched = localStorage.getItem('checkoutUser')
    if (enriched) {
      localStorage.removeItem('checkoutUser')
      const u = JSON.parse(enriched)
      return {
        fullName : u.name     || u.username || '',
        email    : u.email    || '',
        phone    : u.mobile   || u.phone    || '',
        address1 : u.address  || '',
        address2 : '',
        city     : u.city     || '',
        state    : u.state    || '',
        pinCode  : u.pin_code || '',
        country  : u.country  || 'India',
      }
    }
  } catch {}

  // fallback to regular user
  try {
    const u = JSON.parse(localStorage.getItem('user')) || {}
    return {
      fullName : u.name     || u.username || '',
      email    : u.email    || '',
      phone    : u.mobile   || u.phone    || '',
      address1 : u.address  || '',
      address2 : '',
      city     : u.city     || '',
      state    : u.state    || '',
      pinCode  : u.pin_code || '',
      country  : u.country  || 'India',
    }
  } catch {}

  return {
    fullName:'', email:'', phone:'', address1:'',
    address2:'', city:'', state:'', pinCode:'', country:'India',
  }
})

// Still needed for the isAutoFilled banner check
// const storedUser = (() => {
//   try { return JSON.parse(localStorage.getItem('user')) || {} } catch { return {} }
// })()
  const [errors,  setErrors]  = useState({})
  const [touched, setTouched] = useState({})

  const isAutoFilled = !!storedUser.email

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

  // Validate details and move to payment step
  const handleConfirm = useCallback(() => {
    const allTouched = Object.keys(fields).reduce((a, k) => ({ ...a, [k]: true }), {})
    setTouched(allTouched)
    const errs = validate(fields)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep('payment')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [fields])

  if (cart.length === 0 && step !== 'success') {
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

  const inp = (key, extra = {}) => ({
    className : `form-input${errors[key] && touched[key] ? ' error' : ''}${isAutoFilled && fields[key] ? ' autofilled' : ''}`,
    value     : fields[key],
    onChange  : e => set(key, e.target.value),
    onBlur    : () => handleBlur(key),
    ...extra,
  })

  // Step indicator config
  const stepConfig = [
    { label: 'Cart',     num: 1, state: 'done'   },
    { label: 'Details',  num: 2, state: step === 'details' ? 'active' : 'done' },
    { label: 'Payment',  num: 3, state: step === 'payment' ? 'active' : '' },
    { label: 'Confirm',  num: 4, state: '' },
  ]

  return (
    <div className="checkout-page">
      {step === 'success' && (
        <SuccessModal orderId={orderId} onContinue={handleSuccessContinue} />
      )}

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
        {stepConfig.map((s, i) => (
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

        {/* ── Left column: Details or Payment ─────────────────────── */}
        {step === 'details' && (
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
                      defaultValue={storedUser.mobile || storedUser.phone || ''}
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
                  {/* ── Country: free-text input with datalist suggestions ── */}
                  <label className="form-label">Country <span className="req">*</span></label>
                  <input
                    {...inp('country')}
                    list="country-suggestions"
                    placeholder="e.g. India"
                    autoComplete="country-name"
                  />
                  <datalist id="country-suggestions">
                    {COUNTRY_SUGGESTIONS.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {errors.country && touched.country && <span className="form-error">⚠ {errors.country}</span>}
                </div>
              </div>

            </div>
          </div>
        )}

        {step === 'payment' && (
        <PaymentStep
  total={total}
  cart={cart}
  fields={fields}   // ✅ VERY IMPORTANT
  onBack={() => setStep('details')}
  onSuccess={id => { setOrderId(id); setStep('success') }}
/>
        )}

        {/* ── Right column: Order Summary (always visible) ─────────── */}
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

            {/* Show action button only on details step */}
            {step === 'details' && (
              <>
                <button className="checkout-cta" onClick={handleConfirm}>
                  <span style={{ fontSize: 17 }}>✦</span> Confirm Order — {fmt(total)}
                </button>
                <button className="checkout-back-btn" onClick={handleBack}>
                  ← Back to Cart
                </button>
              </>
            )}

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
import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── Image buffer → data URL ─────────────────────────── */
function bufferToDataUrl(bufferObj) {
  if (!bufferObj) return null
  const raw = bufferObj.data ?? bufferObj
  if (!Array.isArray(raw) || raw.length === 0) return null
  try {
    const bytes  = new Uint8Array(raw)
    let binary   = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    return `data:image/jpeg;base64,${btoa(binary)}`
  } catch { return null }
}

/* ── helpers ─────────────────────────────────────────── */
const PAGE_SIZE = 5

function buildPages(total, current) {
  const last  = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const pages = []
  if (last <= 7) {
    for (let i = 1; i <= last; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(last - 1, current + 1); i++) pages.push(i)
  if (current < last - 2) pages.push('…')
  pages.push(last)
  return pages
}

function formatDate(iso) {
  if (!iso) return '—'
  const d    = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

/* ── Toast ───────────────────────────────────────────── */
let _toastId = 0
function useToasts() {
  const [toasts, setToasts] = useState([])
  const add = useCallback((msg, type = 'success') => {
    const id = ++_toastId
    setToasts(t => [...t, { id, msg, type }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])
  const remove = useCallback(id => setToasts(t => t.filter(x => x.id !== id)), [])
  return { toasts, add, remove }
}

/* ── useOrders hook ──────────────────────────────────── */
function useOrders() {
  const [orders, setOrders]             = useState([])
  const [ordersLoading, setLoading]     = useState(true)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage]   = useState(1)

  const fetchOrders = useCallback(async (page = 1) => {
  setLoading(true)
  try {
    const res = await fetch('http://localhost:5000/all-orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'displayAllOrders', page }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Failed to fetch orders.')
    const mapped = (json.data ?? []).map((o, i) => ({
      id:             o.order_id        ?? i + 1,
      order_id:       o.order_id        ?? i + 1,
      customer_name:  o.username        ?? '—',
      payment_method: o.method          ?? '—',
      total_amount:   parseFloat(o.total_amount ?? 0),
      status:         o.status_name     ?? 'Placed',  
      updated_at:     o.updated_at      ?? null,
      items:          o.items           ?? [],
    }))
    setOrders(mapped)
    setTotalRecords(json.total_orders ?? mapped.length)
    setCurrentPage(json.page ?? page)
  } catch {
    setOrders([]); setTotalRecords(0)
  } finally { setLoading(false) }
}, [])

useEffect(() => { fetchOrders(1) }, [fetchOrders])
return { orders, ordersLoading, totalRecords, currentPage, refetch: fetchOrders }
}
/* ── Status config ───────────────────────────────────── */
const STATUS_CONFIG = {
  Pending:    { dot: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.28)',  text: '#b45309' },
  Processing: { dot: '#3b82f6', bg: 'rgba(59,130,246,0.10)', border: 'rgba(59,130,246,0.28)',  text: '#1d4ed8' },
  Shipped:    { dot: '#8b5cf6', bg: 'rgba(139,92,246,0.10)', border: 'rgba(139,92,246,0.28)',  text: '#6d28d9' },
  Delivered:  { dot: '#22c55e', bg: 'rgba(34,197,94,0.10)',  border: 'rgba(34,197,94,0.25)',   text: '#16a34a' },
  Cancelled:  { dot: '#ef4444', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.22)',   text: '#dc2626' },
  Hold:       { dot: '#6b7280', bg: 'rgba(107,114,128,0.10)', border: 'rgba(107,114,128,0.25)', text: '#374151' },
  Placed:     { dot: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)',  text: '#b45309' },
  PLACED:     { dot: '#f59e0b', bg: 'rgba(245,158,11,0.10)', border: 'rgba(245,158,11,0.28)',  text: '#b45309' },
  Cancel:     { dot: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.22)', text: '#dc2626' },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG['Pending']
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {status}
    </span>
  )
}

/* ── Payment Method Badge ────────────────────────────── */
const METHOD_ICONS = { Cash: '💵', Card: '💳', CARD: '💳', UPI: '📲', Online: '🌐', Wallet: '👛' }
function MethodBadge({ method }) {
  const icon = METHOD_ICONS[method] ?? '💳'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 11px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', color: '#555' }}>
      <span style={{ fontSize: 13 }}>{icon}</span>
      {method}
    </span>
  )
}

/* ── canHold / canCancel helpers ─────────────────────── */
function canHold(status) {
  return ['Pending', 'Placed', 'PLACED', 'Processing'].includes(status)
}
function canCancel(status) {
  return !['Delivered', 'Cancelled','Cancel'].includes(status)
}

function HoldOrderModal({ order, onClose, onConfirm }) {
  const [note,   setNote]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
  setLoading(true)
  await onConfirm({ order_id: order.order_id, status: 'Hold', note })  // no reason
  setLoading(false)
}
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#f3f4f6', border: '1px solid rgba(107,114,128,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>⏸️</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>Put order on hold</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Order #{order.order_id} · {order.customer_name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', fontFamily: "'DM Sans', sans-serif" }}>
          {/* Order summary strip */}
          <div style={{ background: '#f9f8f6', borderRadius: 12, padding: '12px 16px', marginBottom: 20, border: '1px solid #efefef', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Amount</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Rs.{order.total_amount.toFixed(2)}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Payment</div>
              <MethodBadge method={order.payment_method} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Current Status</div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          <p style={{ fontSize: 13, color: '#777', lineHeight: 1.6, marginBottom: 18 }}>
            Placing this order on hold will pause any further processing. You can resume it at any time by updating the order status.
          </p>

          {/* Note textarea */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 7 }}>
              Additional note <span style={{ color: '#bbb', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Add an internal note about this hold…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 13, color: '#333', fontFamily: "'DM Sans', sans-serif", resize: 'vertical', outline: 'none' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid rgba(107,114,128,0.4)', background: '#f3f4f6', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#374151', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <span style={{ fontSize: 14, animation: 'spin 1s linear infinite', display: 'inline-block' }}>◈</span> : '⏸'}
            {loading ? 'Holding…' : 'Confirm hold'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Cancel Order Modal ──────────────────────────────── */
const CANCEL_REASONS = [
  'Customer requested cancellation',
  'Item out of stock',
  'Duplicate order',
  'Fraudulent order',
  'Delivery not possible',
  'Other',
]

function CancelOrderModal({ order, onClose, onConfirm }) {
  const [reason,  setReason]  = useState('')
  const [note,    setNote]    = useState('')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!reason) { setError('Please select a reason for cancellation.'); return }
    setError('')
    setLoading(true)
    await onConfirm({ order_id: order.order_id, status: 'Cancel', note })
    setLoading(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🚫</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>Cancel this order?</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Order #{order.order_id} · {order.customer_name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', fontFamily: "'DM Sans', sans-serif" }}>
          {/* Order summary strip */}
          <div style={{ background: '#f9f8f6', borderRadius: 12, padding: '12px 16px', marginBottom: 20, border: '1px solid #efefef', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Amount</div>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Rs.{order.total_amount.toFixed(2)}</span>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Payment</div>
              <MethodBadge method={order.payment_method} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Current Status</div>
              <StatusBadge status={order.status} />
            </div>
          </div>

          {/* Warning banner */}
          <div style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '10px 14px', marginBottom: 18, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span style={{ fontSize: 15, flexShrink: 0, marginTop: 1 }}>⚠️</span>
            <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.5, margin: 0 }}>
              This action <strong>cannot be undone.</strong> The order will be marked as Cancelled and the customer may be notified.
            </p>
          </div>

          {/* Reason dropdown */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 7 }}>
              Reason for cancellation <span style={{ color: '#ef4444', fontWeight: 600 }}>*</span>
            </label>
            <select
              value={reason}
              onChange={e => { setReason(e.target.value); setError('') }}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: `1px solid ${error ? '#ef4444' : '#e0e0e0'}`, fontSize: 13, color: reason ? '#333' : '#aaa', background: '#fff', fontFamily: "'DM Sans', sans-serif", outline: 'none', cursor: 'pointer' }}
            >
              <option value="">Select a reason…</option>
              {CANCEL_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            {error && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 5 }}>{error}</p>}
          </div>

          {/* Note textarea */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 7 }}>
              Additional note <span style={{ color: '#bbb', fontWeight: 400 }}></span>
            </label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Add an internal note about this cancellation…"
              style={{ width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #e0e0e0', fontSize: 13, color: '#333', fontFamily: "'DM Sans', sans-serif", resize: 'vertical', outline: 'none' }}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}
          >
            Go back
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#dc2626', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {loading ? <span style={{ fontSize: 14, animation: 'spin 1s linear infinite', display: 'inline-block' }}>◈</span> : '🚫'}
            {loading ? 'Cancelling…' : 'Yes, cancel order'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Order Items View Modal ──────────────────────────── */
function ViewOrderModal({ order, onClose, onHold, onCancel }) {
  const [items, setItems]               = useState([])
  const [mobile, setMobile]             = useState(null)
  const [itemsLoading, setItemsLoading] = useState(true)
  const [fetchError, setFetchError]     = useState(null)

  useEffect(() => {
    let cancelled = false
    setItemsLoading(true)
    setFetchError(null)
    fetch('http://localhost:5000/order-items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: order.order_id }),
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then(json => {
        if (cancelled) return
        setItems(json.items ?? [])
        setMobile(json.mobile ?? null)
      })
      .catch(err => { if (!cancelled) setFetchError(err.message || 'Failed to load items.') })
      .finally(() => { if (!cancelled) setItemsLoading(false) })
    return () => { cancelled = true }
  }, [order.order_id])

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 600, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#edf7f2', border: '1px solid rgba(26,122,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>📦</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>Order #{order.order_id}</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
                {order.customer_name} · {formatDate(order.updated_at)}
              </div>
              {mobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 4, fontSize: 12, color: '#1a7a5e', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>
                  <span>📞</span> {mobile}
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Summary strip */}
        <div style={{ padding: '14px 24px', background: '#f9f8f6', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: 24, flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Payment</div>
            <MethodBadge method={order.payment_method} />
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Status</div>
            <StatusBadge status={order.status} />
          </div>
          <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', marginBottom: 4 }}>Total</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: '#1a1a1a' }}>Rs.{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Items body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '4px 0' }}>
          {itemsLoading ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#aaa', fontFamily: "'DM Sans', sans-serif", fontSize: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28, animation: 'spin 1s linear infinite', display: 'inline-block', color: '#1a7a5e' }}>◈</span>
              <span>Loading items…</span>
            </div>
          ) : fetchError ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#b94a48', fontFamily: "'DM Sans', sans-serif", fontSize: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 28 }}>⚠</span>
              <div style={{ fontWeight: 600 }}>Failed to load items</div>
              <div style={{ color: '#aaa', fontSize: 13 }}>{fetchError}</div>
            </div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#aaa', fontFamily: "'DM Sans', sans-serif", fontSize: 15, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32 }}>◈</span>
              <div style={{ fontWeight: 600, color: '#555' }}>No items found</div>
              <div>This order has no item details.</div>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'DM Sans', sans-serif" }}>
              <thead>
                <tr style={{ background: '#f9f8f6', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', textAlign: 'left' }}>Product</th>
                  <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', textAlign: 'right' }}>Qty</th>
                  <th style={{ padding: '12px 20px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', textAlign: 'right' }}>Unit Price</th>
                  <th style={{ padding: '12px 24px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id ?? i} style={{ borderBottom: i < items.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                    <td style={{ padding: '13px 24px', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {(() => {
                          const imgUrl = bufferToDataUrl(item.product_image)
                          return imgUrl ? (
                            <img src={imgUrl} alt={item.product_name} style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e0e0e0' }} />
                          ) : (
                            <div style={{ width: 38, height: 38, borderRadius: 8, background: '#f5f5f5', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#ccc', flexShrink: 0 }}>🖼</div>
                          )
                        })()}
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>
                            {item.product_name ?? `Product #${item.product_id}`}
                          </div>
                          <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>ID: {item.product_id}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: 14, color: '#444', textAlign: 'right', verticalAlign: 'middle' }}>{item.quantity ?? 1}</td>
                    <td style={{ padding: '13px 20px', fontSize: 14, color: '#444', textAlign: 'right', verticalAlign: 'middle' }}>Rs.{parseFloat(item.price ?? 0).toFixed(2)}</td>
                    <td style={{ padding: '13px 24px', fontSize: 14, color: '#1a1a1a', fontWeight: 600, textAlign: 'right', verticalAlign: 'middle' }}>
                      Rs.{(parseFloat(item.price ?? 0) * (item.quantity ?? 1)).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f9f8f6', borderTop: '2px solid rgba(0,0,0,0.07)' }}>
                  <td colSpan={3} style={{ padding: '14px 20px', fontSize: 14, fontWeight: 700, color: '#555', textAlign: 'right', fontFamily: "'Syne', sans-serif" }}>Grand Total</td>
                  <td style={{ padding: '14px 24px', fontSize: 15, fontWeight: 700, color: '#1a7a5e', textAlign: 'right', fontFamily: "'Syne', sans-serif" }}>Rs.{order.total_amount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer — with Hold / Cancel shortcuts */}
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, gap: 10, flexWrap: 'wrap' }}>
          {/* Left: action shortcuts */}
          <div style={{ display: 'flex', gap: 8 }}>
            {canHold(order.status) && (
              <button
                onClick={() => { onClose(); onHold(order) }}
                style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(107,114,128,0.3)', background: '#f3f4f6', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                ⏸ Hold order
              </button>
            )}
            {canCancel(order.status) && (
              <button
                onClick={() => { onClose(); onCancel(order) }}
                style={{ padding: '9px 18px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                🚫 Cancel order
              </button>
            )}
          </div>
          {/* Right: close */}
          <button
            onClick={onClose}
            style={{ padding: '9px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ MAIN PAGE ═══════════════════════════════════════════ */
export default function Orders() {
  const { orders, ordersLoading, totalRecords, refetch } = useOrders()
  const [page, setPage]     = useState(1)
  const [modal, setModal]   = useState(null)   // { type: 'view'|'hold'|'cancel', order }
  const [user, setUser]     = useState(null)
  const [mobiles, setMobiles] = useState({})
  const navigate            = useNavigate()
  const { toasts, add: toast, remove: removeToast } = useToasts()

  useEffect(() => { refetch(page) }, [page])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    try { setUser(JSON.parse(stored)) }
    catch { localStorage.removeItem('user'); navigate('/') }
  }, [])

  // Fetch mobile numbers for all orders on the current page
  useEffect(() => {
    if (orders.length === 0) return
    orders.forEach(o => {
      if (mobiles[o.order_id]) return
      fetch('http://localhost:5000/order-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: o.order_id }),
      })
        .then(r => r.json())
        .then(json => {
          if (json.mobile) setMobiles(prev => ({ ...prev, [o.order_id]: json.mobile }))
        })
        .catch(() => {})
    })
  }, [orders])

  /* ── Status update (Hold / Cancel) ─── */
  // REPLACE the entire updateOrderStatus callback with:
const updateOrderStatus = useCallback(async ({ order_id, status, reason, note }) => {
  try {
    const res = await fetch('http://localhost:5000/update-status', {   // ← new URL
      method: 'PUT',                                                    // ← PUT
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id,
        status,
        reason: note || reason || undefined,   // note field → reason param
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Failed to update order.')

    toast(
      status === 'Hold'
        ? `Order #${order_id} placed on hold.`
        : `Order #${order_id} has been cancelled.`,
      status === 'Hold' ? 'info' : 'error'
    )
    refetch(page)
  } catch (err) {
    toast(err.message || 'Something went wrong.', 'error')
  }
}, [page, refetch, toast])
  const total    = totalRecords
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, lastPage)
  const pages    = buildPages(total, safePage)

  const openView   = (o) => setModal({ type: 'view',   order: o })
  const openHold   = (o) => setModal({ type: 'hold',   order: o })
  const openCancel = (o) => setModal({ type: 'cancel', order: o })
  const closeModal = ()  => setModal(null)

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .ord-wrap { width: 100%; }

        .ord-topbar {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
        }

        .ord-title {
          font-family: 'Syne', sans-serif; font-size: 26px;
          font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px; margin: 0 0 4px;
        }

        .ord-subtitle {
          font-size: 14px; color: #888; margin: 0; font-family: 'DM Sans', sans-serif;
        }

        .ord-card {
          background: #fff; border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .ord-tableWrapper { overflow-x: auto; }

        .ord-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; min-width: 820px;
        }

        .ord-table thead tr {
          background: #f9f8f6; border-bottom: 1px solid rgba(0,0,0,0.07);
        }

        .ord-table th {
          padding: 14px 16px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #aaa; text-align: left; white-space: nowrap;
        }

        .ord-table tbody tr {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: background 0.15s ease;
        }

        .ord-table tbody tr:last-child { border-bottom: none; }
        .ord-table tbody tr:hover { background: #fafaf8; }

        .ord-table td {
          padding: 13px 16px; font-size: 14px; color: #444; vertical-align: middle;
        }

        .ord-sno {
          font-size: 12px; font-weight: 700; color: #bbb;
          font-family: 'DM Sans', sans-serif;
        }

        .ord-name { font-weight: 600; color: #1a1a1a; font-size: 14px; }

        .ord-phone {
          font-size: 12px; color: #1a7a5e; font-weight: 600;
          margin-top: 3px; font-family: 'DM Sans', sans-serif;
          display: flex; align-items: center; gap: 4px;
        }

        .ord-amount { font-weight: 700; color: #1a1a1a; }

        /* ── Action buttons ── */
        .ord-actionsWrap {
          display: flex; align-items: center; gap: 6px;
          justify-content: center; flex-wrap: nowrap;
        }

        .ord-viewBtn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 9px; border: 1.5px solid rgba(26,122,94,0.3);
          background: #edf7f2; color: #1a7a5e; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          transition: all 0.15s ease; white-space: nowrap;
        }
        .ord-viewBtn:hover {
          background: #d6f0e6; border-color: rgba(26,122,94,0.5);
          transform: translateY(-1px); box-shadow: 0 3px 10px rgba(26,122,94,0.15);
        }

        .ord-holdBtn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 9px; border: 1.5px solid rgba(107,114,128,0.3);
          background: #f3f4f6; color: #374151; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          transition: all 0.15s ease; white-space: nowrap;
        }
        .ord-holdBtn:hover:not(:disabled) {
          background: #e5e7eb; border-color: rgba(107,114,128,0.5);
          transform: translateY(-1px); box-shadow: 0 3px 10px rgba(107,114,128,0.15);
        }
        .ord-holdBtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .ord-cancelBtn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 9px; border: 1.5px solid rgba(239,68,68,0.25);
          background: rgba(239,68,68,0.07); color: #dc2626; cursor: pointer;
          font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600;
          transition: all 0.15s ease; white-space: nowrap;
        }
        .ord-cancelBtn:hover:not(:disabled) {
          background: rgba(239,68,68,0.14); border-color: rgba(239,68,68,0.45);
          transform: translateY(-1px); box-shadow: 0 3px 10px rgba(239,68,68,0.15);
        }
        .ord-cancelBtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .ord-empty {
          text-align: center; padding: 60px 20px;
          color: #aaa; font-family: 'DM Sans', sans-serif; font-size: 15px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }

        .ord-pagination {
          padding: 18px 20px; border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }

        .ord-paginationControls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }

        .ord-pageBtn {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e0e0e0;
          background: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #555; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s ease;
        }
        .ord-pageBtn:hover:not(:disabled) { background: #f0f7f4; border-color: rgba(26,122,94,0.3); color: #1a7a5e; }
        .ord-pageBtn.active { background: #b91c1c; color: #fff; border-color: #b91c1c; font-weight: 700; }
        .ord-pageBtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .ord-pageEllipsis { color: #bbb; font-size: 16px; padding: 0 4px; line-height: 36px; }
        .ord-paginationInfo { font-size: 13px; color: #aaa; font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, minWidth: 280, maxWidth: 380, background: t.type === 'success' ? '#edfaf4' : t.type === 'error' ? '#fdf2f2' : '#f0f4ff', border: `1px solid ${t.type === 'success' ? 'rgba(30,126,78,0.2)' : t.type === 'error' ? 'rgba(185,74,72,0.2)' : 'rgba(66,99,235,0.2)'}`, color: t.type === 'success' ? '#1e7e4e' : t.type === 'error' ? '#b94a48' : '#4263eb', boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5 }}>×</button>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal?.type === 'view'   && <ViewOrderModal   order={modal.order} onClose={closeModal} onHold={openHold} onCancel={openCancel} />}
      {modal?.type === 'hold'   && <HoldOrderModal   order={modal.order} onClose={closeModal} onConfirm={updateOrderStatus} />}
      {modal?.type === 'cancel' && <CancelOrderModal order={modal.order} onClose={closeModal} onConfirm={updateOrderStatus} />}

      <div className="ord-wrap">
        {/* Top bar */}
        <div className="ord-topbar">
          <div>
            <h1 className="ord-title">Orders</h1>
            <p className="ord-subtitle">Track and manage all customer orders — {total} order{total !== 1 ? 's' : ''} total.</p>
          </div>
        </div>

        {/* Table card */}
        <div className="ord-card">
          <div className="ord-tableWrapper">
            {ordersLoading ? (
              <div className="ord-empty">
                <span style={{ fontSize: 32, animation: 'spin 1s linear infinite', display: 'inline-block', color: '#1a7a5e' }}>◈</span>
                <span>Loading orders…</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="ord-empty">
                <span style={{ fontSize: 36 }}>◈</span>
                <div style={{ fontWeight: 600, color: '#555' }}>No orders yet</div>
                <div>Orders will appear here once customers start placing them.</div>
              </div>
            ) : (
              <table className="ord-table">
                <thead>
                  <tr>
                    <th style={{ width: 52 }}>S.No</th>
                    <th>Customer Name</th>
                    <th>Payment Method</th>
                    <th>Total Amount</th>
                    <th>Order Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, idx) => (
                    <tr key={o.id}>
                      {/* S.No */}
                      <td>
                        <span className="ord-sno">
                          {String((safePage - 1) * PAGE_SIZE + idx + 1).padStart(2, '0')}
                        </span>
                      </td>

                      {/* Customer Name + Phone */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #d6f0e6 0%, #c3e8da 100%)', border: '1px solid rgba(26,122,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#1a7a5e', flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>
                            {(o.customer_name ?? '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <div className="ord-name">{o.customer_name}</div>
                            {mobiles[o.order_id] ? (
                              <div className="ord-phone">
                                <span></span>
                                {mobiles[o.order_id]}
                              </div>
                            ) : (
                              <div style={{ fontSize: 11, color: '#ddd', marginTop: 3, fontFamily: "'DM Sans', sans-serif" }}>
                                loading…
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Payment Method */}
                      <td><MethodBadge method={o.payment_method} /></td>

                      {/* Total Amount */}
                      <td className="ord-amount">Rs.{o.total_amount.toFixed(2)}</td>

                      {/* Status */}
                      <td><StatusBadge status={o.status} /></td>

                      {/* Last Updated */}
                      <td style={{ color: '#aaa', fontSize: 13 }}>{formatDate(o.updated_at)}</td>

                      {/* Actions */}
                      <td>
                        <div className="ord-actionsWrap">
                          {/* View */}
                          <button className="ord-viewBtn" onClick={() => openView(o)}>
                            <span style={{ fontSize: 13 }}>👁</span> View
                          </button>

                          {/* Hold */}
                          <button
                            className="ord-holdBtn"
                            onClick={() => openHold(o)}
                            disabled={!canHold(o.status)}
                            title={!canHold(o.status) ? 'Cannot hold at this stage' : 'Put order on hold'}
                          >
                            <span style={{ fontSize: 13 }}>⏸</span> Hold
                          </button>

                          {/* Cancel */}
                          <button
                            className="ord-cancelBtn"
                            onClick={() => openCancel(o)}
                            disabled={!canCancel(o.status)}
                            title={!canCancel(o.status) ? 'Cannot cancel at this stage' : 'Cancel order'}
                          >
                            <span style={{ fontSize: 13 }}>🚫</span> Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!ordersLoading && total > 0 && (
            <div className="ord-pagination">
              <div className="ord-paginationControls">
                <button className="ord-pageBtn" onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
                <button className="ord-pageBtn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
                {pages.map((pg, i) =>
                  pg === '…'
                    ? <span key={`e${i}`} className="ord-pageEllipsis">…</span>
                    : <button key={pg} className={`ord-pageBtn${pg === safePage ? ' active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                )}
                <button className="ord-pageBtn" onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={safePage === lastPage}>›</button>
                <button className="ord-pageBtn" onClick={() => setPage(lastPage)} disabled={safePage === lastPage}>»</button>
              </div>
              <div className="ord-paginationInfo">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} of {total} order{total !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
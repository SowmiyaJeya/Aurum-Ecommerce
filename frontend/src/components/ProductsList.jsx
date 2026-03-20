import React, { useState, useEffect, useRef, useCallback } from 'react'
import Checkout from './Checkout'
import { useNavigate } from 'react-router-dom'

// inside Products()



const CAT_ICONS = {
  'Graphics Cards': '🎮', 'Motherboards': '🖥️', 'RAM': '💾',
  'Storage': '💿', 'Cases': '📦', 'PSU': '⚡',
  'Processors': '🔲', 'Monitors': '🖥️', 'All': '✦',
}
const PAGE_LIMIT = 5

function AuthHeaderSection() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    setUser(null)
    setShowMenu(false)
  }

  const initials = name => (name ? name.slice(0, 2).toUpperCase() : 'U')

  if (user) {
    return (
      <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 8, paddingRight: 10 }}>
        <button
          onClick={() => setShowMenu(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '5px 12px 5px 6px', borderRadius: 8,
            border: '1.5px solid rgba(185,28,28,0.3)',
            background: showMenu ? '#fef2f2' : '#fff',
            cursor: 'pointer', transition: 'all 0.15s',
            fontFamily: "'DM Sans',sans-serif",
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
          onMouseLeave={e => { if (!showMenu) e.currentTarget.style.background = '#fff' }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            background: 'linear-gradient(135deg,#b91c1c,#dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: '#fff',
            fontFamily: "'Syne',sans-serif", flexShrink: 0,
          }}>
            {initials(user.username || user.name)}
          </div>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.username || user.name}
          </span>
          <span style={{ fontSize: 9, color: '#aaa' }}>{showMenu ? '▲' : '▼'}</span>
        </button>

        {showMenu && (
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 9000,
            background: '#fff', borderRadius: 11,
            boxShadow: '0 12px 40px rgba(0,0,0,0.14)', border: '1px solid #efefef',
            minWidth: 180, overflow: 'hidden',
            animation: 'fadeUp 0.15s ease both',
          }}>
            <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #f0f0f0', background: '#fafaf8' }}>
              <div style={{ fontSize: 11, color: '#bbb', fontFamily: "'DM Sans',sans-serif", marginBottom: 2 }}>Signed in as</div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#1a1a1a', fontFamily: "'Syne',sans-serif" }}>{user.username || user.name}</div>
              {user.email && <div style={{ fontSize: 11, color: '#aaa', fontFamily: "'DM Sans',sans-serif", marginTop: 1 }}>{user.email}</div>}
            </div>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '11px 16px', background: 'none', border: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                fontFamily: "'DM Sans',sans-serif", fontSize: 13, color: '#b94a48',
                fontWeight: 600, cursor: 'pointer', transition: 'background 0.12s', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#fdf2f2'}
              onMouseLeave={e => e.currentTarget.style.background = 'none'}
            >
              ↩ Logout
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="site-topbar-auth">
      <button className="site-auth-icon-btn" onClick={() => window.location.href = '/login'} title="Login">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>
        </svg>
        <span>Login</span>
      </button>
      <button className="site-auth-icon-btn site-auth-icon-register" onClick={() => window.location.href = '/register?from=productlist'} title="Register">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
        </svg>
        <span>Register</span>
      </button>
    </div>
  )
}

// ─── Convert raw hex/buffer image data to object URL ─────────────────────────
function bufferToObjectUrl(imageData) {
  if (!imageData) return null
  try {
    let bytes
    if (typeof imageData === 'string') {
      const hex = imageData.replace(/^\\x|^0x/i, '').replace(/\\x/g, '')
      const arr = []
      for (let i = 0; i < hex.length; i += 2) {
        arr.push(parseInt(hex.slice(i, i + 2), 16))
      }
      bytes = new Uint8Array(arr)
    } else if (imageData && imageData.data) {
      bytes = new Uint8Array(imageData.data)
    } else if (imageData instanceof Uint8Array) {
      bytes = imageData
    } else {
      return null
    }
    if (!bytes || bytes.length < 4) return null
    const m = (bytes[0] === 0xFF && bytes[1] === 0xD8) ? 'image/jpeg'
      : (bytes[0] === 0x89 && bytes[1] === 0x50) ? 'image/png'
      : (bytes[0] === 0x47 && bytes[1] === 0x49) ? 'image/gif'
      : 'image/jpeg'
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

function ProductImage({ imageData, alt, style }) {
  const src = useObjectUrl(imageData)
  if (!src) return null
  return <img src={src} alt={alt || ''} style={style} />
}

function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position:'fixed', top:28, left:'50%', transform:'translateX(-50%)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', gap:10, pointerEvents:'none', width:'max-content', maxWidth:'90vw' }}>
      {toasts.map((t, idx) => {
        const accent = t.type==='success'?'#b91c1c':t.type==='error'?'#b94a48':'#4263eb'
        const bg     = t.type==='success'?'#fef2f2':t.type==='error'?'#fdf2f2':'#eef2ff'
        const icon   = t.type==='success'?'✓':t.type==='error'?'✕':'ℹ'
        return (
          <div key={t.id} style={{
            display:'flex', alignItems:'center', gap:12,
            padding:'12px 18px 12px 14px', borderRadius:999,
            background:'#fff', pointerEvents:'all',
            border:`1px solid ${accent}22`,
            boxShadow:`0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px ${accent}18`,
            fontFamily:"'DM Sans',sans-serif", fontSize:14,
            animation:'toastDrop 0.38s cubic-bezier(0.34,1.56,0.64,1) both',
            animationDelay:`${idx*0.05}s`,
            whiteSpace:'nowrap',
          }}>
            <span style={{ width:26, height:26, borderRadius:'50%', flexShrink:0, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:accent }}>
              {icon}
            </span>
            <span style={{ color:'#1a1a1a', fontWeight:500, fontSize:13.5 }}>{t.message}</span>
            <button onClick={() => removeToast(t.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:15, color:'#ccc', padding:'0 0 0 6px', lineHeight:1, transition:'color 0.15s', marginLeft:2 }}
              onMouseEnter={e=>e.currentTarget.style.color='#888'} onMouseLeave={e=>e.currentTarget.style.color='#ccc'}>×</button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Quantity Stepper Component ───────────────────────────────────────────────
function QuantityStepper({ quantity, onIncrease, onDecrease, min = 1, max = 99, size = 'md' }) {
  const isSmall = size === 'sm'
  const btnSize = isSmall ? 26 : 32
  const fontSize = isSmall ? 11 : 13
  const numWidth = isSmall ? 32 : 40
  return (
    <div style={{ display:'flex', alignItems:'center', gap:0, border:'1.5px solid #e8e8e8', borderRadius:9, overflow:'hidden', background:'#fff' }}>
      <button
        onClick={onDecrease}
        disabled={quantity <= min}
        style={{
          width:btnSize, height:btnSize, border:'none', background: quantity <= min ? '#f9f9f9' : '#fff',
          cursor: quantity <= min ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: isSmall ? 14 : 16, color: quantity <= min ? '#ccc' : '#b91c1c',
          fontWeight:700, transition:'all 0.15s', flexShrink:0,
        }}
        onMouseEnter={e => { if (quantity > min) e.currentTarget.style.background='#fef2f2' }}
        onMouseLeave={e => e.currentTarget.style.background = quantity <= min ? '#f9f9f9' : '#fff'}
      >−</button>
      <div style={{
        width:numWidth, textAlign:'center',
        fontFamily:"'Syne',sans-serif", fontSize, fontWeight:700,
        color:'#1a1a1a', borderLeft:'1px solid #f0f0f0', borderRight:'1px solid #f0f0f0',
        padding: isSmall ? '4px 0' : '6px 0', userSelect:'none',
      }}>{quantity}</div>
      <button
        onClick={onIncrease}
        disabled={quantity >= max}
        style={{
          width:btnSize, height:btnSize, border:'none', background: quantity >= max ? '#f9f9f9' : '#fff',
          cursor: quantity >= max ? 'not-allowed' : 'pointer',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontSize: isSmall ? 14 : 16, color: quantity >= max ? '#ccc' : '#b91c1c',
          fontWeight:700, transition:'all 0.15s', flexShrink:0,
        }}
        onMouseEnter={e => { if (quantity < max) e.currentTarget.style.background='#fef2f2' }}
        onMouseLeave={e => e.currentTarget.style.background = quantity >= max ? '#f9f9f9' : '#fff'}
      >+</button>
    </div>
  )
}

function CartDrawer({ cart, onClose, onRemove, onClearAll, onProceedToCheckout, onUpdateQuantity }) {
  const fmt = n => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n)
  const total = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0)
  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0)
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', h); document.body.style.overflow = '' }
  }, [onClose])
  return (
    <>
      <div onClick={onClose} style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.38)', backdropFilter:'blur(4px)', zIndex:7000, animation:'fadeIn 0.22s ease' }} />
      <div style={{ position:'fixed', top:0, right:0, bottom:0, width:440, maxWidth:'100vw', background:'#fff', zIndex:7001, display:'flex', flexDirection:'column', boxShadow:'-8px 0 48px rgba(0,0,0,0.16)', animation:'drawerSlide 0.32s cubic-bezier(0.34,1.2,0.64,1) both' }}>
        <div style={{ padding:'20px 22px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'#fafaf8' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:40, height:40, borderRadius:11, background:'#b91c1c', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, boxShadow:'0 3px 12px rgba(185,28,28,0.3)' }}>🛒</div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:'#1a1a1a' }}>Your Cart</div>
              <div style={{ fontSize:12, color:'#bbb', fontFamily:"'DM Sans',sans-serif", marginTop:1 }}>{cart.length === 0 ? 'No items yet' : `${cart.length} item${cart.length > 1 ? 's' : ''} · ${totalItems} unit${totalItems !== 1 ? 's' : ''}`}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {cart.length > 0 && (
              <button onClick={onClearAll} style={{ padding:'6px 13px', borderRadius:8, border:'1px solid rgba(185,74,72,0.25)', background:'#fdf2f2', color:'#b94a48', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:"'DM Sans',sans-serif", transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#fce0e0';e.currentTarget.style.borderColor='rgba(185,74,72,0.45)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='#fdf2f2';e.currentTarget.style.borderColor='rgba(185,74,72,0.25)'}}>Clear All</button>
            )}
            <button onClick={onClose} style={{ width:34, height:34, borderRadius:9, border:'1px solid #e8e8e8', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, color:'#aaa', transition:'all 0.15s' }}
              onMouseEnter={e=>{e.currentTarget.style.background='#fdf2f2';e.currentTarget.style.color='#b94a48';e.currentTarget.style.borderColor='rgba(185,74,72,0.25)'}}
              onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#aaa';e.currentTarget.style.borderColor='#e8e8e8'}}>✕</button>
          </div>
        </div>

        <div style={{ flex:1, overflowY:'auto', padding: cart.length === 0 ? '0' : '12px 0' }}>
          {cart.length === 0 ? (
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', gap:14, padding:'40px 24px', textAlign:'center' }}>
              <div style={{ fontSize:64, filter:'grayscale(0.3)', animation:'floatUp 3s ease infinite' }}>🛒</div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontSize:17, fontWeight:700, color:'#1a1a1a' }}>Your cart is empty</div>
              <div style={{ fontSize:13.5, color:'#bbb', fontFamily:"'DM Sans',sans-serif", lineHeight:1.6 }}>Browse our products and add items to get started!</div>
              <button onClick={onClose} style={{ marginTop:6, padding:'11px 28px', borderRadius:11, background:'#b91c1c', color:'#fff', border:'none', fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer', boxShadow:'0 4px 14px rgba(185,28,28,0.28)', transition:'all 0.15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#991b1b';e.currentTarget.style.transform='translateY(-1px)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='#b91c1c';e.currentTarget.style.transform='none'}}>Continue Shopping</button>
            </div>
          ) : cart.map((item, i) => <CartItem key={item.id} item={item} index={i} onRemove={onRemove} onUpdateQuantity={onUpdateQuantity} fmt={fmt} />)}
        </div>

        {cart.length > 0 && (
          <div style={{ borderTop:'1px solid #f0f0f0', padding:'18px 22px 24px', flexShrink:0, background:'#fff' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontFamily:"'DM Sans',sans-serif", color:'#999' }}>
                <span>Subtotal ({totalItems} unit{totalItems !== 1 ? 's' : ''})</span><span style={{ fontWeight:600, color:'#555' }}>{fmt(total)}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:13, fontFamily:"'DM Sans',sans-serif", color:'#999' }}>
                <span>Delivery</span><span style={{ fontWeight:600, color:'#b91c1c' }}>FREE</span>
              </div>
              <div style={{ height:1, background:'#f0f0f0', margin:'2px 0' }}/>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, color:'#1a1a1a' }}>Total</span>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:18, fontWeight:800, color:'#e03030' }}>{fmt(total)}</span>
              </div>
            </div>
            <button
              onClick={() => {
                const user = localStorage.getItem('user')
                if (!user) {
                  window.location.href = '/register?from=productlist'
                } else {
                  onProceedToCheckout()
                }
              }}
              style={{ width:'100%', padding:'14px', borderRadius:12, background:'linear-gradient(135deg,#b91c1c,#dc2626)', color:'#fff', border:'none', fontFamily:"'Syne',sans-serif", fontSize:15, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:9, boxShadow:'0 6px 22px rgba(185,28,28,0.32)', transition:'all 0.2s ease' }}
              onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow='0 10px 30px rgba(185,28,28,0.4)'}}
              onMouseLeave={e=>{e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='0 6px 22px rgba(185,28,28,0.32)'}}>
              <span style={{ fontSize:18 }}>✦</span> Proceed to Checkout
            </button>
            <button onClick={onClose} style={{ width:'100%', padding:'11px', borderRadius:12, border:'1px solid #e8e8e8', background:'#fff', color:'#888', fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:500, cursor:'pointer', marginTop:10, transition:'background 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.background='#f5f5f3'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>← Continue Shopping</button>
          </div>
        )}
      </div>
    </>
  )
}

function CartItem({ item, index, onRemove, onUpdateQuantity, fmt }) {
  const [removing, setRemoving] = useState(false)
  const handleRemove = () => { setRemoving(true); setTimeout(() => onRemove(item.id), 300) }
  const hue = (item.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const qty = item.quantity || 1
  const lineTotal = (item.price || 0) * qty
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0, padding:'12px 22px', borderBottom:'1px solid #f8f8f6', opacity:removing?0:1, transform:removing?'translateX(30px)':'none', transition:'opacity 0.28s ease, transform 0.28s ease', animation:'cartItemIn 0.3s cubic-bezier(0.34,1.3,0.64,1) both', animationDelay:`${index * 0.05}s` }}>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <div style={{ width:52, height:52, borderRadius:11, flexShrink:0, background:`linear-gradient(145deg,hsl(${hue},20%,95%),hsl(${hue},24%,89%))`, border:`1px solid hsl(${hue},18%,86%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>📦</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:600, color:'#1a1a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom:3 }}>{item.name}</div>
          <div style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:600, color:'#999' }}>₹{(item.price||0).toLocaleString('en-IN')} × {qty}</div>
        </div>
        <button onClick={handleRemove} title="Remove from cart" style={{ flexShrink:0, width:30, height:30, borderRadius:8, border:'1px solid rgba(185,74,72,0.2)', background:'#fdf2f2', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#b94a48', transition:'all 0.15s ease' }}
          onMouseEnter={e=>{e.currentTarget.style.background='#fce0e0';e.currentTarget.style.borderColor='rgba(185,74,72,0.45)';e.currentTarget.style.transform='scale(1.1)'}}
          onMouseLeave={e=>{e.currentTarget.style.background='#fdf2f2';e.currentTarget.style.borderColor='rgba(185,74,72,0.2)';e.currentTarget.style.transform='scale(1)'}}>🗑️</button>
      </div>
      {/* Quantity row */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:10, paddingLeft:66 }}>
        <QuantityStepper
          size="sm"
          quantity={qty}
          onDecrease={() => onUpdateQuantity(item.id, qty - 1)}
          onIncrease={() => onUpdateQuantity(item.id, qty + 1)}
          max={item.stock || 99}
        />
        <div style={{ fontFamily:"'Syne',sans-serif", fontSize:14, fontWeight:800, color:'#e03030' }}>{fmt(lineTotal)}</div>
      </div>
    </div>
  )
}

// ─── Quick View Modal ─────────────────────────────────────────────────────────
function QuickViewModal({ product, onClose, onAddToCart, onAddToWishlist, isWishlisted, cartItem, onUpdateQuantity }) {
  const safePrice = !isNaN(parseFloat(product.price)) ? parseFloat(product.price) : null
  const safeOriginal = !isNaN(parseFloat(product.original_price)) ? parseFloat(product.original_price) : null
  const hue = (product.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const icon = CAT_ICONS[product.category] || '📦'
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  const disc = safePrice && safeOriginal && safeOriginal > safePrice ? Math.round((1 - safePrice / safeOriginal) * 100) : 0
  const [activeImg, setActiveImg] = useState(0)
  const images = product.product_images || []
  const inCart = !!cartItem
  const qty = cartItem?.quantity || 1

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(8,8,8,0.62)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000, padding:20, animation:'fadeIn 0.2s ease' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'#fff', borderRadius:22, width:'100%', maxWidth:840, boxShadow:'0 40px 100px rgba(0,0,0,0.28)', overflow:'hidden', maxHeight:'92vh', display:'flex', flexDirection:'column', animation:'qvIn 0.32s cubic-bezier(0.34,1.4,0.64,1) both' }}>
        <div style={{ padding:'13px 20px', borderBottom:'1px solid #f2f2f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'#fafaf8' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:10, fontWeight:700, color:'#b91c1c', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Quick View</span>
            <span style={{ width:3, height:3, borderRadius:'50%', background:'#ddd', display:'inline-block' }} />
            <span style={{ fontSize:12, color:'#bbb', fontFamily:"'DM Sans',sans-serif" }}>{product.category || '—'}</span>
          </div>
          <button onClick={onClose}
            style={{ width:30, height:30, borderRadius:8, border:'1px solid #e8e8e8', background:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, color:'#aaa', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#fdf2f2';e.currentTarget.style.color='#b94a48';e.currentTarget.style.borderColor='rgba(185,74,72,0.25)'}}
            onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#aaa';e.currentTarget.style.borderColor='#e8e8e8'}}>✕</button>
        </div>

        <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>
          <div style={{ width:370, flexShrink:0, padding:24, display:'flex', flexDirection:'column', gap:12, borderRight:'1px solid #f0f0f0', background:'#fafaf8' }}>
            <div style={{
              width:'100%', flex:1, minHeight:220, borderRadius:16,
              background:`linear-gradient(145deg,hsl(${hue},22%,94%),hsl(${hue},28%,87%))`,
              border:`1.5px solid hsl(${hue},20%,84%)`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              position:'relative', overflow:'hidden', transition:'all 0.3s ease',
            }}>
              {disc > 0 && (
                <div style={{ position:'absolute', top:14, left:14, background:'linear-gradient(135deg,#e03030,#c02020)', color:'#fff', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:6, fontFamily:"'DM Sans',sans-serif", boxShadow:'0 2px 8px rgba(224,48,48,0.3)', zIndex:2 }}>-{disc}%</div>
              )}
              {images.length > 0 ? (
                <QVImage key={activeImg} imageData={images[activeImg]} alt={product.name} />
              ) : (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{ fontSize:80, filter:'drop-shadow(0 6px 18px rgba(0,0,0,0.12))' }}>{icon}</div>
                  {product.brand && <span style={{ fontSize:11, color:`hsl(${hue},35%,45%)`, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>{product.brand}</span>}
                </div>
              )}
              {images.length > 1 && (
                <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
                  {images.map((_, i) => (
                    <div key={i} onClick={() => setActiveImg(i)}
                      style={{ width:i===activeImg?22:7, height:7, borderRadius:4, background:i===activeImg?'#b91c1c':'rgba(0,0,0,0.14)', cursor:'pointer', transition:'all 0.22s ease' }}
                    />
                  ))}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div style={{ display:'flex', gap:8 }}>
                {images.map((imgData, i) => (
                  <QVThumb key={i} imageData={imgData} icon={icon} hue={(hue + i * 28) % 360} isActive={i === activeImg} onClick={() => setActiveImg(i)} />
                ))}
              </div>
            )}
          </div>

          <div style={{ flex:1, padding:'28px 30px', overflowY:'auto', display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              {product.brand && (
                <span style={{ fontSize:11, fontWeight:700, color:'#b91c1c', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.08em', textTransform:'uppercase', background:'#fef2f2', padding:'3px 9px', borderRadius:5 }}>{product.brand}</span>
              )}
              {product.stock > 0 && product.stock <= 5 && <span style={{ fontSize:11, fontWeight:700, color:'#c2570a', background:'#fef3ea', padding:'3px 9px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>Only {product.stock} left!</span>}
              {product.stock === 0 && <span style={{ fontSize:11, fontWeight:700, color:'#b94a48', background:'#fdf2f2', padding:'3px 9px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>Out of Stock</span>}
              {images.length > 1 && (
                <span style={{ fontSize:11, fontWeight:600, color:'#888', background:'#f5f5f3', padding:'3px 9px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>{images.length} images</span>
              )}
            </div>
            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:700, color:'#1a1a1a', margin:0, lineHeight:1.3 }}>{product.name || product.product_name || '—'}</h2>
            {product.rating > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize:14, color:i<=Math.round(product.rating)?'#f59e0b':'#e8e8e8' }}>★</span>)}</div>
                <span style={{ fontSize:13.5, fontWeight:600, color:'#1a1a1a', fontFamily:"'DM Sans',sans-serif" }}>{product.rating}</span>
                <span style={{ fontSize:13, color:'#bbb', fontFamily:"'DM Sans',sans-serif" }}>({(product.reviews || 0).toLocaleString()} reviews)</span>
              </div>
            )}
            <div style={{ height:1, background:'linear-gradient(90deg,#f0f0f0,transparent)' }} />
            <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
              {safePrice !== null ? (
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:'#e03030', lineHeight:1 }}>{fmt(safePrice)}</span>
              ) : (
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:20, fontWeight:600, color:'#ccc' }}>Price unavailable</span>
              )}
              {safeOriginal && safeOriginal > safePrice && (
                <>
                  <span style={{ fontSize:16, color:'#ccc', textDecoration:'line-through', fontFamily:"'DM Sans',sans-serif" }}>{fmt(safeOriginal)}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'#b91c1c', background:'#fef2f2', padding:'3px 8px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>Save {fmt(safeOriginal - safePrice)}</span>
                </>
              )}
            </div>
            <div style={{ height:1, background:'linear-gradient(90deg,#f0f0f0,transparent)' }} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 24px' }}>
              {[
                ['Brand', product.brand || '—'],
                ['Category', product.category || product.category_name || '—'],
                ['Stock', product.stock === 0 ? 'Unavailable' : product.stock != null ? `${product.stock} units` : '—'],
              ].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#ccc', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:14, color:'#333', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ flex:1 }} />

            {/* Quantity selector in Quick View (shown only when item is in cart) */}
            {inCart && product.stock !== 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#fef2f2', borderRadius:11, border:'1px solid rgba(185,28,28,0.15)' }}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#b91c1c', flex:1 }}>Qty in cart:</span>
                <QuantityStepper
                  quantity={qty}
                  onDecrease={() => onUpdateQuantity(product.id, qty - 1)}
                  onIncrease={() => onUpdateQuantity(product.id, qty + 1)}
                  max={product.stock || 99}
                />
              </div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {product.stock === 0
                ? <button disabled style={{ width:'100%', padding:13, background:'#f5f5f3', color:'#ccc', border:'1.5px solid #efefef', borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:'not-allowed' }}>Out of Stock</button>
                : <button onClick={() => { if (!inCart) { onAddToCart(product); } onClose() }}
                    style={{ width:'100%', padding:13, background: inCart ? '#fdf2f2' : '#f4b400', color: inCart ? '#b94a48' : '#1a1a1a', border: inCart ? '1.5px solid rgba(185,74,72,0.3)' : 'none', borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s ease', boxShadow: inCart ? 'none' : '0 3px 12px rgba(244,180,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                    onMouseEnter={e=>{e.currentTarget.style.opacity='0.85';e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.opacity='1';e.currentTarget.style.transform='none'}}>
                    <span style={{ fontSize:16 }}>{inCart ? '✓' : '🛒'}</span> {inCart ? 'Already in Cart' : 'Add To Cart'}
                  </button>
              }
              <button onClick={() => onAddToWishlist(product)}
                style={{ width:'100%', padding:12, background:isWishlisted?'#fdf2f2':'#fff', color:isWishlisted?'#b94a48':'#666', border:`1.5px solid ${isWishlisted?'rgba(185,74,72,0.3)':'#e8e8e8'}`, borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:'pointer', transition:'all 0.2s ease', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                onMouseEnter={e=>{e.currentTarget.style.background='#fdf2f2';e.currentTarget.style.color='#b94a48';e.currentTarget.style.borderColor='rgba(185,74,72,0.3)'}}
                onMouseLeave={e=>{e.currentTarget.style.background=isWishlisted?'#fdf2f2':'#fff';e.currentTarget.style.color=isWishlisted?'#b94a48':'#666';e.currentTarget.style.borderColor=isWishlisted?'rgba(185,74,72,0.3)':'#e8e8e8'}}>
                {isWishlisted ? '❤️' : '🤍'} {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function QVImage({ imageData, alt }) {
  const src = useObjectUrl(imageData)
  if (!src) return <div style={{ fontSize:48, opacity:0.3 }}>📦</div>
  return <img src={src} alt={alt || ''} style={{ maxWidth:'100%', maxHeight:220, objectFit:'contain', display:'block' }} />
}

function QVThumb({ imageData, icon, hue, isActive, onClick }) {
  const src = useObjectUrl(imageData)
  return (
    <div onClick={onClick} style={{
      flex:1, height:64, borderRadius:12,
      background:`linear-gradient(135deg,hsl(${hue},18%,${isActive?87:93}%),hsl(${hue},22%,${isActive?81:89}%))`,
      border:`2px solid ${isActive ? '#b91c1c' : 'transparent'}`,
      outline:`1px solid ${isActive ? 'transparent' : `hsl(${hue},15%,87%)`}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:24, cursor:'pointer', overflow:'hidden',
      transition:'all 0.2s ease',
      boxShadow:isActive?'0 3px 12px rgba(185,28,28,0.2)':'none',
      transform:isActive?'scale(1.05)':'scale(1)',
    }}>
      {src ? <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : icon}
    </div>
  )
}

function ProductThumb({ name, category }) {
  const hue = (name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360
  return <div style={{ width:'100%', height:160, borderRadius:12, background:`linear-gradient(145deg,hsl(${hue},20%,95%),hsl(${hue},24%,89%))`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:42, gap:6, border:`1px solid hsl(${hue},18%,86%)` }}>{CAT_ICONS[category]||'📦'}<span style={{ fontSize:9, color:`hsl(${hue},30%,52%)`, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>{category}</span></div>
}

function CategoryBadge({ category }) {
  const hue = (category||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, background:`hsl(${hue},30%,94%)`, color:`hsl(${hue},40%,36%)`, border:`1px solid hsl(${hue},25%,84%)`, fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{category}</span>
}

// ─── Shared category data cache ───────────────────────────────────────────────
let _categoryCache = null
let _categoryListeners = []
function useCategoryData() {
  const [data, setData] = useState(_categoryCache)
  useEffect(() => {
    if (_categoryCache) { setData(_categoryCache); return }
    const update = d => setData(d)
    _categoryListeners.push(update)
    if (_categoryListeners.length === 1) {
      fetch('http://localhost:5000/filter-category', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'allcategory' }),
      })
        .then(r => r.json())
        .then(json => {
          if (json.success && Array.isArray(json.data)) {
            const seen = new Map()
            json.data.forEach(p => {
              if (p.category_id && !seen.has(p.category_id))
                seen.set(p.category_id, p.category_name || `Category ${p.category_id}`)
            })
            const result = {
              allProducts: json.data,
              categories: [...seen.entries()].map(([id, name]) => ({ category_id: id, category_name: name })),
            }
            _categoryCache = result
            _categoryListeners.forEach(fn => fn(result))
          }
        })
        .catch(() => {})
    }
    return () => { _categoryListeners = _categoryListeners.filter(fn => fn !== update) }
  }, [])
  return data
}

function NavCategoryDropdown({ category, allProducts, onProductSelect, onCategoryClick }) {
  const products = allProducts.filter(p => p.category_id === category.category_id)
  const hue = (category.category_name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ position:'absolute', top:'100%', left:'50%', transform:'translateX(-50%)', zIndex:3000, background:'#fff', borderRadius:'0 0 14px 14px', boxShadow:'0 20px 60px rgba(0,0,0,0.13)', border:'1px solid #efefef', borderTop:'2px solid #b91c1c', minWidth:300, maxWidth:420, animation:'fadeUp 0.16s ease both', overflow:'hidden' }}>
      <div onClick={() => onCategoryClick(category)} style={{ padding:'12px 16px', background:`hsl(${hue},28%,97%)`, borderBottom:'1px solid #f0f0f0', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between' }}
        onMouseEnter={e => e.currentTarget.style.background=`hsl(${hue},35%,93%)`} onMouseLeave={e => e.currentTarget.style.background=`hsl(${hue},28%,97%)`}>
        <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:'#b91c1c', letterSpacing:'0.07em', textTransform:'uppercase' }}>{category.category_name}</span>
        <span style={{ fontSize:11, color:'#b91c1c', fontFamily:"'DM Sans',sans-serif", fontWeight:600 }}>View all {products.length} →</span>
      </div>
      <div style={{ maxHeight:320, overflowY:'auto' }}>
        {products.length === 0
          ? <div style={{ padding:'24px 16px', textAlign:'center', color:'#ccc', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>📭 No products</div>
          : products.map(p => (
              <div key={p.product_id} onClick={() => onProductSelect(p, category)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', cursor:'pointer', borderBottom:'1px solid #f8f8f8', transition:'background 0.1s' }}
                onMouseEnter={e => e.currentTarget.style.background='#fef2f2'} onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:500, color:'#1a1a1a', flex:1, marginRight:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</span>
                <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#b91c1c', flexShrink:0 }}>₹{parseFloat(p.price).toLocaleString('en-IN')}</span>
              </div>
            ))
        }
      </div>
    </div>
  )
}

function BrowseMegaMenu({ onCategorySelect, onProductSelect }) {
  const catData = useCategoryData()
  const categories = catData?.categories || []
  const allProducts = catData?.allProducts || []
  const categoriesLoading = !catData
  const [open, setOpen] = useState(false)
  const [hoveredCat, setHoveredCat] = useState(null)
  const timer = useRef(null)
  useEffect(() => { if (categories.length > 0 && !hoveredCat) setHoveredCat(categories[0]) }, [categories])
  const catProducts = hoveredCat ? allProducts.filter(p => p.category_id === hoveredCat.category_id) : []
  const hue = n => (n || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <div style={{ position:'relative' }} onMouseLeave={() => { timer.current = setTimeout(() => setOpen(false), 160) }}>
      <button className="site-browse-btn"
        onMouseEnter={() => { clearTimeout(timer.current); setOpen(true) }}
        onClick={() => setOpen(o => !o)}
        style={{ background:open?'#fef2f2':undefined, color:open?'#b91c1c':undefined }}>
        <span style={{ fontSize:15 }}>☰</span> Browse All Categories
        <span style={{ fontSize:9, marginLeft:4, color:open?'#b91c1c':'#bbb' }}>{open?'▲':'▼'}</span>
      </button>
      {open && (
        <div onMouseEnter={() => clearTimeout(timer.current)} style={{ position:'absolute', top:'100%', left:0, zIndex:2000, display:'flex', minWidth:560, background:'#fff', borderRadius:'0 0 14px 14px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:'1px solid #efefef', borderTop:'2px solid #b91c1c', overflow:'hidden', animation:'fadeUp 0.18s ease both' }}>
          <div style={{ width:220, flexShrink:0, borderRight:'1px solid #f0f0f0', overflowY:'auto', maxHeight:420, background:'#fafaf8' }}>
            {categoriesLoading
              ? <div style={{ padding:'24px 20px', color:'#bbb', fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>Loading…</div>
              : categories.map(cat => {
                  const isA = hoveredCat?.category_id === cat.category_id
                  const h = hue(cat.category_name)
                  return (
                    <div key={cat.category_id} onMouseEnter={() => setHoveredCat(cat)} onClick={() => { onCategorySelect(cat); setOpen(false) }}
                      style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 18px', cursor:'pointer', background:isA?'#fff':'transparent', borderLeft:`3px solid ${isA?'#b91c1c':'transparent'}`, transition:'all 0.12s ease' }}>
                      <span style={{ width:30, height:30, borderRadius:8, flexShrink:0, background:`hsl(${h},30%,93%)`, border:`1px solid hsl(${h},25%,84%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>{cat.category_name.charAt(0)}</span>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:isA?600:400, color:isA?'#1a1a1a':'#444', flex:1 }}>{cat.category_name}</span>
                      {isA && <span style={{ fontSize:10, color:'#b91c1c' }}>›</span>}
                    </div>
                  )
                })
            }
          </div>
          <div style={{ flex:1, padding:'16px 18px', minWidth:0, maxHeight:420, overflowY:'auto' }}>
            {hoveredCat && <div style={{ fontFamily:"'Syne',sans-serif", fontSize:12, fontWeight:700, color:'#b91c1c', marginBottom:12, letterSpacing:'0.06em', textTransform:'uppercase' }}>{hoveredCat.category_name}</div>}
            {catProducts.length === 0
              ? <div style={{ padding:'28px 0', textAlign:'center', color:'#bbb', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>📭</div>No products</div>
              : catProducts.map(p => (
                  <div key={p.product_id} onClick={() => { onProductSelect(p, hoveredCat); setOpen(false) }}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', borderRadius:9, border:'1px solid #f0f0f0', background:'#fff', cursor:'pointer', marginBottom:6, transition:'all 0.12s ease' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#fef2f2';e.currentTarget.style.borderColor='rgba(185,28,28,0.2)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.borderColor='#f0f0f0'}}>
                    <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13.5, fontWeight:500, color:'#1a1a1a', flex:1, marginRight:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</span>
                    <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#b91c1c', flexShrink:0 }}>₹{parseFloat(p.price).toLocaleString('en-IN', { minimumFractionDigits:2 })}</span>
                  </div>
                ))
            }
          </div>
        </div>
      )}
    </div>
  )
}

function SiteHeader({ cartCount, wishlistCount, onCategorySelect, onProductSelect, onHomeClick, activeNavCat, onCartClick }) {
  const catData = useCategoryData()
  const navCategories = catData?.categories || []
  const allNavProducts = catData?.allProducts || []
  const [searchVal, setSearchVal] = useState('')
  const [catVal, setCatVal] = useState('All Categories')
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [hoveredNavItem, setHoveredNavItem] = useState(null)
  const searchRef = useRef(null)
  const searchTimer = useRef(null)
  const navTimers = useRef({})

  useEffect(() => {
    const h = e => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const doSearch = async q => {
    if (!q.trim()) { setSearchResults(null); return }
    setSearchLoading(true)
    try {
      const r = await fetch('http://localhost:5000/searchProducts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ search:q.trim() }) })
      const j = await r.json()
      setSearchResults(j.success && Array.isArray(j.data) ? j.data : [])
    } catch { setSearchResults([]) }
    finally { setSearchLoading(false) }
  }

  return (
    <header className="site-header">
      <div className="site-topbar">
        <span className="site-tagline">Your one stop destination for all your needs!</span>
        <div className="site-topbar-links">
          <AuthHeaderSection />
          <div className="site-topbar-divider" />
          {[['Email :', 'contact@shivasystems.com'], ['Contact : +91', '9876543210'], ['Support :', '+91 1234567890']].map(([l, v], i) => (
            <React.Fragment key={i}>{i > 0 && <div className="site-topbar-divider" />}<div className="site-topbar-item"><span className="site-topbar-label">{l}</span><span className="site-topbar-val">{v}</span></div></React.Fragment>
          ))}
        </div>
      </div>

      <div className="site-mainbar">
        <div className="site-logo" onClick={onHomeClick}>
          <div className="site-logo-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#b91c1c" /><text x="14" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="sans-serif">✦</text></svg></div>
          <span className="site-logo-name">Shiva Systems</span>
        </div>
        <div className="site-searchbar" ref={searchRef} style={{ position:'relative' }}>
          <div className="site-search-cat">
            <select value={catVal} onChange={e => setCatVal(e.target.value)} className="site-search-catselect">
              <option value="All Categories">All Categories</option>
              {navCategories.map(c => <option key={c.category_id} value={c.category_name}>{c.category_name}</option>)}
            </select>
            <span className="site-search-canarrow">▾</span>
          </div>
          <div className="site-search-divider" />
          <input type="text" placeholder="Search for products ..." value={searchVal}
            onChange={e => { setSearchVal(e.target.value); clearTimeout(searchTimer.current); if (!e.target.value.trim()) { setSearchResults(null); return }; searchTimer.current = setTimeout(() => doSearch(e.target.value), 350) }}
            onKeyDown={e => e.key === 'Enter' && doSearch(searchVal)} className="site-search-input" />
          <button className="site-search-btn" onClick={() => doSearch(searchVal)} disabled={searchLoading} style={{ opacity:searchLoading?0.75:1, display:'flex', alignItems:'center', gap:7 }}>
            {searchLoading && <span style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(255,255,255,0.35)', borderTopColor:'#fff', animation:'spin 0.7s linear infinite', display:'inline-block' }} />}Search
          </button>
          {searchResults !== null && (
            <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, zIndex:3000, background:'#fff', borderRadius:'0 0 14px 14px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:'1px solid #e8e8e8', borderTop:'none', display:'flex', animation:'fadeUp 0.15s ease both', minHeight:100 }}>
              <div style={{ flex:1, borderRight:'1px solid #f0f0f0', minWidth:0 }}>
                <div style={{ padding:'10px 16px 8px', fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:'#ccc', letterSpacing:'0.1em', textTransform:'uppercase', borderBottom:'1px solid #f5f5f5' }}>Product Matches</div>
                {searchResults.length === 0
                  ? <div style={{ padding:'28px 16px', textAlign:'center', color:'#ccc', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}><div style={{ fontSize:28, marginBottom:8 }}>🔍</div>No results for "{searchVal}"</div>
                  : <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', maxHeight:340, overflowY:'auto' }}>
                      {searchResults.map((p, i) => (
                        <div key={p.product_id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 14px', cursor:'pointer', borderBottom:'1px solid #f8f8f8', borderRight:i%2===0?'1px solid #f5f5f5':'none', transition:'background 0.12s' }}
                          onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                          <div style={{ width:44, height:44, borderRadius:8, flexShrink:0, background:'#f5f5f3', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📦</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500, color:'#1a1a1a', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.product_name}</div>
                            <span style={{ fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700, color:'#1a1a1a' }}>₹{parseFloat(p.price).toLocaleString('en-IN')}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
              <div style={{ width:190, flexShrink:0, padding:'0 0 10px' }}>
                <div style={{ padding:'10px 14px 8px', fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:'#ccc', letterSpacing:'0.1em', textTransform:'uppercase', borderBottom:'1px solid #f5f5f5' }}>Suggestions</div>
                {[searchVal, `${searchVal} best price`, `${searchVal} gaming`, `${searchVal} review`].filter(Boolean).map((s, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', cursor:'pointer', fontSize:13, color:'#444', fontFamily:"'DM Sans',sans-serif", transition:'all 0.12s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#fef2f2';e.currentTarget.style.color='#b91c1c'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#444'}}
                    onClick={() => { setSearchVal(s); doSearch(s) }}>
                    <span style={{ color:'#ddd', fontSize:11 }}>🔍</span>
                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s}</span>
                  </div>
                ))}
                <div style={{ padding:'6px 14px 0', borderTop:'1px solid #f5f5f5', marginTop:4 }}>
                  <button onClick={() => setSearchResults(null)} style={{ width:'100%', padding:'6px', border:'1px solid #e8e8e8', borderRadius:6, background:'#fff', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:12, color:'#aaa', transition:'all 0.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#fdf2f2';e.currentTarget.style.color='#b94a48'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#aaa'}}>✕ Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="site-header-actions">
          <button className="site-hdr-action-btn" style={{ position:'relative' }}>
            <span className="site-hdr-icon">🤍</span>
            {wishlistCount > 0 && <span className="site-hdr-badge" key={wishlistCount} style={{ animation:'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>{wishlistCount}</span>}
          </button>
          <button className="site-hdr-action-btn site-cart-btn" onClick={onCartClick} style={{ position:'relative' }}>
            <span className="site-hdr-icon" style={{ position:'relative' }}>
              🛒
              {cartCount > 0 && <span className="site-hdr-badge" key={cartCount} style={{ animation:'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1) both' }}>{cartCount}</span>}
            </span>
            <span className="site-hdr-action-label">Your Cart<br /><strong>{cartCount > 0 ? `${cartCount} item${cartCount > 1 ? 's' : ''}` : 'Rs. 0.00'}</strong></span>
          </button>
        </div>
      </div>

      <nav className="site-navbar">
        <BrowseMegaMenu onCategorySelect={onCategorySelect} onProductSelect={onProductSelect} />
        <div className="site-nav-divider" />
        <div className="site-nav-links">
          <a href="#" onClick={e => { e.preventDefault(); onHomeClick() }} className={`site-nav-link${!activeNavCat ? ' active' : ''}`}>Home</a>
          {navCategories.map(cat => {
            const isActive = activeNavCat === cat.category_id
            const isHovered = hoveredNavItem === cat.category_id
            const catProds = allNavProducts.filter(p => p.category_id === cat.category_id)
            return (
              <div key={cat.category_id} style={{ position:'relative', display:'flex', alignItems:'stretch' }}
                onMouseEnter={() => { clearTimeout(navTimers.current[cat.category_id]); setHoveredNavItem(cat.category_id) }}
                onMouseLeave={() => { navTimers.current[cat.category_id] = setTimeout(() => setHoveredNavItem(n => n === cat.category_id ? null : n), 180) }}>
                <a href="#" onClick={e => { e.preventDefault(); onCategorySelect(cat) }}
                  className={`site-nav-link${isActive?' active':''}`}
                  style={{ display:'flex', alignItems:'center', gap:3 }}>
                  {cat.category_name}
                  {catProds.length > 0 && <span style={{ fontSize:9, marginLeft:2, opacity:0.5 }}>▾</span>}
                </a>
                {isHovered && catProds.length > 0 && (
                  <NavCategoryDropdown category={cat} allProducts={allNavProducts}
                    onProductSelect={(p, c) => { onProductSelect(p, c); setHoveredNavItem(null) }}
                    onCategoryClick={c => { onCategorySelect(c); setHoveredNavItem(null) }} />
                )}
              </div>
            )
          })}
        </div>
      </nav>
    </header>
  )
}

function PageTitleBar({ title, breadcrumb, onBreadcrumbClick }) {
  const isLast = i => i === breadcrumb.length - 1
  return (
    <div className="page-title-bar">
      <h2 className="page-title-text" key={title} style={{ animation:'fadeUp 0.22s ease both' }}>{title}</h2>
      <div className="page-breadcrumb">
        {breadcrumb.map((c, i) => (
          <span key={i} style={{ display:'inline-flex', alignItems:'center' }}>
            {i > 0 && <span className="breadcrumb-sep"> / </span>}
            {isLast(i)
              ? <span className="breadcrumb-link active">{c.label}</span>
              : <a href="#" onClick={e => { e.preventDefault(); onBreadcrumbClick && onBreadcrumbClick(i, c) }} className="breadcrumb-link clickable">{c.label}</a>
            }
          </span>
        ))}
      </div>
    </div>
  )
}

function ProductCardImage({ imageData, name, category }) {
  const src = useObjectUrl(imageData)
  if (src) {
    return (
      <div style={{ width:'100%', height:160, borderRadius:12, background:'#f9f9f9', display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
        <img src={src} alt={name} style={{ maxWidth:'100%', maxHeight:160, objectFit:'contain', display:'block' }} />
      </div>
    )
  }
  return <ProductThumb name={name} category={category} />
}

function safeNum(v) {
  const n = parseFloat(v)
  return isNaN(n) ? null : n
}

function normaliseProduct(p) {
  return {
    id:             p.product_id ?? p.id,
    name:           p.product_name ?? p.name ?? '',
    category:       p.category_name ?? p.category ?? '',
    category_id:    p.category_id ?? null,
    brand:          p.brand ?? '',
    price:          safeNum(p.price),
    original_price: safeNum(p.original_price) ?? safeNum(p.price),
    stock:          p.stock ?? 0,
    status:         p.status === 1 || p.status === 'active' ? 'active' : 'inactive',
    updated_at:     p.updated_at ?? null,
    firstImage:     p.product_images?.[0] ?? null,
    product_images: p.product_images ?? [],
    rating:         p.rating ?? 0,
    reviews:        p.reviews ?? 0,
  }
}

// ─── Main Products component ──────────────────────────────────────────────────
export default function Products() {
  const navigate = useNavigate()
  const [page, setPage] = useState('products')

  const [cart, setCart]           = useState(() => {
    try {
      const saved = localStorage.getItem('cart')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [wishlist, setWishlist]   = useState([])
  const [cartOpen, setCartOpen]   = useState(false)

  const [products, setProducts]         = useState([])
  const [totalCount, setTotalCount]     = useState(0)
  const [productsLoading, setProductsLoading] = useState(true)
  const [currentPage, setCurrentPage]   = useState(1)
  const [viewMode, setViewMode]         = useState('grid')
  const [quickViewProduct, setQuickViewProduct] = useState(null)
  const [toasts, setToasts]             = useState([])

  const [priceMin, setPriceMin]           = useState(0)
  const [priceMax, setPriceMax]           = useState(9999999)
  const [priceFiltered, setPriceFiltered] = useState(null)
  const [priceFilterLoading, setPriceFilterLoading] = useState(false)
  const priceDebounceTimer = useRef(null)
  const priceChanged = useRef(false)

  const [brands, setBrands]                   = useState([])
  const [brandsLoading, setBrandsLoading]     = useState(true)
  const [selectedBrandIds, setSelectedBrandIds] = useState([])
  const [brandFiltered, setBrandFiltered]     = useState(null)
  const [brandFilterLoading, setBrandFilterLoading] = useState(false)

  const [apiCategories, setApiCategories]         = useState([])
  const [apiCategoriesLoading, setApiCategoriesLoading] = useState(true)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([])
  const [categoryFiltered, setCategoryFiltered]   = useState(null)
  const [categoryFilterLoading, setCategoryFilterLoading] = useState(false)
  const [allCategoryProducts, setAllCategoryProducts] = useState([])

  const [sortBy, setSortBy]           = useState('relevance')
  const [searchQuery, setSearchQuery] = useState('')
  const [inlineSearchResults, setInlineSearchResults] = useState(null)
  const [inlineSearchLoading, setInlineSearchLoading] = useState(false)
  const inlineSearchTimer = useRef(null)
  const inlineSearchRef   = useRef(null)
  const [priceOpen, setPriceOpen]     = useState(true)
  const [brandOpen, setBrandOpen]     = useState(true)
  const [catFilterOpen, setCatFilterOpen] = useState(true)
  const [hoveredCard, setHoveredCard] = useState(null)

  const [pageTitle, setPageTitle]   = useState('All Products')
  const [breadcrumb, setBreadcrumb] = useState([{ label:'Home', type:'home' }])
  const [activeNavCat, setActiveNavCat] = useState(null)

  const totalPages    = Math.ceil(totalCount / PAGE_LIMIT)
  const cartCount     = cart.length
  const wishlistCount = wishlist.length

  // ── Persist cart to localStorage on every change ─────────────────────────
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart))
  }, [cart])

  if (page === 'checkout') {
    return (
      <Checkout
        cart={cart}
        onBack={() => setPage('products')}
        onSuccess={() => {
          setCart([])
          setPage('products')
          addToast('🎉 Order placed successfully!', 'success')
        }}
      />
    )
  }

  useEffect(() => {
    const h = e => { if (inlineSearchRef.current && !inlineSearchRef.current.contains(e.target)) setInlineSearchResults(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const doInlineSearch = useCallback(async q => {
    if (!q.trim()) { setInlineSearchResults(null); return }
    setInlineSearchLoading(true)
    try {
      const r = await fetch('http://localhost:5000/searchProducts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ search:q.trim() }) })
      const j = await r.json()
      setInlineSearchResults(j.success && Array.isArray(j.data) ? j.data.map(normaliseProduct) : [])
    } catch { setInlineSearchResults([]) }
    finally { setInlineSearchLoading(false) }
  }, [])

  useEffect(() => {
    setBrandsLoading(true)
    fetch('http://localhost:5000/filter-brand', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'allbrand' }) })
      .then(r => r.json()).then(json => { if (json.success && Array.isArray(json.data)) setBrands(json.data) })
      .catch(() => {}).finally(() => setBrandsLoading(false))
  }, [])

  const fetchFilteredByBrand = useCallback(async brandIds => {
    if (brandIds.length === 0) { setBrandFiltered(null); return }
    setBrandFilterLoading(true)
    try {
      const res  = await fetch('http://localhost:5000/filter-brand', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ brand_ids:brandIds }) })
      const json = await res.json()
      setBrandFiltered(json.success && Array.isArray(json.data) ? json.data.map(normaliseProduct) : [])
    } catch { setBrandFiltered(null) }
    finally { setBrandFilterLoading(false) }
  }, [])

  const handleBrandToggle = brandId => {
    setSelectedBrandIds(prev => {
      const next = prev.includes(brandId) ? prev.filter(id => id !== brandId) : [...prev, brandId]
      fetchFilteredByBrand(next); return next
    })
  }
  const resetBrandFilter = () => { setSelectedBrandIds([]); setBrandFiltered(null) }

  useEffect(() => {
    setApiCategoriesLoading(true)
    fetch('http://localhost:5000/filter-category', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ type:'allcategory' }) })
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setAllCategoryProducts(json.data)
          const seen = new Map()
          json.data.forEach(p => { if (p.category_id && !seen.has(p.category_id)) seen.set(p.category_id, p.category_name || `Category ${p.category_id}`) })
          setApiCategories([...seen.entries()].map(([id, name]) => ({ category_id:id, category_name:name })))
        }
      }).catch(() => {}).finally(() => setApiCategoriesLoading(false))
  }, [])

  const applyCategoriFilter = useCallback((categoryIds, allProds) => {
    if (categoryIds.length === 0) { setCategoryFiltered(null); return }
    setCategoryFilterLoading(true)
    setCategoryFiltered(allProds.filter(p => categoryIds.includes(p.category_id)).map(normaliseProduct))
    setCategoryFilterLoading(false)
  }, [])

  const handleCategoryToggle = categoryId => {
    setSelectedCategoryIds(prev => {
      const next = prev.includes(categoryId) ? prev.filter(id => id !== categoryId) : [...prev, categoryId]
      applyCategoriFilter(next, allCategoryProducts); return next
    })
  }
  const resetCategoryFilter = () => { setSelectedCategoryIds([]); setCategoryFiltered(null) }

  const handleHomeClick = useCallback(() => {
    setSelectedCategoryIds([]); setCategoryFiltered(null)
    setSelectedBrandIds([]); setBrandFiltered(null)
    priceChanged.current = false; setPriceMin(0); setPriceMax(9999999); setPriceFiltered(null)
    setSearchQuery(''); setCurrentPage(1); setActiveNavCat(null)
    setPageTitle('All Products'); setBreadcrumb([{ label:'Home', type:'home' }])
  }, [])

  const handleNavCategorySelect = useCallback(cat => {
    setPriceFiltered(null); priceChanged.current = false; setPriceMin(0); setPriceMax(9999999)
    setBrandFiltered(null); setSelectedBrandIds([])
    setSearchQuery(''); setCurrentPage(1)
    setSelectedCategoryIds([cat.category_id])
    applyCategoriFilter([cat.category_id], allCategoryProducts)
    setActiveNavCat(cat.category_id)
    setPageTitle(cat.category_name)
    setBreadcrumb([{ label:'Home', type:'home' }, { label:cat.category_name, type:'category', payload:cat }])
  }, [allCategoryProducts, applyCategoriFilter])

  const handleProductSelect = useCallback((product, cat) => {
    setPriceFiltered(null); priceChanged.current = false; setPriceMin(0); setPriceMax(9999999)
    setBrandFiltered(null); setSelectedBrandIds([])
    setSearchQuery(''); setCurrentPage(1)
    setSelectedCategoryIds([cat.category_id])
    applyCategoriFilter([cat.category_id], allCategoryProducts)
    setActiveNavCat(cat.category_id)
    setPageTitle(product.product_name)
    setBreadcrumb([{ label:'Home', type:'home' }, { label:cat.category_name, type:'category', payload:cat }, { label:product.product_name, type:'leaf' }])
  }, [allCategoryProducts, applyCategoriFilter])

  const handleBreadcrumbClick = useCallback((index, crumb) => {
    if (crumb.type === 'home') handleHomeClick()
    else if (crumb.type === 'category' && crumb.payload) handleNavCategorySelect(crumb.payload)
  }, [handleHomeClick, handleNavCategorySelect])

  const fetchProducts = useCallback(async (page = 1) => {
    setProductsLoading(true)
    try {
      const res  = await fetch('http://localhost:5000/displayProducts', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'displayProducts', page }),
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setProducts(json.data.map(normaliseProduct))
        const total = json.total_count ?? json.totalCount ?? json.total ?? json.count ?? null
        if (total !== null && !isNaN(parseInt(total))) {
          setTotalCount(parseInt(total))
        } else if (json.data.length === PAGE_LIMIT) {
          setTotalCount((page * PAGE_LIMIT) + PAGE_LIMIT)
        } else {
          setTotalCount((page - 1) * PAGE_LIMIT + json.data.length)
        }
      }
    } catch {} finally { setProductsLoading(false) }
  }, [])

  useEffect(() => { fetchProducts(currentPage) }, [currentPage, fetchProducts])

  const fetchFilteredByPrice = useCallback(async (min, max) => {
    if (min === 0 && max === 9999999) { setPriceFiltered(null); return }
    setPriceFilterLoading(true)
    try {
      const res  = await fetch('http://localhost:5000/filter-price', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ min_price:min, max_price:max===9999999?9999999:max }) })
      const json = await res.json()
      setPriceFiltered(json.success && Array.isArray(json.data) ? json.data.map(normaliseProduct) : [])
    } catch { setPriceFiltered(null) }
    finally { setPriceFilterLoading(false) }
  }, [])

  useEffect(() => {
    if (!priceChanged.current) return
    clearTimeout(priceDebounceTimer.current)
    priceDebounceTimer.current = setTimeout(() => fetchFilteredByPrice(priceMin, priceMax), 600)
    return () => clearTimeout(priceDebounceTimer.current)
  }, [priceMin, priceMax, fetchFilteredByPrice])

  const handlePriceMinChange = val => { priceChanged.current = true; setPriceMin(val) }
  const handlePriceMaxChange = val => { priceChanged.current = true; setPriceMax(val) }
  const resetPriceFilter = () => { priceChanged.current = false; setPriceMin(0); setPriceMax(9999999); setPriceFiltered(null) }

  const addToast = (message, type = 'success') => {
    const id = Date.now(); setToasts(p => [...p, { id, message, type }])
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500)
  }
  const removeToast = id => setToasts(p => p.filter(t => t.id !== id))

  // ── Cart / wishlist ───────────────────────────────────────────────────────
  const handleAddToCart = product => {
    setCart(prev => {
      if (prev.find(i => i.id === product.id)) { addToast(`Already in cart — ${product.name}`, 'info'); return prev }
      addToast(`Added to cart — ${product.name}`, 'success')
      return [...prev, { id:product.id, name:product.name, price:product.price, firstImage:product.firstImage, stock:product.stock, quantity:1 }]
    })
  }
  const handleRemoveFromCart = productId => {
    setCart(prev => {
      const item = prev.find(i => i.id === productId)
      if (item) addToast(`Removed — ${item.name}`, 'info')
      return prev.filter(i => i.id !== productId)
    })
  }

  // ── Update quantity in cart ───────────────────────────────────────────────
  const handleUpdateQuantity = (productId, newQty) => {
    setCart(prev => {
      if (newQty < 1) {
        const item = prev.find(i => i.id === productId)
        if (item) addToast(`Removed — ${item.name}`, 'info')
        return prev.filter(i => i.id !== productId)
      }
      return prev.map(i => i.id === productId ? { ...i, quantity: Math.min(newQty, i.stock || 99) } : i)
    })
  }

  const handleClearCart = () => { setCart([]); addToast('Cart cleared', 'info') }

  const handleToggleWishlist = product => {
    setWishlist(prev => {
      const exists = prev.find(i => i.id === product.id)
      if (exists) { addToast('Removed from wishlist', 'info'); return prev.filter(i => i.id !== product.id) }
      addToast(`Saved to wishlist — ${product.name}`, 'success')
      return [...prev, { id:product.id, name:product.name, price:product.price }]
    })
  }

  const handleProceedToCheckout = async () => {
    setCartOpen(false)
    try {
      const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
      const userId = storedUser?.usercode
                  || storedUser?.user_id
                  || storedUser?.id
                  || storedUser?.userId
                  || storedUser?.user?.id
                  || storedUser?.user?.user_id

      if (userId) {
        const res = await fetch('http://localhost:5000/user-details', {
          method  : 'POST',
          headers : { 'Content-Type': 'application/json' },
          body    : JSON.stringify({ type: 'userDetails', user_id: userId }),
        })
        const json = await res.json()
        if (json.success && json.data) {
          localStorage.setItem('checkoutUser', JSON.stringify({
            ...storedUser,
            mobile : json.data.mobile || '',
            email  : json.data.email  || storedUser.email || '',
            name   : json.data.username || storedUser.username || '',
          }))
        }
      }
    } catch (err) {
      console.error('user-details fetch failed:', err)
    }

    navigate('/checkout')
  }

  const fmt  = n => n != null ? new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(n) : '—'
  const disc = (o, s) => o && s && o > s ? Math.round((1 - s/o) * 100) : 0

  const goToPage = p => { if (p >= 1 && p <= totalPages) setCurrentPage(p) }
  const getPages = () => {
    if (totalPages <= 7) return Array.from({ length:totalPages }, (_, i) => i + 1)
    const p = [], l = Math.max(2, currentPage-1), r = Math.min(totalPages-1, currentPage+1)
    p.push(1); if (l > 2) p.push('...'); for (let i = l; i <= r; i++) p.push(i); if (r < totalPages-1) p.push('...'); p.push(totalPages)
    return p
  }

  const baseProducts = (() => {
    const sources = [brandFiltered, priceFiltered, categoryFiltered].filter(v => v !== null)
    if (sources.length === 0) return products
    const [first, ...rest] = sources
    if (rest.length === 0) return first
    const restIds = rest.map(s => new Set(s.map(p => p.id)))
    return first.filter(p => restIds.every(ids => ids.has(p.id)))
  })()

  const filtered = baseProducts.filter(p => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'price_asc')  return (a.price??0) - (b.price??0)
    if (sortBy === 'price_desc') return (b.price??0) - (a.price??0)
    if (sortBy === 'name')       return (a.name||'').localeCompare(b.name||'')
    if (sortBy === 'discount')   return disc(b.original_price,b.price) - disc(a.original_price,a.price)
    return 0
  })

  const isPriceFilterActive    = priceFiltered !== null
  const isBrandFilterActive    = brandFiltered !== null
  const isCategoryFilterActive = categoryFiltered !== null
  const isAnyFilterActive      = isPriceFilterActive || isBrandFilterActive || isCategoryFilterActive

  const sliderMin = Math.min(priceMin, 200000)
  const sliderMax = Math.min(priceMax === 9999999 ? 200000 : priceMax, 200000)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin        { to { transform:rotate(360deg); } }
        @keyframes fadeIn      { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp      { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn     { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes qvIn        { from{opacity:0;transform:scale(0.93) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes toastDrop   { from{opacity:0;transform:translateY(-16px) scale(0.92)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes badgePop    { 0%{transform:scale(0)} 70%{transform:scale(1.35)} 100%{transform:scale(1)} }
        @keyframes floatUp     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse       { 0%,100%{opacity:1} 50%{opacity:0.45} }
        @keyframes drawerSlide { from{transform:translateX(100%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes cartItemIn  { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        * { box-sizing:border-box; margin:0; padding:0; }

        .site-header { background:#fff; border-bottom:1px solid #e8e8e8; font-family:'DM Sans',sans-serif; }
        .site-topbar { background:#f8f8f6; border-bottom:1px solid #ececec; padding:8px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .site-tagline { color:#333; font-weight:600; font-size:13px; }
        .site-topbar-links { display:flex; align-items:center; gap:0; }
        .site-topbar-item { display:flex; flex-direction:column; padding:0 16px; line-height:1.5; }
        .site-topbar-label { color:#999; font-size:11px; font-weight:500; }
        .site-topbar-val { color:#111; font-weight:700; font-size:13px; }
        .site-topbar-divider { width:1px; height:28px; background:#e4e4e4; flex-shrink:0; }
        .site-topbar-auth { display:flex; align-items:center; gap:6px; padding-right:10px; }
        .site-auth-icon-btn { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; background:transparent; border:1.5px solid rgba(185,28,28,0.4); color:#b91c1c; }
        .site-auth-icon-btn:hover { background:#fef2f2; border-color:#b91c1c; transform:translateY(-1px); box-shadow:0 3px 10px rgba(185,28,28,0.15); }
        .site-auth-icon-btn svg { flex-shrink:0; }
        .site-auth-icon-register { background:#b91c1c; border-color:#b91c1c; color:#fff; box-shadow:0 2px 8px rgba(185,28,28,0.25); }
        .site-auth-icon-register:hover { background:#991b1b; border-color:#991b1b; box-shadow:0 4px 14px rgba(185,28,28,0.35); }
        .site-mainbar { padding:14px 24px; display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
        .site-logo { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; text-decoration:none; }
        .site-logo-icon { display:flex; }
        .site-logo-name { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#1a1a1a; }
        .site-searchbar { flex:1; min-width:280px; max-width:860px; display:flex; align-items:stretch; border:1.5px solid #e4e4e4; border-radius:9px; overflow:hidden; height:48px; transition:border-color 0.2s ease; }
        .site-searchbar:focus-within { border-color:rgba(185,28,28,0.42); }
        .site-search-cat { display:flex; align-items:center; background:#f6f6f4; border-right:1px solid #e8e8e8; padding:0 12px; position:relative; min-width:136px; }
        .site-search-catselect { background:transparent; border:none; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#444; cursor:pointer; padding-right:18px; width:100%; appearance:none; }
        .site-search-canarrow { position:absolute; right:10px; color:#aaa; font-size:10px; pointer-events:none; }
        .site-search-divider { width:1px; background:#e8e8e8; flex-shrink:0; }
        .site-search-input { flex:1; border:none; outline:none; padding:0 16px; font-family:'DM Sans',sans-serif; font-size:14px; color:#333; background:#fff; }
        .site-search-input::placeholder { color:#ccc; }
        .site-search-btn { background:#b91c1c; color:#fff; border:none; padding:0 22px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; cursor:pointer; transition:background 0.15s; white-space:nowrap; display:flex; align-items:center; gap:6px; }
        .site-search-btn:hover { background:#991b1b; }
        .site-header-actions { display:flex; align-items:center; gap:8px; margin-left:auto; flex-shrink:0; }
        .site-hdr-action-btn { display:flex; align-items:center; gap:9px; background:none; border:none; cursor:pointer; padding:8px 10px; border-radius:9px; transition:background 0.15s; font-family:'DM Sans',sans-serif; font-size:12px; color:#444; position:relative; }
        .site-hdr-action-btn:hover { background:#f5f5f3; }
        .site-hdr-icon { font-size:20px; }
        .site-hdr-action-label { text-align:left; font-size:12px; color:#666; line-height:1.5; }
        .site-hdr-action-label strong { display:block; font-size:13px; color:#1a1a1a; }
        .site-hdr-badge { position:absolute; top:4px; right:4px; background:#b91c1c; color:#fff; font-size:9px; font-weight:800; min-width:17px; height:17px; border-radius:9px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; padding:0 3px; font-family:'DM Sans',sans-serif; }
        .site-cart-btn { border:1.5px solid #e8e8e8 !important; border-radius:10px !important; }
        .site-cart-btn:hover { background:#fef2f2 !important; border-color:rgba(185,28,28,0.3) !important; }
        .site-navbar { background:#fff; border-top:1px solid #f0f0f0; padding:0 24px; display:flex; align-items:stretch; min-height:44px; }
        .site-browse-btn { display:flex; align-items:center; gap:8px; background:none; border:none; border-right:1px solid #f0f0f0; padding:0 18px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#222; cursor:pointer; white-space:nowrap; transition:color 0.15s,background 0.15s; }
        .site-browse-btn:hover { color:#b91c1c; background:#fef2f2; }
        .site-nav-divider { width:1px; background:#f0f0f0; margin:8px 0; }
        .site-nav-links { display:flex; align-items:stretch; flex:1; overflow-x:auto; scrollbar-width:none; }
        .site-nav-links::-webkit-scrollbar { display:none; }
        .site-nav-link { display:flex; align-items:center; gap:3px; padding:0 14px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#444; text-decoration:none; white-space:nowrap; border-bottom:2px solid transparent; transition:all 0.15s; }
        .site-nav-link:hover,.site-nav-link.active { color:#b91c1c; border-bottom-color:#b91c1c; }
        .site-nav-link.active { font-weight:600; }
        .page-title-bar { background:#fff; padding:20px 24px 16px; border-bottom:1px solid #f0f0f0; text-align:center; }
        .page-title-text { font-family:'Syne',sans-serif; font-size:24px; font-weight:700; color:#1a1a1a; margin:0 0 5px; }
        .page-breadcrumb { font-size:13px; color:#bbb; display:flex; align-items:center; justify-content:center; flex-wrap:wrap; gap:0; }
        .breadcrumb-link { color:#bbb; text-decoration:none; font-family:'DM Sans',sans-serif; }
        .breadcrumb-link.clickable { color:#b91c1c; cursor:pointer; font-weight:500; transition:color 0.15s; }
        .breadcrumb-link.clickable:hover { color:#991b1b; text-decoration:underline; }
        .breadcrumb-link.active { color:#555; font-weight:600; cursor:default; }
        .breadcrumb-sep { color:#ddd; margin:0 4px; user-select:none; }
        .shop-layout { display:flex; align-items:flex-start; background:#f2f2f0; min-height:600px; }
        .shop-sidebar { width:256px; flex-shrink:0; background:#fff; border-right:1px solid #ebebeb; min-height:600px; }
        .filter-block { border-bottom:1px solid #f0f0f0; }
        .filter-header { display:flex; align-items:center; justify-content:space-between; padding:15px 20px; cursor:pointer; user-select:none; transition:background 0.12s; }
        .filter-header:hover { background:#fafaf8; }
        .filter-title { font-family:'DM Sans',sans-serif; font-size:11px; font-weight:700; color:#999; letter-spacing:0.08em; text-transform:uppercase; }
        .filter-arrow { font-size:10px; color:#ccc; transition:transform 0.2s ease; }
        .filter-body { padding:4px 20px 16px; animation:fadeIn 0.15s ease; }
        .price-inputs { display:flex; align-items:center; gap:8px; margin-bottom:14px; }
        .price-input { width:78px; padding:6px 10px; border:1.5px solid #e8e8e8; border-radius:7px; font-family:'DM Sans',sans-serif; font-size:13px; color:#333; outline:none; text-align:center; transition:border-color 0.15s; }
        .price-input:focus { border-color:rgba(185,28,28,0.4); }
        .price-input.active { border-color:rgba(185,28,28,0.5); background:#fef2f2; }
        .price-dash { color:#ccc; font-size:13px; }
        .range-wrap { position:relative; height:20px; margin-bottom:6px; }
        .range-track { position:absolute; top:50%; left:0; right:0; height:4px; background:#efefef; border-radius:2px; transform:translateY(-50%); }
        .range-fill { position:absolute; top:0; height:100%; background:#b91c1c; border-radius:2px; }
        .range-slider { position:absolute; top:50%; width:100%; height:4px; background:transparent; transform:translateY(-50%); outline:none; appearance:none; pointer-events:none; }
        .range-slider::-webkit-slider-thumb { appearance:none; width:16px; height:16px; border-radius:50%; background:#fff; border:2.5px solid #b91c1c; cursor:pointer; pointer-events:all; box-shadow:0 1px 6px rgba(0,0,0,0.14); }
        .range-labels { display:flex; justify-content:space-between; font-size:9px; color:#ccc; margin-top:4px; }
        .brand-row { display:flex; align-items:center; gap:9px; padding:5px 0; cursor:pointer; }
        .brand-row:hover .brand-name { color:#b91c1c; }
        .brand-check { accent-color:#b91c1c; width:14px; height:14px; cursor:pointer; flex-shrink:0; }
        .brand-name { font-size:13px; color:#444; flex:1; transition:color 0.15s; font-family:'DM Sans',sans-serif; }
        .shop-main { flex:1; padding:20px; min-width:0; }
        .shop-toolbar { display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #ebebeb; border-radius:11px; padding:10px 16px; margin-bottom:16px; gap:12px; flex-wrap:wrap; box-shadow:0 1px 6px rgba(0,0,0,0.04); }
        .shop-toolbar-left { display:flex; align-items:center; gap:12px; }
        .shop-toolbar-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .shop-view-btns { display:flex; border:1px solid #e8e8e8; border-radius:8px; overflow:hidden; }
        .shop-view-btn { width:34px; height:34px; border:none; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#ccc; transition:all 0.15s; }
        .shop-view-btn.active { background:#b91c1c; color:#fff; }
        .shop-view-btn:hover:not(.active) { background:#f5f5f3; color:#666; }
        .shop-count { font-family:'DM Sans',sans-serif; font-size:13.5px; color:#bbb; }
        .shop-count strong { color:#1a1a1a; }
        .shop-search-inline { display:flex; align-items:center; gap:6px; border:1px solid #e8e8e8; border-radius:8px; padding:7px 13px; background:#fff; transition:border-color 0.15s; }
        .shop-search-inline:focus-within { border-color:rgba(185,28,28,0.38); }
        .shop-search-input { border:none; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; color:#333; width:140px; background:transparent; }
        .shop-search-input::placeholder { color:#ddd; }
        .shop-sort-wrap { position:relative; }
        .shop-sort-select { appearance:none; border:1px solid #e8e8e8; border-radius:8px; padding:8px 30px 8px 12px; font-family:'DM Sans',sans-serif; font-size:13px; color:#444; background:#fff; cursor:pointer; outline:none; min-width:148px; transition:border-color 0.15s; }
        .shop-sort-select:focus { border-color:rgba(185,28,28,0.38); }
        .shop-sort-arrow { position:absolute; right:10px; top:50%; transform:translateY(-50%); color:#aaa; font-size:10px; pointer-events:none; }
        .shop-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; }
        @media(max-width:1200px){.shop-grid{grid-template-columns:repeat(3,1fr)}}
        @media(max-width:900px){.shop-grid{grid-template-columns:repeat(2,1fr)}}
        .shop-card { background:#fff; border:1px solid #efefef; border-radius:13px; overflow:hidden; transition:box-shadow 0.25s ease,transform 0.22s ease,border-color 0.22s ease; animation:fadeUp 0.35s ease both; }
        .shop-card-img-wrap { position:relative; padding:12px 12px 0; overflow:visible; }
        .shop-disc-badge { position:absolute; top:16px; left:16px; z-index:3; background:linear-gradient(135deg,#e03030,#c52020); color:#fff; font-size:10px; font-weight:700; padding:3px 8px; border-radius:5px; font-family:'DM Sans',sans-serif; }
        .shop-side-actions { position:absolute; top:14px; right:14px; z-index:4; display:flex; flex-direction:column; gap:7px; }
        .shop-side-btn { width:34px; height:34px; border-radius:9px; border:1px solid #eaeaea; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:15px; box-shadow:0 2px 10px rgba(0,0,0,0.08); transition:all 0.18s ease; position:relative; }
        .shop-side-btn:hover { transform:scale(1.1); box-shadow:0 4px 14px rgba(0,0,0,0.13); }
        .shop-side-btn.is-wished { background:#fdf2f2; border-color:rgba(185,74,72,0.28); }
        .shop-side-btn.is-qv { background:#b91c1c; border-color:#b91c1c; }
        .shop-side-btn.is-qv:hover { background:#991b1b; }
        .shop-side-btn::after { content:attr(data-tip); position:absolute; right:calc(100% + 9px); top:50%; transform:translateY(-50%); background:#1a1a1a; color:#fff; font-size:11px; font-weight:500; font-family:'DM Sans',sans-serif; white-space:nowrap; padding:5px 9px; border-radius:6px; opacity:0; pointer-events:none; transition:opacity 0.15s; }
        .shop-side-btn:hover::after { opacity:1; }
        .shop-card-body { padding:13px; }
        .shop-card-name { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:#1a1a1a; line-height:1.42; margin-bottom:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
        .shop-card-brand { font-size:11px; color:#bbb; margin-bottom:9px; font-family:'DM Sans',sans-serif; }
        .shop-card-price-row { display:flex; align-items:center; gap:6px; margin-bottom:10px; flex-wrap:wrap; }
        .shop-card-price { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:#e03030; }
        .shop-card-orig { font-size:12px; color:#ccc; text-decoration:line-through; font-family:'DM Sans',sans-serif; }
        .shop-oos-btn { width:100%; padding:9px; background:#f5f5f3; color:#ccc; border:1px solid #efefef; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:600; cursor:not-allowed; }
        .shop-cart-btn { width:100%; padding:9px; background:#f4b400; color:#1a1a1a; border:none; border-radius:8px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:700; cursor:pointer; transition:background 0.15s,transform 0.12s,box-shadow 0.15s; display:flex; align-items:center; justify-content:center; gap:6px; }
        .shop-cart-btn:hover { background:#e0a500; transform:translateY(-1px); box-shadow:0 4px 14px rgba(244,180,0,0.3); }
        .shop-qty-row { display:flex; align-items:center; gap:8px; margin-top:8px; }
        .prod-tableWrapper { overflow-x:auto; }
        .prod-table { width:100%; border-collapse:collapse; min-width:700px; }
        .prod-table thead tr { background:#fafaf8; border-bottom:1px solid #f0f0f0; }
        .prod-table th { padding:13px 18px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.09em; color:#bbb; text-align:left; white-space:nowrap; }
        .prod-table tbody tr { border-bottom:1px solid #f5f5f3; transition:background 0.12s; }
        .prod-table tbody tr:last-child { border-bottom:none; }
        .prod-table tbody tr:hover { background:#fafaf8; }
        .prod-table td { padding:13px 18px; font-size:14px; color:#444; vertical-align:middle; }
        .prod-tblActions { display:flex; gap:8px; align-items:center; }
        .prod-cart-btn-sm { display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px; border:none; background:#f4b400; color:#1a1a1a; font-family:'DM Sans',sans-serif; font-size:12.5px; font-weight:700; cursor:pointer; transition:all 0.15s; white-space:nowrap; }
        .prod-cart-btn-sm:hover { background:#e0a500; transform:translateY(-1px); box-shadow:0 3px 10px rgba(244,180,0,0.3); }
        .prod-cart-btn-sm:disabled { background:#f5f5f3; color:#ccc; cursor:not-allowed; transform:none; box-shadow:none; }
        .prod-qvBtn { width:33px; height:33px; border-radius:8px; border:1px solid #e8e8e8; background:#fef2f2; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all 0.15s; }
        .prod-qvBtn:hover { background:#fecaca; transform:scale(1.08); border-color:rgba(185,28,28,0.3); }
        .prod-pagination { padding:22px 20px 18px; border-top:1px solid #f0f0f0; display:flex; flex-direction:column; align-items:center; gap:10px; background:#fff; border-radius:0 0 13px 13px; }
        .prod-paginationControls { display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:center; }
        .prod-pageBtn { min-width:36px; height:36px; padding:0 8px; border-radius:9px; border:1px solid #e8e8e8; background:#fff; cursor:pointer; font-size:13.5px; color:#555; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-family:'DM Sans',sans-serif; font-weight:500; }
        .prod-pageBtn:hover:not(:disabled):not(.active) { background:#fef2f2; border-color:rgba(185,28,28,0.3); color:#b91c1c; }
        .prod-pageBtn.active { background:#b91c1c; color:#fff; border-color:#b91c1c; font-weight:700; box-shadow:0 2px 10px rgba(185,28,28,0.3); }
        .prod-pageBtn:disabled { opacity:0.3; cursor:not-allowed; }
        .prod-pageEllipsis { color:#ccc; font-size:15px; padding:0 4px; }
        .prod-empty { text-align:center; padding:64px 20px; color:#ccc; font-family:'DM Sans',sans-serif; }
        .prod-emptyIcon { font-size:44px; margin-bottom:12px; }
        .price-filter-status,.brand-filter-status { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:6px 10px; background:#fef2f2; border:1px solid rgba(185,28,28,0.2); border-radius:8px; }
        .price-filter-status-text,.brand-filter-status-text { font-size:11px; font-weight:600; color:#b91c1c; font-family:'DM Sans',sans-serif; }
        .price-filter-reset,.brand-filter-reset { background:none; border:none; cursor:pointer; font-size:11px; color:#b94a48; font-family:'DM Sans',sans-serif; font-weight:600; padding:0; }
        .price-filter-reset:hover,.brand-filter-reset:hover { text-decoration:underline; }
        .brand-skeleton { height:22px; border-radius:5px; background:#f0f0ee; margin-bottom:8px; animation:pulse 1.3s ease infinite; }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />
      {quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          onAddToWishlist={handleToggleWishlist}
          isWishlisted={!!wishlist.find(i => i.id === quickViewProduct.id)}
          cartItem={cart.find(i => i.id === quickViewProduct.id) || null}
          onUpdateQuantity={handleUpdateQuantity}
        />
      )}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={handleRemoveFromCart}
          onClearAll={handleClearCart}
          onProceedToCheckout={handleProceedToCheckout}
          onUpdateQuantity={handleUpdateQuantity}
        />
      )}
      <SiteHeader cartCount={cartCount} wishlistCount={wishlistCount} onCategorySelect={handleNavCategorySelect} onProductSelect={handleProductSelect} onHomeClick={handleHomeClick} activeNavCat={activeNavCat} onCartClick={() => setCartOpen(true)} />
      <PageTitleBar title={pageTitle} breadcrumb={breadcrumb} onBreadcrumbClick={handleBreadcrumbClick} />

      <div className="shop-layout">
        {/* ── Sidebar ──────────────────────────────────────────────────────── */}
        <aside className="shop-sidebar">
          {/* Price filter */}
          <div className="filter-block">
            <div className="filter-header" onClick={() => setPriceOpen(p => !p)}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="filter-title">Filter by Price</span>
                {isPriceFilterActive && <span style={{ width:7, height:7, borderRadius:'50%', background:'#b91c1c', flexShrink:0, animation:'pulse 1.5s ease infinite' }}/>}
              </div>
              <span className="filter-arrow" style={{ transform:priceOpen?'rotate(180deg)':'none' }}>▼</span>
            </div>
            {priceOpen && <div className="filter-body">
              {isPriceFilterActive && (
                <div className="price-filter-status">
                  <span className="price-filter-status-text">{priceFilterLoading ? '⏳ Filtering…' : `✓ ${priceFiltered.length} result${priceFiltered.length!==1?'s':''} found`}</span>
                  <button className="price-filter-reset" onClick={resetPriceFilter}>Reset</button>
                </div>
              )}
              <div className="price-inputs">
                <input className={`price-input${isPriceFilterActive?' active':''}`} type="number" placeholder="Min"
                  value={priceMin === 0 ? '' : priceMin} onChange={e => handlePriceMinChange(Math.max(0, Number(e.target.value||0)))}/>
                <span className="price-dash">—</span>
                <input className={`price-input${isPriceFilterActive?' active':''}`} type="number" placeholder="Max"
                  value={priceMax === 9999999 ? '' : priceMax} onChange={e => handlePriceMaxChange(Number(e.target.value||9999999))}/>
              </div>
              <div className="range-wrap">
                <div className="range-track">
                  <div className="range-fill" style={{ left:`${Math.min((sliderMin/200000)*100,100)}%`, width:`${Math.min(((sliderMax-sliderMin)/200000)*100,100)}%` }}/>
                </div>
                <input type="range" min={0} max={200000} step={100} value={sliderMin}
                  onChange={e => handlePriceMinChange(Math.min(Number(e.target.value), sliderMax-100))} className="range-slider"/>
                <input type="range" min={0} max={200000} step={100} value={sliderMax}
                  onChange={e => handlePriceMaxChange(Math.max(Number(e.target.value), sliderMin+100))} className="range-slider"/>
              </div>
              <div className="range-labels"><span>₹0</span><span>50K</span><span>1L</span><span>1.5L</span><span>2L+</span></div>
              {priceFilterLoading && <div style={{ display:'flex', alignItems:'center', gap:7, marginTop:10, color:'#b91c1c', fontFamily:"'DM Sans',sans-serif", fontSize:12 }}><span style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(185,28,28,0.25)', borderTopColor:'#b91c1c', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }}/>Fetching prices…</div>}
            </div>}
          </div>

          {/* Brand filter */}
          <div className="filter-block">
            <div className="filter-header" onClick={() => setBrandOpen(p => !p)}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="filter-title">Filter by Brand</span>
                {isBrandFilterActive && <span style={{ width:7, height:7, borderRadius:'50%', background:'#b91c1c', flexShrink:0, animation:'pulse 1.5s ease infinite' }}/>}
              </div>
              <span className="filter-arrow" style={{ transform:brandOpen?'rotate(180deg)':'none' }}>▼</span>
            </div>
            {brandOpen && <div className="filter-body">
              {isBrandFilterActive && (
                <div className="brand-filter-status">
                  <span className="brand-filter-status-text">{brandFilterLoading ? '⏳ Filtering…' : `✓ ${brandFiltered.length} result${brandFiltered.length!==1?'s':''} found`}</span>
                  <button className="brand-filter-reset" onClick={resetBrandFilter}>Reset</button>
                </div>
              )}
              {brandsLoading
                ? [1,2,3,4,5].map(i => <div key={i} className="brand-skeleton" style={{ width:`${60+i*8}%` }}/>)
                : brands.length === 0
                  ? <div style={{ fontSize:13, color:'#ccc', fontFamily:"'DM Sans',sans-serif", padding:'8px 0' }}>No brands available</div>
                  : brands.map(b => (
                      <label key={b.brand_id} className="brand-row">
                        <input type="checkbox" className="brand-check" checked={selectedBrandIds.includes(b.brand_id)} onChange={() => handleBrandToggle(b.brand_id)} disabled={brandFilterLoading}/>
                        <span className="brand-name">{b.brand_name}</span>
                        {brandFilterLoading && selectedBrandIds.includes(b.brand_id) && <span style={{ width:10, height:10, borderRadius:'50%', border:'1.5px solid rgba(185,28,28,0.25)', borderTopColor:'#b91c1c', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }}/>}
                      </label>
                    ))
              }
            </div>}
          </div>

          {/* Category filter */}
          <div className="filter-block">
            <div className="filter-header" onClick={() => setCatFilterOpen(p => !p)}>
              <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                <span className="filter-title">Filter by Category</span>
                {isCategoryFilterActive && <span style={{ width:7, height:7, borderRadius:'50%', background:'#b91c1c', flexShrink:0, animation:'pulse 1.5s ease infinite' }}/>}
              </div>
              <span className="filter-arrow" style={{ transform:catFilterOpen?'rotate(180deg)':'none' }}>▼</span>
            </div>
            {catFilterOpen && <div className="filter-body">
              {isCategoryFilterActive && (
                <div className="brand-filter-status">
                  <span className="brand-filter-status-text">{categoryFilterLoading ? '⏳ Filtering…' : `✓ ${categoryFiltered.length} result${categoryFiltered.length!==1?'s':''} found`}</span>
                  <button className="brand-filter-reset" onClick={resetCategoryFilter}>Reset</button>
                </div>
              )}
              {apiCategoriesLoading
                ? [1,2,3,4].map(i => <div key={i} className="brand-skeleton" style={{ width:`${55+i*10}%` }}/>)
                : apiCategories.length === 0
                  ? <div style={{ fontSize:13, color:'#ccc', fontFamily:"'DM Sans',sans-serif", padding:'8px 0' }}>No categories available</div>
                  : apiCategories.map(c => (
                      <label key={c.category_id} className="brand-row">
                        <input type="checkbox" className="brand-check" checked={selectedCategoryIds.includes(c.category_id)} onChange={() => handleCategoryToggle(c.category_id)} disabled={categoryFilterLoading}/>
                        <span className="brand-name">{c.category_name}</span>
                      </label>
                    ))
              }
            </div>}
          </div>
        </aside>

        {/* ── Main area ─────────────────────────────────────────────────────── */}
        <div className="shop-main">
          {/* Toolbar */}
          <div className="shop-toolbar">
            <div className="shop-toolbar-left">
              <div className="shop-view-btns">
                <button className={`shop-view-btn${viewMode==='grid'?' active':''}`} onClick={() => setViewMode('grid')} title="Grid view">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="0" y="0" width="6" height="6" rx="1.5"/><rect x="9" y="0" width="6" height="6" rx="1.5"/><rect x="0" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg>
                </button>
                <button className={`shop-view-btn${viewMode==='table'?' active':''}`} onClick={() => setViewMode('table')} title="Table view">
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="0" y="0" width="15" height="2.5" rx="1"/><rect x="0" y="6" width="15" height="2.5" rx="1"/><rect x="0" y="12" width="15" height="2.5" rx="1"/></svg>
                </button>
              </div>
              <span className="shop-count">
                <strong>{isAnyFilterActive ? sorted.length : totalCount}</strong> products
                {isAnyFilterActive && <span style={{ marginLeft:6, fontSize:11, color:'#b91c1c', fontWeight:600 }}>({[isBrandFilterActive&&'brand', isPriceFilterActive&&'price', isCategoryFilterActive&&'category'].filter(Boolean).join(' + ')} filtered)</span>}
              </span>
            </div>
            <div className="shop-toolbar-right">
              <div className="shop-search-inline" ref={inlineSearchRef} style={{ position:'relative' }}>
                {inlineSearchLoading
                  ? <span style={{ width:13, height:13, borderRadius:'50%', border:'2px solid rgba(185,28,28,0.25)', borderTopColor:'#b91c1c', animation:'spin 0.7s linear infinite', display:'inline-block', flexShrink:0 }}/>
                  : <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="#ccc" strokeWidth="1.5"/><path d="M9 9l3 3" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/></svg>
                }
                <input
                  className="shop-search-input"
                  type="text"
                  placeholder="Search products…"
                  value={searchQuery}
                  onChange={e => {
                    const v = e.target.value
                    setSearchQuery(v)
                    clearTimeout(inlineSearchTimer.current)
                    if (!v.trim()) { setInlineSearchResults(null); return }
                    inlineSearchTimer.current = setTimeout(() => doInlineSearch(v), 300)
                  }}
                  onKeyDown={e => { if (e.key === 'Escape') setInlineSearchResults(null) }}
                  onFocus={() => { if (searchQuery.trim() && inlineSearchResults === null) doInlineSearch(searchQuery) }}
                />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setInlineSearchResults(null) }}
                    style={{ background:'none', border:'none', cursor:'pointer', color:'#ccc', fontSize:13, padding:'0 4px', lineHeight:1, flexShrink:0 }}
                    onMouseEnter={e=>e.currentTarget.style.color='#b94a48'} onMouseLeave={e=>e.currentTarget.style.color='#ccc'}>✕</button>
                )}
                {inlineSearchResults !== null && (
                  <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, right:0, zIndex:4000, background:'#fff', borderRadius:12, boxShadow:'0 16px 48px rgba(0,0,0,0.13)', border:'1px solid #e8e8e8', animation:'fadeUp 0.15s ease both', minWidth:280, maxWidth:420, overflow:'hidden' }}>
                    <div style={{ padding:'9px 14px 7px', borderBottom:'1px solid #f5f5f5', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, fontWeight:700, color:'#bbb', letterSpacing:'0.1em', textTransform:'uppercase' }}>
                        {inlineSearchResults.length > 0 ? `${inlineSearchResults.length} result${inlineSearchResults.length!==1?'s':''}` : 'No results'}
                      </span>
                      <button onClick={() => setInlineSearchResults(null)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:12, color:'#ccc', padding:0 }} onMouseEnter={e=>e.currentTarget.style.color='#b94a48'} onMouseLeave={e=>e.currentTarget.style.color='#ccc'}>✕</button>
                    </div>
                    {inlineSearchResults.length === 0 ? (
                      <div style={{ padding:'20px 16px', textAlign:'center', color:'#bbb', fontFamily:"'DM Sans',sans-serif", fontSize:13 }}>
                        <div style={{ fontSize:24, marginBottom:8 }}>🔍</div>No products match "{searchQuery}"
                      </div>
                    ) : (
                      <div style={{ maxHeight:320, overflowY:'auto' }}>
                        {inlineSearchResults.map((p, i) => {
                          const hue = (p.name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360
                          return (
                            <div key={p.id || i}
                              onClick={() => { setQuickViewProduct(p); setInlineSearchResults(null) }}
                              style={{ display:'flex', alignItems:'center', gap:11, padding:'10px 14px', cursor:'pointer', borderBottom:'1px solid #f8f8f8', transition:'background 0.1s' }}
                              onMouseEnter={e=>e.currentTarget.style.background='#fef2f2'}
                              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                              <div style={{ width:40, height:40, borderRadius:8, flexShrink:0, background:`linear-gradient(145deg,hsl(${hue},22%,93%),hsl(${hue},26%,87%))`, border:`1px solid hsl(${hue},18%,85%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, overflow:'hidden' }}>
                                {p.firstImage ? <InlineThumb imageData={p.firstImage} name={p.name} /> : <span>{CAT_ICONS[p.category]||'📦'}</span>}
                              </div>
                              <div style={{ flex:1, minWidth:0 }}>
                                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, color:'#1a1a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.name}</div>
                                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:2 }}>
                                  <span style={{ fontFamily:"'Syne',sans-serif", fontSize:12.5, fontWeight:700, color:'#e03030' }}>{p.price != null ? `₹${p.price.toLocaleString('en-IN')}` : '—'}</span>
                                  {p.category && <span style={{ fontSize:10, color:'#bbb', fontFamily:"'DM Sans',sans-serif" }}>{p.category}</span>}
                                </div>
                              </div>
                              <span style={{ fontSize:11, color:'#b91c1c', fontFamily:"'DM Sans',sans-serif", fontWeight:600, flexShrink:0, background:'#fef2f2', padding:'2px 7px', borderRadius:5 }}>View</span>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="shop-sort-wrap">
                <select className="shop-sort-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low → High</option>
                  <option value="price_desc">Price: High → Low</option>
                  <option value="name">Name A–Z</option>
                  <option value="discount">Biggest Discount</option>
                </select>
                <span className="shop-sort-arrow">▾</span>
              </div>
            </div>
          </div>

          {/* Product list */}
          {(productsLoading || priceFilterLoading || brandFilterLoading || categoryFilterLoading) ? (
            <div className="shop-grid">
              {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                <div key={i} className="shop-card" style={{ animationDelay:`${i*0.06}s` }}>
                  <div style={{ padding:'12px 12px 0' }}><div style={{ width:'100%', height:158, borderRadius:12, background:'#f0f0ee', animation:'pulse 1.3s ease infinite' }}/></div>
                  <div style={{ padding:13 }}>
                    <div style={{ height:13, borderRadius:4, background:'#f0f0ee', width:'78%', marginBottom:8, animation:'pulse 1.3s ease infinite' }}/>
                    <div style={{ height:11, borderRadius:4, background:'#f5f5f3', width:'48%', marginBottom:12, animation:'pulse 1.3s ease infinite' }}/>
                    <div style={{ height:34, borderRadius:8, background:'#f5f5f3', animation:'pulse 1.3s ease infinite' }}/>
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="prod-empty">
              <div className="prod-emptyIcon">{isCategoryFilterActive?'🗂️':isBrandFilterActive?'🏷️':isPriceFilterActive?'💰':'📦'}</div>
              <div style={{ fontSize:15 }}>
                {isCategoryFilterActive ? `No products in selected categor${selectedCategoryIds.length>1?'ies':'y'}` : isBrandFilterActive ? `No products for selected brand${selectedBrandIds.length>1?'s':''}` : isPriceFilterActive ? 'No products in this price range' : 'No products found'}
              </div>
              {isCategoryFilterActive && <button onClick={resetCategoryFilter} style={{ marginTop:12, padding:'8px 18px', background:'#b91c1c', color:'#fff', border:'none', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>Clear Filter</button>}
              {isBrandFilterActive && !isCategoryFilterActive && <button onClick={resetBrandFilter} style={{ marginTop:12, padding:'8px 18px', background:'#b91c1c', color:'#fff', border:'none', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>Clear Filter</button>}
              {isPriceFilterActive && !isBrandFilterActive && !isCategoryFilterActive && <button onClick={resetPriceFilter} style={{ marginTop:12, padding:'8px 18px', background:'#b91c1c', color:'#fff', border:'none', borderRadius:8, fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, cursor:'pointer' }}>Clear Filter</button>}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="shop-grid">
              {sorted.map((p, i) => {
                const d   = disc(p.original_price, p.price)
                const isW = !!wishlist.find(w => w.id === p.id)
                const isHov = hoveredCard === p.id
                const cartItem = cart.find(c => c.id === p.id)
                const inCart = !!cartItem
                const qty = cartItem?.quantity || 1
                return (
                  <div className="shop-card" key={p.id}
                    style={{ animationDelay:`${i*0.05}s`, boxShadow:isHov?'0 10px 36px rgba(0,0,0,0.13)':undefined, transform:isHov?'translateY(-4px)':undefined, borderColor:isHov?'#e0e0e0':undefined }}
                    onMouseEnter={() => setHoveredCard(p.id)} onMouseLeave={() => setHoveredCard(null)}>
                    <div className="shop-card-img-wrap">
                      {d > 0 && <span className="shop-disc-badge">-{d}%</span>}
                      <div className="shop-side-actions" style={{ opacity:isHov?1:0, transform:isHov?'translateX(0)':'translateX(10px)', transition:'opacity 0.22s ease, transform 0.22s ease', pointerEvents:isHov?'all':'none' }}>
                        <button className={`shop-side-btn${isW?' is-wished':''}`} data-tip={isW?'Remove Wishlist':'Add to Wishlist'} onClick={e => { e.stopPropagation(); handleToggleWishlist(p) }}>{isW?'❤️':'🤍'}</button>
                        <button className="shop-side-btn is-qv" data-tip="Quick View" onClick={e => { e.stopPropagation(); setQuickViewProduct(p) }}><span style={{ fontSize:14, filter:'brightness(0) invert(1)' }}>👁</span></button>
                      </div>
                      <ProductCardImage imageData={p.firstImage} name={p.name} category={p.category} />
                    </div>
                    <div className="shop-card-body">
                      <div className="shop-card-name">{p.name}</div>
                      {p.category && <div className="shop-card-brand">{p.category}</div>}
                      <div className="shop-card-price-row">
                        <span className="shop-card-price">{fmt(p.price)}</span>
                        {p.original_price > p.price && <span className="shop-card-orig">{fmt(p.original_price)}</span>}
                      </div>
                      {p.stock === 0 ? (
                        <button className="shop-oos-btn" disabled>Out of Stock</button>
                      ) : inCart ? (
                        // ── Quantity stepper (shown when item is in cart) ──
                        <div style={{ overflow:'hidden', maxHeight:isHov?60:0, opacity:isHov?1:0, marginTop:isHov?6:0, transition:'max-height 0.28s ease, opacity 0.22s ease, margin-top 0.28s ease' }}>
                          <div className="shop-qty-row">
                            <QuantityStepper
                              size="sm"
                              quantity={qty}
                              onDecrease={() => handleUpdateQuantity(p.id, qty - 1)}
                              onIncrease={() => handleUpdateQuantity(p.id, qty + 1)}
                              max={p.stock || 99}
                            />
                            <button
                              className="shop-cart-btn"
                              onClick={e => { e.stopPropagation(); handleRemoveFromCart(p.id) }}
                              style={{ background:'#fdf2f2', color:'#b94a48', border:'1px solid rgba(185,74,72,0.25)', flex:1 }}
                            >
                              🗑️ Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ overflow:'hidden', maxHeight:isHov?52:0, opacity:isHov?1:0, marginTop:isHov?8:0, transition:'max-height 0.28s ease, opacity 0.22s ease, margin-top 0.28s ease' }}>
                          <button className="shop-cart-btn" onClick={e => { e.stopPropagation(); handleAddToCart(p) }}>
                            <span>🛒</span> Add To Cart
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="prod-tableWrapper" style={{ background:'#fff', borderRadius:13, border:'1px solid #ebebeb', overflow:'hidden', boxShadow:'0 1px 6px rgba(0,0,0,0.04)' }}>
              <table className="prod-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Rate</th>
                    <th>Stock</th>
                    <th>Quantity</th>
                    <th style={{ textAlign:'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map(p => {
                    const d = disc(p.original_price, p.price)
                    const cartItem = cart.find(c => c.id === p.id)
                    const inCart = !!cartItem
                    const qty = cartItem?.quantity || 1
                    return (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                            <div style={{ width:44, height:44, borderRadius:10, background:'#f5f5f3', flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                              {p.firstImage ? <TableThumb imageData={p.firstImage} name={p.name} /> : <span style={{ fontSize:22 }}>{CAT_ICONS[p.category]||'📦'}</span>}
                            </div>
                            <div>
                              <div style={{ fontWeight:600, color:'#1a1a1a', fontSize:13.5, fontFamily:"'Syne',sans-serif", lineHeight:1.3 }}>{p.name}</div>
                              {p.brand && <div style={{ fontSize:11, color:'#bbb', fontFamily:"'DM Sans',sans-serif", marginTop:2 }}>{p.brand}</div>}
                            </div>
                          </div>
                        </td>
                        <td><CategoryBadge category={p.category || '—'}/></td>
                        <td>
                          <div style={{ fontWeight:700, color:'#e03030', fontFamily:"'Syne',sans-serif", fontSize:15 }}>{fmt(p.price)}</div>
                          {d > 0 && (
                            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:2 }}>
                              <span style={{ fontSize:11, color:'#ccc', textDecoration:'line-through', fontFamily:"'DM Sans',sans-serif" }}>{fmt(p.original_price)}</span>
                              <span style={{ fontSize:10, fontWeight:700, color:'#b91c1c', background:'#fef2f2', padding:'1px 6px', borderRadius:4 }}>-{d}%</span>
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize:13, fontWeight:600, color:p.stock===0?'#b94a48':p.stock<=5?'#c2570a':'#b91c1c', fontFamily:"'DM Sans',sans-serif" }}>
                            {p.stock === 0 ? 'Out of stock' : `${p.stock} units`}
                          </span>
                        </td>
                        <td>
                          {inCart && p.stock !== 0 ? (
                            <QuantityStepper
                              size="sm"
                              quantity={qty}
                              onDecrease={() => handleUpdateQuantity(p.id, qty - 1)}
                              onIncrease={() => handleUpdateQuantity(p.id, qty + 1)}
                              max={p.stock || 99}
                            />
                          ) : (
                            <span style={{ fontSize:12, color:'#ddd', fontFamily:"'DM Sans',sans-serif" }}>—</span>
                          )}
                        </td>
                        <td>
                          <div className="prod-tblActions" style={{ justifyContent:'flex-end' }}>
                            <button
                              className="prod-cart-btn-sm"
                              disabled={p.stock === 0}
                              onClick={() => inCart ? handleRemoveFromCart(p.id) : handleAddToCart(p)}
                              style={inCart ? { background:'#fdf2f2', color:'#b94a48', border:'1px solid rgba(185,74,72,0.25)', boxShadow:'none' } : {}}
                            >
                              {p.stock === 0 ? '🚫 Out of Stock' : inCart ? '🗑️ Remove' : '🛒 Add to Cart'}
                            </button>
                            <button className="prod-qvBtn" onClick={() => setQuickViewProduct(p)} title="Quick View">👁</button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isAnyFilterActive && !productsLoading && totalCount > 0 && totalPages >= 1 && (
            <div className="prod-pagination">
              <div className="prod-paginationControls">
                <button className="prod-pageBtn" onClick={() => goToPage(1)} disabled={currentPage===1} title="First page">«</button>
                <button className="prod-pageBtn" onClick={() => goToPage(currentPage-1)} disabled={currentPage===1}>‹</button>
                {totalPages <= 1 ? (
                  <button className="prod-pageBtn active">1</button>
                ) : (
                  getPages().map((pg, idx) =>
                    pg === '...'
                      ? <span key={`e-${idx}`} className="prod-pageEllipsis">…</span>
                      : <button key={pg} className={`prod-pageBtn${currentPage===pg?' active':''}`} onClick={() => goToPage(pg)}>{pg}</button>
                  )
                )}
                <button className="prod-pageBtn" onClick={() => goToPage(currentPage+1)} disabled={currentPage>=totalPages}>›</button>
                <button className="prod-pageBtn" onClick={() => goToPage(totalPages)} disabled={currentPage>=totalPages} title="Last page">»</button>
              </div>
              <div className="prod-paginationInfo">
                Page {currentPage} of {totalPages} · {totalCount} total products
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function TableThumb({ imageData, name }) {
  const src = useObjectUrl(imageData)
  if (!src) return <span style={{ fontSize:22 }}>📦</span>
  return <img src={src} alt={name} style={{ width:44, height:44, objectFit:'contain' }} />
}

function InlineThumb({ imageData, name }) {
  const src = useObjectUrl(imageData)
  if (!src) return null
  return <img src={src} alt={name||''} style={{ width:'100%', height:'100%', objectFit:'contain' }} />
}
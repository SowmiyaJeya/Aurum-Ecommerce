import React, { useState, useEffect, useRef, useCallback } from 'react'

const CATEGORIES = ['All', 'Graphics Cards', 'Motherboards', 'RAM', 'Storage', 'Cases', 'PSU', 'Processors', 'Monitors']
const CAT_ICONS = {
  'Graphics Cards': '🎮', 'Motherboards': '🖥️', 'RAM': '💾',
  'Storage': '💿', 'Cases': '📦', 'PSU': '⚡',
  'Processors': '🔲', 'Monitors': '🖥️', 'All': '✦',
}
const PAGE_LIMIT = 5
const LS_KEY = 'aurum_session'

function loadSession() {
  try { const r = sessionStorage.getItem(LS_KEY); return r ? JSON.parse(r) : { cart: [], wishlist: [] } }
  catch { return { cart: [], wishlist: [] } }
}
function saveSession(data) { try { sessionStorage.setItem(LS_KEY, JSON.stringify(data)) } catch {} }

function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position:'fixed', top:28, left:'50%', transform:'translateX(-50%)', zIndex:9999, display:'flex', flexDirection:'column', alignItems:'center', gap:10, pointerEvents:'none', width:'max-content', maxWidth:'90vw' }}>
      {toasts.map((t,idx) => {
        const accent = t.type==='success'?'#1a7a5e':t.type==='error'?'#b94a48':'#4263eb'
        const bg     = t.type==='success'?'#edfaf4':t.type==='error'?'#fdf2f2':'#eef2ff'
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

function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:4000, animation:'fadeIn 0.2s ease' }} onClick={onCancel}>
      <div style={{ background:'#fff', borderRadius:20, width:420, boxShadow:'0 32px 80px rgba(0,0,0,0.2)', overflow:'hidden', animation:'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:'24px 24px 16px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'#fdf2f2', border:'1px solid rgba(185,74,72,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>🗑️</div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:'#1a1a1a' }}>Delete Product</div>
              <div style={{ fontSize:13, color:'#aaa', marginTop:2 }}>This action cannot be undone</div>
            </div>
          </div>
          <button onClick={onCancel} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#ccc', padding:4 }}
            onMouseEnter={e=>e.currentTarget.style.color='#888'} onMouseLeave={e=>e.currentTarget.style.color='#ccc'}>✕</button>
        </div>
        <div style={{ padding:'20px 24px', fontSize:15, color:'#555', lineHeight:1.6 }}>{message}</div>
        <div style={{ padding:'16px 24px 24px', display:'flex', justifyContent:'flex-end', gap:10 }}>
          <button onClick={onCancel} style={{ padding:'10px 22px', borderRadius:10, border:'1px solid #e8e8e8', background:'#fff', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, color:'#555', transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>Cancel</button>
          <button onClick={onConfirm} style={{ padding:'10px 22px', borderRadius:10, border:'none', background:'#b94a48', color:'#fff', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, boxShadow:'0 4px 14px rgba(185,74,72,0.3)', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#a43f3d';e.currentTarget.style.transform='translateY(-1px)'}} onMouseLeave={e=>{e.currentTarget.style.background='#b94a48';e.currentTarget.style.transform='none'}}>Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

function ProductModal({ mode, productData, onClose, onSubmit }) {
  const isEdit = mode==='edit'
  const [form, setForm] = useState({ id:productData?.id??null, name:productData?.name||'', sku:productData?.sku||'', brand:productData?.brand||'', category:productData?.category||'Graphics Cards', price:productData?.price||'', original_price:productData?.original_price||'', stock:productData?.stock??'', status:productData?.status||'active' })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const validate = () => { const e={}; if(!form.name.trim())e.name='Required'; if(!form.sku.trim())e.sku='Required'; if(!form.brand.trim())e.brand='Required'; if(!form.price||isNaN(form.price)||Number(form.price)<=0)e.price='Enter valid price'; if(form.stock===''||isNaN(form.stock)||Number(form.stock)<0)e.stock='Enter valid qty'; return e }
  const handleChange = (field, value) => { setForm(p=>({...p,[field]:value})); if(errors[field])setErrors(p=>({...p,[field]:''})) }
  const handleSubmit = async () => { const e=validate(); if(Object.keys(e).length>0){setErrors(e);return}; setSubmitting(true); await onSubmit(form); setSubmitting(false) }
  const inp = (err, dis) => ({ width:'100%', padding:'10px 14px', borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif", border:`1.5px solid ${err?'#e05555':'#e8e8e8'}`, background:dis?'#f7f7f7':'#fff', color:dis?'#aaa':'#1a1a1a', outline:'none', boxSizing:'border-box', transition:'border-color 0.15s' })
  const lbl = { display:'block', fontSize:11, fontWeight:700, color:'#aaa', marginBottom:6, fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.05em', textTransform:'uppercase' }
  const err = { fontSize:12, color:'#e05555', marginTop:4, display:'block' }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:3000, padding:20, animation:'fadeIn 0.2s ease' }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'#fff', borderRadius:22, width:'100%', maxWidth:580, boxShadow:'0 32px 80px rgba(0,0,0,0.2)', overflow:'hidden', maxHeight:'92vh', display:'flex', flexDirection:'column', animation:'modalIn 0.28s cubic-bezier(0.34,1.56,0.64,1)' }}>
        <div style={{ padding:'22px 24px 18px', borderBottom:'1px solid #f0f0f0', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:14, flexShrink:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:14 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:isEdit?'#edf7f2':'#f0f4ff', border:`1px solid ${isEdit?'rgba(26,122,94,0.2)':'rgba(66,99,235,0.2)'}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{isEdit?'✏️':'📦'}</div>
            <div>
              <div style={{ fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:17, color:'#1a1a1a' }}>{isEdit?'Edit Product':'Add New Product'}</div>
              <div style={{ fontSize:13, color:'#aaa', marginTop:2 }}>{isEdit?'Update product details':'Fill in details to add'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:18, color:'#ccc', padding:4 }} onMouseEnter={e=>e.currentTarget.style.color='#888'} onMouseLeave={e=>e.currentTarget.style.color='#ccc'}>✕</button>
        </div>
        <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 20px' }}>
            <div style={{ gridColumn:'1/-1' }}>
              <label style={lbl}>Product Name <span style={{color:'#e05555'}}>*</span></label>
              <input style={inp(errors.name)} type="text" placeholder="e.g. ASUS ROG Strix RTX 4080" value={form.name} onChange={e=>handleChange('name',e.target.value)} onFocus={e=>e.target.style.borderColor='rgba(26,122,94,0.5)'} onBlur={e=>e.target.style.borderColor=errors.name?'#e05555':'#e8e8e8'} />
              {errors.name&&<span style={err}>{errors.name}</span>}
            </div>
            <div>
              <label style={lbl}>SKU <span style={{color:'#e05555'}}>*</span></label>
              <input style={inp(errors.sku,isEdit)} type="text" placeholder="e.g. GPU-RTX4080" value={form.sku} onChange={e=>handleChange('sku',e.target.value)} disabled={isEdit} onFocus={e=>!isEdit&&(e.target.style.borderColor='rgba(26,122,94,0.5)')} onBlur={e=>e.target.style.borderColor=errors.sku?'#e05555':'#e8e8e8'} />
              {errors.sku&&<span style={err}>{errors.sku}</span>}
            </div>
            <div>
              <label style={lbl}>Brand <span style={{color:'#e05555'}}>*</span></label>
              <input style={inp(errors.brand)} type="text" placeholder="e.g. ASUS" value={form.brand} onChange={e=>handleChange('brand',e.target.value)} onFocus={e=>e.target.style.borderColor='rgba(26,122,94,0.5)'} onBlur={e=>e.target.style.borderColor=errors.brand?'#e05555':'#e8e8e8'} />
              {errors.brand&&<span style={err}>{errors.brand}</span>}
            </div>
            <div>
              <label style={lbl}>Category</label>
              <div style={{position:'relative'}}><select style={{...inp(false),appearance:'none',cursor:'pointer',paddingRight:36}} value={form.category} onChange={e=>handleChange('category',e.target.value)}>{CATEGORIES.filter(c=>c!=='All').map(c=><option key={c}>{c}</option>)}</select><span style={{position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',pointerEvents:'none',color:'#aaa',fontSize:11}}>▾</span></div>
            </div>
            <div>
              <label style={lbl}>Sale Price (₹) <span style={{color:'#e05555'}}>*</span></label>
              <input style={inp(errors.price)} type="number" placeholder="e.g. 89999" value={form.price} onChange={e=>handleChange('price',e.target.value)} onFocus={e=>e.target.style.borderColor='rgba(26,122,94,0.5)'} onBlur={e=>e.target.style.borderColor=errors.price?'#e05555':'#e8e8e8'} />
              {errors.price&&<span style={err}>{errors.price}</span>}
            </div>
            <div>
              <label style={lbl}>Original Price (₹)</label>
              <input style={inp(false)} type="number" placeholder="e.g. 119999" value={form.original_price} onChange={e=>handleChange('original_price',e.target.value)} onFocus={e=>e.target.style.borderColor='rgba(26,122,94,0.5)'} onBlur={e=>e.target.style.borderColor='#e8e8e8'} />
            </div>
            <div>
              <label style={lbl}>Stock Qty <span style={{color:'#e05555'}}>*</span></label>
              <input style={inp(errors.stock)} type="number" placeholder="e.g. 10" value={form.stock} onChange={e=>handleChange('stock',e.target.value)} onFocus={e=>e.target.style.borderColor='rgba(26,122,94,0.5)'} onBlur={e=>e.target.style.borderColor=errors.stock?'#e05555':'#e8e8e8'} />
              {errors.stock&&<span style={err}>{errors.stock}</span>}
            </div>
            {isEdit&&<div>
              <label style={lbl}>Status</label>
              <div style={{display:'flex',gap:10,marginTop:4}}>
                {['active','inactive'].map(s=>(
                  <label key={s} style={{display:'flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:10,border:`1.5px solid ${form.status===s?(s==='active'?'rgba(26,122,94,0.35)':'rgba(185,74,72,0.35)'):'#e8e8e8'}`,background:form.status===s?(s==='active'?'#edfaf4':'#fdf2f2'):'#fafafa',cursor:'pointer',fontSize:13.5,fontWeight:500,color:form.status===s?(s==='active'?'#1a7a5e':'#b94a48'):'#aaa',transition:'all 0.15s'}}>
                    <input type="radio" name="status" checked={form.status===s} onChange={()=>handleChange('status',s)} style={{display:'none'}} />
                    <span style={{width:7,height:7,borderRadius:'50%',background:s==='active'?'#1a7a5e':'#b94a48',opacity:form.status===s?1:0.3}} />{s.charAt(0).toUpperCase()+s.slice(1)}
                  </label>
                ))}
              </div>
            </div>}
          </div>
        </div>
        <div style={{ padding:'16px 24px 22px', borderTop:'1px solid #f0f0f0', display:'flex', justifyContent:'flex-end', gap:10, flexShrink:0 }}>
          <button onClick={onClose} style={{ padding:'10px 22px', borderRadius:10, border:'1px solid #e8e8e8', background:'#fff', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:500, color:'#555', transition:'background 0.15s' }} onMouseEnter={e=>e.currentTarget.style.background='#f5f5f5'} onMouseLeave={e=>e.currentTarget.style.background='#fff'}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding:'10px 24px', borderRadius:10, border:'none', background:'#1a7a5e', color:'#fff', cursor:submitting?'not-allowed':'pointer', fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, opacity:submitting?0.7:1, boxShadow:'0 4px 14px rgba(26,122,94,0.3)', display:'flex', alignItems:'center', gap:8, transition:'all 0.15s' }} onMouseEnter={e=>!submitting&&(e.currentTarget.style.background='#178a68')} onMouseLeave={e=>e.currentTarget.style.background='#1a7a5e'}>
            {submitting&&<span style={{width:15,height:15,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.35)',borderTopColor:'#fff',animation:'spin 0.7s linear infinite',display:'inline-block'}} />}
            {isEdit?'Save Changes':'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── helpers for image bytes → object URL ───────────────────────────────────
function bufferToObjectUrl(imageObj) {
  if (!imageObj || !imageObj.data || !imageObj.data.length) return null
  try {
    const b = new Uint8Array(imageObj.data)
    const m = (b[0]===0xFF&&b[1]===0xD8) ? 'image/jpeg' : (b[0]===0x89&&b[1]===0x50) ? 'image/png' : 'image/jpeg'
    return URL.createObjectURL(new Blob([b], { type: m }))
  } catch { return null }
}

function useObjectUrl(imageObj) {
  const [src, setSrc] = useState(null)
  useEffect(() => {
    if (!imageObj) { setSrc(null); return }
    const u = bufferToObjectUrl(imageObj)
    setSrc(u)
    return () => { if (u) URL.revokeObjectURL(u) }
  }, [imageObj])
  return src
}

function ProductImage({ imageObj, alt, style }) {
  const src = useObjectUrl(imageObj)
  if (!src) return null
  return <img src={src} alt={alt || ''} style={style} />
}

// ─── ImageSlot: single thumb that converts buffer → url internally ───────────
function ImageSlot({ imageObj, icon, hue, isActive, onClick, size = 64 }) {
  const src = useObjectUrl(imageObj)
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, height: size, borderRadius: 12,
        background: `linear-gradient(135deg,hsl(${hue},18%,${isActive?87:93}%),hsl(${hue},22%,${isActive?81:89}%))`,
        border: `2px solid ${isActive ? '#1a7a5e' : 'transparent'}`,
        outline: `1px solid ${isActive ? 'transparent' : `hsl(${hue},15%,87%)`}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, cursor: 'pointer', overflow: 'hidden',
        transition: 'all 0.2s ease',
        boxShadow: isActive ? '0 3px 12px rgba(26,122,94,0.2)' : 'none',
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      {src
        ? <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        : icon
      }
    </div>
  )
}

// ─── QuickViewModal — fetches all images for the product on open ─────────────
function QuickViewModal({ product, onClose, onAddToCart, onAddToWishlist, isWishlisted }) {
  const hue = (product.name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  const icon = CAT_ICONS[product.category] || '📦'
  const fmt = n => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)
  const disc = product.original_price > product.price ? Math.round((1 - product.price / product.original_price) * 100) : 0

  const [activeImg, setActiveImg] = useState(0)
  const [productImages, setProductImages] = useState([])
  const [imagesLoading, setImagesLoading] = useState(true)

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  useEffect(() => {
    setImagesLoading(true)
    setActiveImg(0)

    fetch('http://localhost:5000/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'displayAllProducts', product_id: product.id, page: 1, limit: 100 }),
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          const imgs = json.data
            .filter(p => p.product_id === product.id || String(p.product_id) === String(product.id))
            .map(p => p.product_image)
            .filter(Boolean)

          const first = json.data.find(p => String(p.product_id) === String(product.id))
          if (first && Array.isArray(first.product_images)) {
            first.product_images.forEach(img => { if (img) imgs.push(img) })
          }

          setProductImages(imgs.length > 0 ? imgs : [product.imageObj].filter(Boolean))
        } else {
          setProductImages([product.imageObj].filter(Boolean))
        }
      })
      .catch(() => {
        setProductImages([product.imageObj].filter(Boolean))
      })
      .finally(() => setImagesLoading(false))
  }, [product.id])

  const activeImageObj = productImages[activeImg] ?? null
  const thumbSlots = Math.max(productImages.length, 4)
  const thumbArray = Array.from({ length: thumbSlots }, (_, i) => productImages[i] ?? null)

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(8,8,8,0.62)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:5000, padding:20, animation:'fadeIn 0.2s ease' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background:'#fff', borderRadius:22, width:'100%', maxWidth:840, boxShadow:'0 40px 100px rgba(0,0,0,0.28)', overflow:'hidden', maxHeight:'92vh', display:'flex', flexDirection:'column', animation:'qvIn 0.32s cubic-bezier(0.34,1.4,0.64,1) both' }}>

        <div style={{ padding:'13px 20px', borderBottom:'1px solid #f2f2f0', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0, background:'#fafaf8' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:10, fontWeight:700, color:'#1a7a5e', letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>Quick View</span>
            <span style={{ width:3, height:3, borderRadius:'50%', background:'#ddd', display:'inline-block' }} />
            <span style={{ fontSize:12, color:'#bbb', fontFamily:"'DM Sans',sans-serif" }}>{product.category}</span>
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

              {imagesLoading ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:10 }}>
                  <div style={{ width:60, height:60, borderRadius:'50%', border:'3px solid #e8e8e8', borderTopColor:'#1a7a5e', animation:'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize:12, color:'#bbb', fontFamily:"'DM Sans',sans-serif" }}>Loading images…</span>
                </div>
              ) : activeImageObj ? (
                <ProductImage
                  imageObj={activeImageObj}
                  alt={product.name}
                  style={{ maxWidth:'100%', maxHeight:220, objectFit:'contain', display:'block', transition:'transform 0.3s ease', transform:`scale(${1 + activeImg * 0.03})` }}
                />
              ) : (
                <>
                  <div style={{ fontSize:72, filter:'drop-shadow(0 6px 18px rgba(0,0,0,0.14))', transition:'transform 0.3s ease', transform:`scale(${1 + activeImg * 0.05})` }}>{icon}</div>
                  <span style={{ fontSize:10, color:`hsl(${hue},35%,45%)`, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginTop:10 }}>{product.brand}</span>
                </>
              )}

              {productImages.length > 1 && (
                <div style={{ position:'absolute', bottom:14, left:'50%', transform:'translateX(-50%)', display:'flex', gap:6 }}>
                  {productImages.map((_, i) => (
                    <div key={i} onClick={() => setActiveImg(i)}
                      style={{ width:i===activeImg?22:7, height:7, borderRadius:4, background:i===activeImg?'#1a7a5e':'rgba(0,0,0,0.14)', cursor:'pointer', transition:'all 0.22s ease' }}
                    />
                  ))}
                </div>
              )}
            </div>

            <div style={{ display:'flex', gap:8 }}>
              {thumbArray.map((imgObj, i) => (
                <ImageSlot
                  key={i}
                  imageObj={imgObj}
                  icon={icon}
                  hue={(hue + i * 28) % 360}
                  isActive={i === activeImg && i < productImages.length}
                  onClick={() => { if (i < productImages.length) setActiveImg(i) }}
                  size={64}
                />
              ))}
            </div>
          </div>

          <div style={{ flex:1, padding:'28px 30px', overflowY:'auto', display:'flex', flexDirection:'column', gap:18 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, fontWeight:700, color:'#1a7a5e', fontFamily:"'DM Sans',sans-serif", letterSpacing:'0.08em', textTransform:'uppercase', background:'#edfaf4', padding:'3px 9px', borderRadius:5 }}>{product.brand}</span>
              {product.stock > 0 && product.stock <= 5 && <span style={{ fontSize:11, fontWeight:700, color:'#c2570a', background:'#fef3ea', padding:'3px 9px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>Only {product.stock} left!</span>}
              {product.stock === 0 && <span style={{ fontSize:11, fontWeight:700, color:'#b94a48', background:'#fdf2f2', padding:'3px 9px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>Out of Stock</span>}
              {productImages.length > 0 && (
                <span style={{ fontSize:11, fontWeight:600, color:'#888', background:'#f5f5f3', padding:'3px 9px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>
                  {productImages.length} image{productImages.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>

            <h2 style={{ fontFamily:"'Syne',sans-serif", fontSize:21, fontWeight:700, color:'#1a1a1a', margin:0, lineHeight:1.3 }}>{product.name}</h2>

            {product.rating > 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <div style={{ display:'flex', gap:2 }}>{[1,2,3,4,5].map(i => <span key={i} style={{ fontSize:14, color:i<=Math.round(product.rating)?'#f59e0b':'#e8e8e8' }}>★</span>)}</div>
                <span style={{ fontSize:13.5, fontWeight:600, color:'#1a1a1a', fontFamily:"'DM Sans',sans-serif" }}>{product.rating}</span>
                <span style={{ fontSize:13, color:'#bbb', fontFamily:"'DM Sans',sans-serif" }}>({(product.reviews || 0).toLocaleString()} reviews)</span>
              </div>
            )}

            <div style={{ height:1, background:'linear-gradient(90deg,#f0f0f0,transparent)' }} />

            <div style={{ display:'flex', alignItems:'baseline', gap:10, flexWrap:'wrap' }}>
              <span style={{ fontFamily:"'Syne',sans-serif", fontSize:30, fontWeight:800, color:'#e03030', lineHeight:1 }}>{fmt(product.price)}</span>
              {product.original_price > product.price && <>
                <span style={{ fontSize:16, color:'#ccc', textDecoration:'line-through', fontFamily:"'DM Sans',sans-serif" }}>{fmt(product.original_price)}</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#1a7a5e', background:'#edfaf4', padding:'3px 8px', borderRadius:5, fontFamily:"'DM Sans',sans-serif" }}>Save {fmt(product.original_price - product.price)}</span>
              </>}
            </div>

            <div style={{ height:1, background:'linear-gradient(90deg,#f0f0f0,transparent)' }} />

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px 24px' }}>
              {[['SKU', product.sku], ['Brand', product.brand], ['Category', product.category], ['Stock', product.stock === 0 ? 'Unavailable' : `${product.stock} units`]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize:10, fontWeight:700, color:'#ccc', letterSpacing:'0.1em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif", marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:14, color:'#333', fontFamily:"'DM Sans',sans-serif", fontWeight:500 }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ flex:1 }} />

            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {product.stock === 0
                ? <button disabled style={{ width:'100%', padding:13, background:'#f5f5f3', color:'#ccc', border:'1.5px solid #efefef', borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:600, cursor:'not-allowed' }}>Out of Stock</button>
                : <button onClick={() => { onAddToCart(product); onClose() }}
                    style={{ width:'100%', padding:13, background:'#f4b400', color:'#1a1a1a', border:'none', borderRadius:12, fontFamily:"'DM Sans',sans-serif", fontSize:14, fontWeight:700, cursor:'pointer', transition:'all 0.2s ease', boxShadow:'0 3px 12px rgba(244,180,0,0.25)', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                    onMouseEnter={e=>{e.currentTarget.style.background='#e0a500';e.currentTarget.style.boxShadow='0 6px 20px rgba(244,180,0,0.4)';e.currentTarget.style.transform='translateY(-1px)'}}
                    onMouseLeave={e=>{e.currentTarget.style.background='#f4b400';e.currentTarget.style.boxShadow='0 3px 12px rgba(244,180,0,0.25)';e.currentTarget.style.transform='none'}}>
                    <span style={{ fontSize:16 }}>🛒</span> Add To Cart
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

function ProductThumb({ name, category }) {
  const hue = (name||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360
  return <div style={{ width:'100%', height:160, borderRadius:12, background:`linear-gradient(145deg,hsl(${hue},20%,95%),hsl(${hue},24%,89%))`, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontSize:42, gap:6, border:`1px solid hsl(${hue},18%,86%)` }}>{CAT_ICONS[category]||'📦'}<span style={{ fontSize:9, color:`hsl(${hue},30%,52%)`, fontWeight:700, letterSpacing:'0.09em', textTransform:'uppercase', fontFamily:"'DM Sans',sans-serif" }}>{category}</span></div>
}
function CategoryBadge({ category }) {
  const hue = (category||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360
  return <span style={{ display:'inline-block', padding:'3px 10px', borderRadius:999, background:`hsl(${hue},30%,94%)`, color:`hsl(${hue},40%,36%)`, border:`1px solid hsl(${hue},25%,84%)`, fontSize:12, fontWeight:600, fontFamily:"'DM Sans',sans-serif" }}>{category}</span>
}
function StatusBadge({ status }) {
  const a=status==='active'
  return <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'3px 10px', borderRadius:999, background:a?'#edfaf4':'#fdf2f2', color:a?'#1a7a5e':'#b94a48', border:`1px solid ${a?'rgba(26,122,94,0.2)':'rgba(185,74,72,0.2)'}`, fontSize:12, fontWeight:600 }}><span style={{ width:6, height:6, borderRadius:'50%', background:a?'#1a7a5e':'#b94a48' }} />{a?'Active':'Inactive'}</span>
}

function BrowseMegaMenu({ categories, categoriesLoading }) {
  const [open,setOpen]=useState(false)
  const [hoveredCat,setHoveredCat]=useState(null)
  const [products,setProducts]=useState([])
  const [loading,setLoading]=useState(false)
  const timer=useRef(null)
  useEffect(()=>{if(open&&categories.length>0&&!hoveredCat)setHoveredCat(categories[0])},[open,categories])
  useEffect(()=>{
    if(!hoveredCat)return; setLoading(true); setProducts([])
    fetch('http://localhost:5000/all-products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({category_id:hoveredCat.id})})
      .then(r=>r.json()).then(j=>setProducts(j.success&&Array.isArray(j.data)?j.data:[])).catch(()=>setProducts([])).finally(()=>setLoading(false))
  },[hoveredCat])
  const hue=n=>(n||'').split('').reduce((a,c)=>a+c.charCodeAt(0),0)%360
  return (
    <div style={{position:'relative'}} onMouseLeave={()=>{timer.current=setTimeout(()=>{setOpen(false);setHoveredCat(null)},160)}}>
      <button className="site-browse-btn" onMouseEnter={()=>{clearTimeout(timer.current);setOpen(true)}} onClick={()=>setOpen(o=>!o)} style={{background:open?'#f0f9f5':undefined,color:open?'#1a7a5e':undefined}}>
        <span style={{fontSize:15}}>☰</span> Browse All Categories <span style={{fontSize:9,marginLeft:4,color:open?'#1a7a5e':'#bbb'}}>{open?'▲':'▼'}</span>
      </button>
      {open&&<div onMouseEnter={()=>clearTimeout(timer.current)} style={{ position:'absolute', top:'100%', left:0, zIndex:2000, display:'flex', minWidth:560, background:'#fff', borderRadius:'0 0 14px 14px', boxShadow:'0 20px 60px rgba(0,0,0,0.12)', border:'1px solid #efefef', borderTop:'2px solid #1a7a5e', overflow:'hidden', animation:'fadeUp 0.18s ease both' }}>
        <div style={{ width:220, flexShrink:0, borderRight:'1px solid #f0f0f0', overflowY:'auto', maxHeight:420, background:'#fafaf8' }}>
          {categoriesLoading?<div style={{padding:'24px 20px',color:'#bbb',fontSize:13,fontFamily:"'DM Sans',sans-serif"}}>Loading…</div>:categories.map(cat=>{
            const isA=hoveredCat?.id===cat.id,h=hue(cat.category_name)
            return <div key={cat.id} onMouseEnter={()=>setHoveredCat(cat)} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 18px',cursor:'pointer',background:isA?'#fff':'transparent',borderLeft:`3px solid ${isA?'#1a7a5e':'transparent'}`,transition:'all 0.12s ease'}}>
              <span style={{width:30,height:30,borderRadius:8,flexShrink:0,background:`hsl(${h},30%,93%)`,border:`1px solid hsl(${h},25%,84%)`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:14}}>{cat.category_name.charAt(0)}</span>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13.5,fontWeight:isA?600:400,color:isA?'#1a1a1a':'#444',flex:1}}>{cat.category_name}</span>
              {isA&&<span style={{fontSize:10,color:'#1a7a5e'}}>›</span>}
            </div>
          })}
        </div>
        <div style={{flex:1,padding:'16px 18px',minWidth:0,maxHeight:420,overflowY:'auto'}}>
          {hoveredCat&&<div style={{fontFamily:"'Syne',sans-serif",fontSize:12,fontWeight:700,color:'#1a7a5e',marginBottom:12,letterSpacing:'0.06em',textTransform:'uppercase'}}>{hoveredCat.category_name}</div>}
          {loading?[1,2,3].map(i=><div key={i} style={{height:52,borderRadius:8,background:'#f5f5f3',marginBottom:8,animation:'pulse 1.2s ease infinite'}} />):
          products.length===0?<div style={{padding:'28px 0',textAlign:'center',color:'#bbb',fontFamily:"'DM Sans',sans-serif",fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>📭</div>No products</div>:
          products.map(p=><div key={p.product_id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:9,border:'1px solid #f0f0f0',background:'#fff',cursor:'pointer',marginBottom:6,transition:'all 0.12s ease'}} onMouseEnter={e=>{e.currentTarget.style.background='#f0f9f5';e.currentTarget.style.borderColor='rgba(26,122,94,0.2)'}} onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.borderColor='#f0f0f0'}}>
            <span style={{fontFamily:"'DM Sans',sans-serif",fontSize:13.5,fontWeight:500,color:'#1a1a1a'}}>{p.product_name}</span>
            <span style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:'#1a7a5e',flexShrink:0}}>₹{parseFloat(p.price).toLocaleString('en-IN',{minimumFractionDigits:2})}</span>
          </div>)}
        </div>
      </div>}
    </div>
  )
}

function SiteHeader({ cartCount, wishlistCount }) {
  const [searchVal,setSearchVal]=useState('')
  const [catVal,setCatVal]=useState('All Categories')
  const [headerCategories,setHeaderCategories]=useState([])
  const [categoriesLoading,setCategoriesLoading]=useState(true)
  const [searchResults,setSearchResults]=useState(null)
  const [searchLoading,setSearchLoading]=useState(false)
  const searchRef=useRef(null)
  const searchTimer=useRef(null)
  useEffect(()=>{
    fetch('http://localhost:5000/all-categories',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'listAllCategories'})})
      .then(r=>r.json()).then(j=>{if(j.success&&Array.isArray(j.data))setHeaderCategories(j.data)}).catch(()=>{}).finally(()=>setCategoriesLoading(false))
  },[])
  useEffect(()=>{
    const h=e=>{if(searchRef.current&&!searchRef.current.contains(e.target))setSearchResults(null)}
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h)
  },[])
  const doSearch=async q=>{
    if(!q.trim()){setSearchResults(null);return}; setSearchLoading(true)
    try{const r=await fetch('http://localhost:5000/searchProducts',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({search:q.trim()})});const j=await r.json();setSearchResults(j.success&&Array.isArray(j.data)?j.data:[])}
    catch{setSearchResults([])}finally{setSearchLoading(false)}
  }
  return (
    <header className="site-header">
      <div className="site-topbar">
        <span className="site-tagline">Your one stop destination for all your needs!</span>
        <div className="site-topbar-links">
          {[['Email :','contact@Aurum.com'],['Contact : +91','9876543210'],['Support :','+91 1234567890']].map(([l,v],i)=>(
            <React.Fragment key={i}>{i>0&&<div className="site-topbar-divider"/>}<div className="site-topbar-item"><span className="site-topbar-label">{l}</span><span className="site-topbar-val">{v}</span></div></React.Fragment>
          ))}
        </div>
      </div>
      <div className="site-mainbar">
        <div className="site-logo">
          <div className="site-logo-icon"><svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="6" fill="#1a7a5e"/><text x="14" y="20" textAnchor="middle" fill="white" fontSize="14" fontWeight="800" fontFamily="sans-serif">✦</text></svg></div>
          <span className="site-logo-name">Aurum</span>
        </div>
        <div className="site-searchbar" ref={searchRef} style={{position:'relative'}}>
          <div className="site-search-cat">
            <select value={catVal} onChange={e=>setCatVal(e.target.value)} className="site-search-catselect" disabled={categoriesLoading}>
              <option value="All Categories">All Categories</option>
              {headerCategories.map(c=><option key={c.id} value={c.category_name}>{c.category_name}</option>)}
            </select>
            <span className="site-search-canarrow">{categoriesLoading?'…':'▾'}</span>
          </div>
          <div className="site-search-divider"/>
          <input type="text" placeholder="Search for products ..." value={searchVal} onChange={e=>{setSearchVal(e.target.value);clearTimeout(searchTimer.current);if(!e.target.value.trim()){setSearchResults(null);return};searchTimer.current=setTimeout(()=>doSearch(e.target.value),350)}} onKeyDown={e=>e.key==='Enter'&&doSearch(searchVal)} className="site-search-input"/>
          <button className="site-search-btn" onClick={()=>doSearch(searchVal)} disabled={searchLoading} style={{opacity:searchLoading?0.75:1,display:'flex',alignItems:'center',gap:7}}>
            {searchLoading&&<span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(255,255,255,0.35)',borderTopColor:'#fff',animation:'spin 0.7s linear infinite',display:'inline-block'}}/>}Search
          </button>
          {searchResults!==null&&<div style={{position:'absolute',top:'calc(100% + 4px)',left:0,right:0,zIndex:3000,background:'#fff',borderRadius:'0 0 14px 14px',boxShadow:'0 20px 60px rgba(0,0,0,0.12)',border:'1px solid #e8e8e8',borderTop:'none',display:'flex',animation:'fadeUp 0.15s ease both',minHeight:100}}>
            <div style={{flex:1,borderRight:'1px solid #f0f0f0',minWidth:0}}>
              <div style={{padding:'10px 16px 8px',fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color:'#ccc',letterSpacing:'0.1em',textTransform:'uppercase',borderBottom:'1px solid #f5f5f5'}}>Product Matches</div>
              {searchResults.length===0?<div style={{padding:'28px 16px',textAlign:'center',color:'#ccc',fontFamily:"'DM Sans',sans-serif",fontSize:13}}><div style={{fontSize:28,marginBottom:8}}>🔍</div>No results for "{searchVal}"</div>:
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',maxHeight:340,overflowY:'auto'}}>
                {searchResults.map((p,i)=><div key={p.product_id} style={{display:'flex',alignItems:'center',gap:10,padding:'11px 14px',cursor:'pointer',borderBottom:'1px solid #f8f8f8',borderRight:i%2===0?'1px solid #f5f5f5':'none',transition:'background 0.12s'}} onMouseEnter={e=>e.currentTarget.style.background='#f7fdf9'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{width:44,height:44,borderRadius:8,flexShrink:0,background:'#f5f5f3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📦</div>
                  <div style={{flex:1,minWidth:0}}><div style={{fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:500,color:'#1a1a1a',marginBottom:3,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.product_name}</div><span style={{fontFamily:"'Syne',sans-serif",fontSize:13,fontWeight:700,color:'#1a1a1a'}}>₹{parseFloat(p.price).toLocaleString('en-IN')}</span></div>
                </div>)}
              </div>}
            </div>
            <div style={{width:190,flexShrink:0,padding:'0 0 10px'}}>
              <div style={{padding:'10px 14px 8px',fontFamily:"'DM Sans',sans-serif",fontSize:10,fontWeight:700,color:'#ccc',letterSpacing:'0.1em',textTransform:'uppercase',borderBottom:'1px solid #f5f5f5'}}>Suggestions</div>
              {[searchVal,`${searchVal} best price`,`${searchVal} gaming`,`${searchVal} review`].filter(Boolean).map((s,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'8px 14px',cursor:'pointer',fontSize:13,color:'#444',fontFamily:"'DM Sans',sans-serif",transition:'all 0.12s'}} onMouseEnter={e=>{e.currentTarget.style.background='#f7fdf9';e.currentTarget.style.color='#1a7a5e'}} onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='#444'}} onClick={()=>{setSearchVal(s);doSearch(s)}}><span style={{color:'#ddd',fontSize:11}}>🔍</span><span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{s}</span></div>)}
              <div style={{padding:'6px 14px 0',borderTop:'1px solid #f5f5f5',marginTop:4}}>
                <button onClick={()=>setSearchResults(null)} style={{width:'100%',padding:'6px',border:'1px solid #e8e8e8',borderRadius:6,background:'#fff',cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontSize:12,color:'#aaa',transition:'all 0.15s'}} onMouseEnter={e=>{e.currentTarget.style.background='#fdf2f2';e.currentTarget.style.color='#b94a48'}} onMouseLeave={e=>{e.currentTarget.style.background='#fff';e.currentTarget.style.color='#aaa'}}>✕ Close</button>
              </div>
            </div>
          </div>}
        </div>
        <div className="site-header-actions">
          <button className="site-hdr-action-btn" style={{position:'relative'}}>
            <span className="site-hdr-icon">🤍</span>
            {wishlistCount>0&&<span className="site-hdr-badge" key={wishlistCount} style={{animation:'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'}}>{wishlistCount}</span>}
          </button>
          <button className="site-hdr-action-btn site-cart-btn">
            <span className="site-hdr-icon" style={{position:'relative'}}>
              🛒
              {cartCount>0&&<span className="site-hdr-badge" key={cartCount} style={{animation:'badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1) both'}}>{cartCount}</span>}
            </span>
            <span className="site-hdr-action-label">Your Cart<br/><strong>{cartCount>0?`${cartCount} item${cartCount>1?'s':''}`:'Rs. 0.00'}</strong></span>
          </button>
        </div>
      </div>
      <nav className="site-navbar">
        <BrowseMegaMenu categories={headerCategories} categoriesLoading={categoriesLoading}/>
        <div className="site-nav-divider"/>
        <div className="site-nav-links">
          {['Home','Gaming','Streaming','Components','PC Builds','Monitors','Custom PC Quote','Our Stores'].map((item,i)=>(
            <a key={item} href="#" className={`site-nav-link${i===0?' active':''}`}>{item}{['Gaming','Streaming','Components','PC Builds','Monitors'].includes(item)&&<span style={{fontSize:9,marginLeft:2,opacity:0.5}}>▾</span>}</a>
          ))}
        </div>
        <div className="site-asus-promo"><span className="site-asus-badge">%</span> Asus Graphic Cards</div>
      </nav>
    </header>
  )
}

function PageTitleBar({ title, breadcrumb }) {
  return (
    <div className="page-title-bar">
      <h2 className="page-title-text">{title}</h2>
      <div className="page-breadcrumb">
        {breadcrumb.map((c,i)=><span key={i}>{i>0&&<span className="breadcrumb-sep"> / </span>}<a href="#" className={`breadcrumb-link${i===breadcrumb.length-1?' active':''}`}>{c}</a></span>)}
      </div>
    </div>
  )
}

export default function Products() {
  const session = loadSession()
  const [cart,setCart] = useState(session.cart)
  const [wishlist,setWishlist] = useState(session.wishlist)
  const cartRef = useRef(cart)
  const wishlistRef = useRef(wishlist)

  useEffect(()=>{ cartRef.current=cart; saveSession({cart,wishlist:wishlistRef.current}) },[cart])
  useEffect(()=>{ wishlistRef.current=wishlist; saveSession({cart:cartRef.current,wishlist}) },[wishlist])

  const [products,setProducts]=useState([])
  const [totalCount,setTotalCount]=useState(0)
  const [productsLoading,setProductsLoading]=useState(true)
  const [currentPage,setCurrentPage]=useState(1)
  const [viewMode,setViewMode]=useState('grid')
  const [modal,setModal]=useState(null)
  const [quickViewProduct,setQuickViewProduct]=useState(null)
  const [toasts,setToasts]=useState([])
  const [confirmDelete,setConfirmDelete]=useState(null)

  // ── Price filter state ──────────────────────────────────────────────────────
  const [priceMin,setPriceMin]=useState(0)
  const [priceMax,setPriceMax]=useState(9999999)
  const [priceFiltered,setPriceFiltered]=useState(null)
  const [priceFilterLoading,setPriceFilterLoading]=useState(false)
  const priceDebounceTimer=useRef(null)
  const priceChanged=useRef(false)

  // ── Brand filter state ──────────────────────────────────────────────────────
  // brands: list of { brand_id, brand_name } fetched from API
  const [brands, setBrands] = useState([])
  const [brandsLoading, setBrandsLoading] = useState(true)
  // selectedBrandIds: Set of brand_id numbers the user has checked
  const [selectedBrandIds, setSelectedBrandIds] = useState([])
  // brandFiltered: null = not active, array = products from /filter-brand
  const [brandFiltered, setBrandFiltered] = useState(null)
  const [brandFilterLoading, setBrandFilterLoading] = useState(false)

  const [sortBy,setSortBy]=useState('relevance')
  const [searchQuery,setSearchQuery]=useState('')
  const [activeCategory,setActiveCategory]=useState('All')
  const [priceOpen,setPriceOpen]=useState(true)
  const [brandOpen,setBrandOpen]=useState(true)
  const [catFilterOpen,setCatFilterOpen]=useState(true)
  const [hoveredCard,setHoveredCard]=useState(null)

  const totalPages = Math.ceil(totalCount/PAGE_LIMIT)
  const cartCount = cart.length
  const wishlistCount = wishlist.length

  // ── Fetch all available brands on mount ─────────────────────────────────────
  useEffect(() => {
    setBrandsLoading(true)
    fetch('http://localhost:5000/filter-brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_ids: [] }),   // empty → returns full brand list
    })
      .then(r => r.json())
      .then(json => {
        if (json.success && Array.isArray(json.data)) {
          setBrands(json.data)
        }
      })
      .catch(() => {})
      .finally(() => setBrandsLoading(false))
  }, [])

  // ── Call /filter-brand whenever selectedBrandIds changes ────────────────────
  const fetchFilteredByBrand = useCallback(async (brandIds) => {
    // No brands selected → clear brand filter
    if (brandIds.length === 0) {
      setBrandFiltered(null)
      return
    }

    setBrandFilterLoading(true)
    try {
      const res = await fetch('http://localhost:5000/filter-brand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_ids: brandIds }),
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        // Map API response to the same product shape used everywhere else
        setBrandFiltered(json.data.map(p => ({
          id: p.product_id,
          name: p.product_name,
          category: p.category_name || '',
          price: parseFloat(p.price),
          original_price: parseFloat(p.original_price || p.price),
          stock: p.stock,
          status: p.status === 1 ? 'active' : 'inactive',
          updated_at: p.updated_at,
          imageObj: p.product_image || null,
          brand: p.brand || '',
          sku: p.sku || `SKU-${p.product_id}`,
          rating: p.rating || 0,
          reviews: p.reviews || 0,
        })))
      } else {
        setBrandFiltered([])
      }
    } catch {
      setBrandFiltered(null)
    } finally {
      setBrandFilterLoading(false)
    }
  }, [])

  // Toggle a brand checkbox
  const handleBrandToggle = (brandId) => {
    setSelectedBrandIds(prev => {
      const next = prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
      fetchFilteredByBrand(next)
      return next
    })
  }

  // Reset brand filter completely
  const resetBrandFilter = () => {
    setSelectedBrandIds([])
    setBrandFiltered(null)
  }

  // ── Fetch paginated products ────────────────────────────────────────────────
  const fetchProducts = async (page=1) => {
    setProductsLoading(true)
    try {
      const res=await fetch('http://localhost:5000/products',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'displayAllProducts',page,limit:PAGE_LIMIT})})
      const json=await res.json()
      if(json.success&&Array.isArray(json.data)){
        setProducts(json.data.map(p=>({
          id:p.product_id,name:p.product_name,category:p.category_name||'',
          price:parseFloat(p.price),original_price:parseFloat(p.price),
          stock:p.stock,status:p.status===1?'active':'inactive',
          updated_at:p.updated_at,imageObj:p.product_image||null,
          brand:p.brand||'',sku:p.sku||`SKU-${p.product_id}`,
          rating:p.rating||0,reviews:p.reviews||0,
        })))
        setTotalCount(json.total||(json.data.length<PAGE_LIMIT?(page-1)*PAGE_LIMIT+json.data.length:page*PAGE_LIMIT+1))
      }
    } catch{}finally{setProductsLoading(false)}
  }
  useEffect(()=>{fetchProducts(currentPage)},[currentPage])

  // ── Price filter API call — debounced 600 ms after user stops sliding ───────
  const fetchFilteredByPrice = useCallback(async (min, max) => {
    if (min === 0 && max === 9999999) { setPriceFiltered(null); return }

    setPriceFilterLoading(true)
    try {
      const res = await fetch('http://localhost:5000/filter-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ min_price: min, max_price: max === 9999999 ? 9999999 : max }),
      })
      const json = await res.json()
      if (json.success && Array.isArray(json.data)) {
        setPriceFiltered(json.data.map(p => ({
          id: p.product_id,
          name: p.product_name,
          category: p.category_name || '',
          price: parseFloat(p.price),
          original_price: parseFloat(p.price),
          stock: p.stock,
          status: p.status === 1 ? 'active' : 'inactive',
          updated_at: p.updated_at,
          imageObj: p.product_image || null,
          brand: p.brand || '',
          sku: p.sku || `SKU-${p.product_id}`,
          rating: p.rating || 0,
          reviews: p.reviews || 0,
        })))
      } else {
        setPriceFiltered([])
      }
    } catch {
      setPriceFiltered(null)
    } finally {
      setPriceFilterLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!priceChanged.current) return
    clearTimeout(priceDebounceTimer.current)
    priceDebounceTimer.current = setTimeout(() => {
      fetchFilteredByPrice(priceMin, priceMax)
    }, 600)
    return () => clearTimeout(priceDebounceTimer.current)
  }, [priceMin, priceMax, fetchFilteredByPrice])

  const handlePriceMinChange = (val) => { priceChanged.current = true; setPriceMin(val) }
  const handlePriceMaxChange = (val) => { priceChanged.current = true; setPriceMax(val) }

  const resetPriceFilter = () => {
    priceChanged.current = false
    setPriceMin(0)
    setPriceMax(9999999)
    setPriceFiltered(null)
  }

  const addToast = (message,type='success') => { const id=Date.now(); setToasts(p=>[...p,{id,message,type}]); setTimeout(()=>setToasts(p=>p.filter(t=>t.id!==id)),3500) }
  const removeToast = id => setToasts(p=>p.filter(t=>t.id!==id))

  const handleAddToCart = product => {
    setCart(prev=>{
      if(prev.find(i=>i.id===product.id)){addToast(`Already in cart — ${product.name}`,'info');return prev}
      addToast(`Added to cart — ${product.name}`,'success')
      return [...prev,{id:product.id,name:product.name,price:product.price}]
    })
  }
  const handleToggleWishlist = product => {
    setWishlist(prev=>{
      const exists=prev.find(i=>i.id===product.id)
      if(exists){addToast(`Removed from wishlist`,'info');return prev.filter(i=>i.id!==product.id)}
      addToast(`Saved to wishlist — ${product.name}`,'success')
      return [...prev,{id:product.id,name:product.name,price:product.price}]
    })
  }

  const handleAddSubmit=async form=>{setModal(null);addToast(`"${form.name}" added!`,'success');fetchProducts(currentPage)}
  const handleEditSubmit=async form=>{setModal(null);addToast(`"${form.name}" updated!`,'success');fetchProducts(currentPage)}
  const handleDeleteConfirm=()=>{const{name}=confirmDelete;setConfirmDelete(null);addToast(`"${name}" deleted`,'success');fetchProducts(currentPage)}

  const fmt=n=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n)
  const disc=(o,s)=>o>s?Math.round((1-s/o)*100):0
  const fmtDate=d=>d?new Intl.DateTimeFormat('en-US',{year:'numeric',month:'short',day:'numeric'}).format(new Date(d)):'—'
  const goToPage=p=>{if(p>=1&&p<=totalPages)setCurrentPage(p)}
  const getPages=()=>{if(totalPages<=7)return Array.from({length:totalPages},(_,i)=>i+1);const p=[],l=Math.max(2,currentPage-1),r=Math.min(totalPages-1,currentPage+1);p.push(1);if(l>2)p.push('...');for(let i=l;i<=r;i++)p.push(i);if(r<totalPages-1)p.push('...');p.push(totalPages);return p}

  // ── Determine the base product list ─────────────────────────────────────────
  // Priority: brandFiltered > priceFiltered > full products list
  // If both are active, intersect them by product id
  const baseProducts = (() => {
    if (brandFiltered !== null && priceFiltered !== null) {
      // Both filters active — keep products that appear in both
      const priceIds = new Set(priceFiltered.map(p => p.id))
      return brandFiltered.filter(p => priceIds.has(p.id))
    }
    if (brandFiltered !== null) return brandFiltered
    if (priceFiltered !== null) return priceFiltered
    return products
  })()

  // ── Apply remaining client-side filters (category, search) ─────────────────
  const filtered = baseProducts.filter(p => {
    if (activeCategory !== 'All' && p.category !== activeCategory) return false
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.category.toLowerCase().includes(searchQuery.toLowerCase())) return false
    return true
  })

  // ── Sort ────────────────────────────────────────────────────────────────────
  const sorted = [...filtered].sort((a,b)=>{
    if(sortBy==='price_asc') return a.price-b.price
    if(sortBy==='price_desc') return b.price-a.price
    if(sortBy==='name') return a.name.localeCompare(b.name)
    if(sortBy==='discount') return disc(b.original_price,b.price)-disc(a.original_price,a.price)
    return 0
  })

  // Whether any server-side filter is active
  const isPriceFilterActive = priceFiltered !== null
  const isBrandFilterActive = brandFiltered !== null
  const isAnyFilterActive = isPriceFilterActive || isBrandFilterActive

  // Price range display values (cap at 2L for slider)
  const sliderMin = Math.min(priceMin, 200000)
  const sliderMax = Math.min(priceMax === 9999999 ? 200000 : priceMax, 200000)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        @keyframes spin    { to { transform:rotate(360deg); } }
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp  { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes modalIn { from{opacity:0;transform:scale(0.92) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes qvIn    { from{opacity:0;transform:scale(0.93) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes toastIn { from{opacity:0;transform:translateX(20px)} to{opacity:1;transform:translateX(0)} }
        @keyframes toastDrop { from{opacity:0;transform:translateY(-16px) scale(0.92)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes badgePop{ 0%{transform:scale(0)} 70%{transform:scale(1.35)} 100%{transform:scale(1)} }
        @keyframes floatUp { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.45} }
        * { box-sizing:border-box; margin:0; padding:0; }

        .site-header { background:#fff; border-bottom:1px solid #e8e8e8; font-family:'DM Sans',sans-serif; }
        .site-topbar { background:#f8f8f6; border-bottom:1px solid #ececec; padding:8px 24px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; }
        .site-tagline { color:#333; font-weight:600; font-size:13px; }
        .site-topbar-links { display:flex; align-items:center; }
        .site-topbar-item { display:flex; flex-direction:column; padding:0 16px; line-height:1.5; }
        .site-topbar-label { color:#999; font-size:11px; font-weight:500; }
        .site-topbar-val { color:#111; font-weight:700; font-size:13px; }
        .site-topbar-divider { width:1px; height:28px; background:#e4e4e4; }
        .site-mainbar { padding:14px 24px; display:flex; align-items:center; gap:20px; flex-wrap:wrap; }
        .site-logo { display:flex; align-items:center; gap:10px; cursor:pointer; flex-shrink:0; text-decoration:none; }
        .site-logo-icon { display:flex; }
        .site-logo-name { font-family:'Syne',sans-serif; font-size:20px; font-weight:800; color:#1a1a1a; }
        .site-searchbar { flex:1; min-width:280px; max-width:860px; display:flex; align-items:stretch; border:1.5px solid #e4e4e4; border-radius:9px; overflow:hidden; height:48px; transition:border-color 0.2s ease; }
        .site-searchbar:focus-within { border-color:rgba(26,122,94,0.42); }
        .site-search-cat { display:flex; align-items:center; background:#f6f6f4; border-right:1px solid #e8e8e8; padding:0 12px; position:relative; min-width:136px; }
        .site-search-catselect { background:transparent; border:none; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#444; cursor:pointer; padding-right:18px; width:100%; appearance:none; }
        .site-search-canarrow { position:absolute; right:10px; color:#aaa; font-size:10px; pointer-events:none; }
        .site-search-divider { width:1px; background:#e8e8e8; flex-shrink:0; }
        .site-search-input { flex:1; border:none; outline:none; padding:0 16px; font-family:'DM Sans',sans-serif; font-size:14px; color:#333; background:#fff; }
        .site-search-input::placeholder { color:#ccc; }
        .site-search-btn { background:#1a7a5e; color:#fff; border:none; padding:0 22px; font-family:'DM Sans',sans-serif; font-size:13.5px; font-weight:600; cursor:pointer; transition:background 0.15s; white-space:nowrap; display:flex; align-items:center; gap:6px; }
        .site-search-btn:hover { background:#178a68; }
        .site-header-actions { display:flex; align-items:center; gap:8px; margin-left:auto; flex-shrink:0; }
        .site-hdr-action-btn { display:flex; align-items:center; gap:9px; background:none; border:none; cursor:pointer; padding:8px 10px; border-radius:9px; transition:background 0.15s; font-family:'DM Sans',sans-serif; font-size:12px; color:#444; position:relative; }
        .site-hdr-action-btn:hover { background:#f5f5f3; }
        .site-hdr-icon { font-size:20px; }
        .site-hdr-action-label { text-align:left; font-size:12px; color:#666; line-height:1.5; }
        .site-hdr-action-label strong { display:block; font-size:13px; color:#1a1a1a; }
        .site-hdr-badge { position:absolute; top:4px; right:4px; background:#1a7a5e; color:#fff; font-size:9px; font-weight:800; min-width:17px; height:17px; border-radius:9px; display:flex; align-items:center; justify-content:center; border:2px solid #fff; padding:0 3px; font-family:'DM Sans',sans-serif; }
        .site-cart-btn { border:1.5px solid #e8e8e8 !important; border-radius:10px !important; }
        .site-navbar { background:#fff; border-top:1px solid #f0f0f0; padding:0 24px; display:flex; align-items:stretch; min-height:44px; }
        .site-browse-btn { display:flex; align-items:center; gap:8px; background:none; border:none; border-right:1px solid #f0f0f0; padding:0 18px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#222; cursor:pointer; white-space:nowrap; transition:color 0.15s,background 0.15s; }
        .site-browse-btn:hover { color:#1a7a5e; background:#f7fdf9; }
        .site-nav-divider { width:1px; background:#f0f0f0; margin:8px 0; }
        .site-nav-links { display:flex; align-items:stretch; flex:1; overflow-x:auto; scrollbar-width:none; }
        .site-nav-links::-webkit-scrollbar { display:none; }
        .site-nav-link { display:flex; align-items:center; gap:3px; padding:0 14px; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:500; color:#444; text-decoration:none; white-space:nowrap; border-bottom:2px solid transparent; transition:all 0.15s; }
        .site-nav-link:hover,.site-nav-link.active { color:#1a7a5e; border-bottom-color:#1a7a5e; }
        .site-nav-link.active { font-weight:600; }
        .site-asus-promo { display:flex; align-items:center; gap:7px; margin-left:auto; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; color:#333; cursor:pointer; padding:0 4px; white-space:nowrap; flex-shrink:0; }
        .site-asus-badge { width:20px; height:20px; background:#e04040; color:#fff; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:10px; font-weight:800; flex-shrink:0; }
        .page-title-bar { background:#fff; padding:20px 24px 16px; border-bottom:1px solid #f0f0f0; text-align:center; }
        .page-title-text { font-family:'Syne',sans-serif; font-size:24px; font-weight:700; color:#1a1a1a; margin:0 0 5px; }
        .page-breadcrumb { font-size:13px; color:#bbb; }
        .breadcrumb-link { color:#bbb; text-decoration:none; transition:color 0.15s; }
        .breadcrumb-link:hover { color:#1a7a5e; }
        .breadcrumb-link.active { color:#666; font-weight:500; }
        .breadcrumb-sep { color:#e0e0e0; }
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
        .price-input:focus { border-color:rgba(26,122,94,0.4); }
        .price-input.active { border-color:rgba(26,122,94,0.5); background:#f7fdf9; }
        .price-dash { color:#ccc; font-size:13px; }
        .range-wrap { position:relative; height:20px; margin-bottom:6px; }
        .range-track { position:absolute; top:50%; left:0; right:0; height:4px; background:#efefef; border-radius:2px; transform:translateY(-50%); }
        .range-fill { position:absolute; top:0; height:100%; background:#1a7a5e; border-radius:2px; }
        .range-slider { position:absolute; top:50%; width:100%; height:4px; background:transparent; transform:translateY(-50%); outline:none; appearance:none; pointer-events:none; }
        .range-slider::-webkit-slider-thumb { appearance:none; width:16px; height:16px; border-radius:50%; background:#fff; border:2.5px solid #1a7a5e; cursor:pointer; pointer-events:all; box-shadow:0 1px 6px rgba(0,0,0,0.14); }
        .range-labels { display:flex; justify-content:space-between; font-size:9px; color:#ccc; margin-top:4px; }
        .brand-row { display:flex; align-items:center; gap:9px; padding:5px 0; cursor:pointer; }
        .brand-row:hover .brand-name { color:#1a7a5e; }
        .brand-check { accent-color:#1a7a5e; width:14px; height:14px; cursor:pointer; flex-shrink:0; }
        .brand-name { font-size:13px; color:#444; flex:1; transition:color 0.15s; font-family:'DM Sans',sans-serif; }
        .brand-count { font-size:11px; color:#ccc; font-family:'DM Sans',sans-serif; }
        .shop-main { flex:1; padding:20px; min-width:0; }
        .shop-toolbar { display:flex; align-items:center; justify-content:space-between; background:#fff; border:1px solid #ebebeb; border-radius:11px; padding:10px 16px; margin-bottom:16px; gap:12px; flex-wrap:wrap; box-shadow:0 1px 6px rgba(0,0,0,0.04); }
        .shop-toolbar-left { display:flex; align-items:center; gap:12px; }
        .shop-toolbar-right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
        .shop-view-btns { display:flex; border:1px solid #e8e8e8; border-radius:8px; overflow:hidden; }
        .shop-view-btn { width:34px; height:34px; border:none; background:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; color:#ccc; transition:all 0.15s; }
        .shop-view-btn.active { background:#1a7a5e; color:#fff; }
        .shop-view-btn:hover:not(.active) { background:#f5f5f3; color:#666; }
        .shop-count { font-family:'DM Sans',sans-serif; font-size:13.5px; color:#bbb; }
        .shop-count strong { color:#1a1a1a; }
        .shop-search-inline { display:flex; align-items:center; gap:6px; border:1px solid #e8e8e8; border-radius:8px; padding:7px 13px; background:#fff; transition:border-color 0.15s; }
        .shop-search-inline:focus-within { border-color:rgba(26,122,94,0.38); }
        .shop-search-input { border:none; outline:none; font-family:'DM Sans',sans-serif; font-size:13px; color:#333; width:140px; background:transparent; }
        .shop-search-input::placeholder { color:#ddd; }
        .shop-sort-wrap { position:relative; }
        .shop-sort-select { appearance:none; border:1px solid #e8e8e8; border-radius:8px; padding:8px 30px 8px 12px; font-family:'DM Sans',sans-serif; font-size:13px; color:#444; background:#fff; cursor:pointer; outline:none; min-width:148px; transition:border-color 0.15s; }
        .shop-sort-select:focus { border-color:rgba(26,122,94,0.38); }
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
        .shop-side-btn.is-qv { background:#1a7a5e; border-color:#1a7a5e; }
        .shop-side-btn.is-qv:hover { background:#178a68; }
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
        .prod-tableWrapper { overflow-x:auto; }
        .prod-table { width:100%; border-collapse:collapse; min-width:860px; }
        .prod-table thead tr { background:#fafaf8; border-bottom:1px solid #f0f0f0; }
        .prod-table th { padding:13px 18px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.09em; color:#bbb; text-align:left; white-space:nowrap; }
        .prod-table tbody tr { border-bottom:1px solid #f5f5f3; transition:background 0.12s; }
        .prod-table tbody tr:last-child { border-bottom:none; }
        .prod-table tbody tr:hover { background:#fafaf8; }
        .prod-table td { padding:13px 18px; font-size:14px; color:#444; vertical-align:middle; }
        .prod-tblActions { display:flex; gap:7px; }
        .prod-editBtn,.prod-deleteBtn,.prod-qvBtn { width:33px; height:33px; border-radius:8px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:14px; transition:all 0.15s; }
        .prod-editBtn{background:#f0f7f4}.prod-editBtn:hover{background:#d6efdf;transform:scale(1.08)}
        .prod-deleteBtn{background:#fdf2f2}.prod-deleteBtn:hover{background:#fce0e0;transform:scale(1.08)}
        .prod-qvBtn{background:#f0f7f4}.prod-qvBtn:hover{background:#d6efdf;transform:scale(1.08)}
        .prod-pagination { padding:18px 20px; border-top:1px solid #f0f0f0; display:flex; flex-direction:column; align-items:center; gap:10px; }
        .prod-paginationControls { display:flex; gap:6px; align-items:center; flex-wrap:wrap; justify-content:center; }
        .prod-pageBtn { width:36px; height:36px; border-radius:9px; border:1px solid #e8e8e8; background:#fff; cursor:pointer; font-size:14px; color:#666; display:flex; align-items:center; justify-content:center; transition:all 0.15s; font-family:'DM Sans',sans-serif; }
        .prod-pageBtn:hover:not(:disabled) { background:#f0f9f4; border-color:rgba(26,122,94,0.3); color:#1a7a5e; }
        .prod-pageBtn.active { background:#1a7a5e; color:#fff; border-color:#1a7a5e; font-weight:700; }
        .prod-pageBtn:disabled { opacity:0.3; cursor:not-allowed; }
        .prod-pageEllipsis { color:#ccc; font-size:15px; padding:0 4px; }
        .prod-paginationInfo { font-size:12px; color:#bbb; font-family:'DM Sans',sans-serif; }
        .prod-empty { text-align:center; padding:64px 20px; color:#ccc; font-family:'DM Sans',sans-serif; }
        .prod-emptyIcon { font-size:44px; margin-bottom:12px; }
        .price-filter-status { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:6px 10px; background:#edfaf4; border:1px solid rgba(26,122,94,0.2); border-radius:8px; }
        .price-filter-status-text { font-size:11px; font-weight:600; color:#1a7a5e; font-family:'DM Sans',sans-serif; }
        .price-filter-reset { background:none; border:none; cursor:pointer; font-size:11px; color:#b94a48; font-family:'DM Sans',sans-serif; font-weight:600; padding:0; }
        .price-filter-reset:hover { text-decoration:underline; }
        .brand-filter-status { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; padding:6px 10px; background:#edfaf4; border:1px solid rgba(26,122,94,0.2); border-radius:8px; }
        .brand-filter-status-text { font-size:11px; font-weight:600; color:#1a7a5e; font-family:'DM Sans',sans-serif; }
        .brand-filter-reset { background:none; border:none; cursor:pointer; font-size:11px; color:#b94a48; font-family:'DM Sans',sans-serif; font-weight:600; padding:0; }
        .brand-filter-reset:hover { text-decoration:underline; }
        .brand-skeleton { height:22px; border-radius:5px; background:#f0f0ee; margin-bottom:8px; animation:pulse 1.3s ease infinite; }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast}/>

      {confirmDelete&&<ConfirmDialog message={`Are you sure you want to permanently delete "${confirmDelete.name}"?`} onConfirm={handleDeleteConfirm} onCancel={()=>setConfirmDelete(null)}/>}
      {modal&&<ProductModal mode={modal.mode} productData={modal.productData} onClose={()=>setModal(null)} onSubmit={modal.mode==='add'?handleAddSubmit:handleEditSubmit}/>}
      {quickViewProduct&&<QuickViewModal product={quickViewProduct} onClose={()=>setQuickViewProduct(null)} onAddToCart={handleAddToCart} onAddToWishlist={handleToggleWishlist} isWishlisted={!!wishlist.find(i=>i.id===quickViewProduct.id)}/>}

      <SiteHeader cartCount={cartCount} wishlistCount={wishlistCount}/>
      <PageTitleBar title="Product Management" breadcrumb={['Home','Products','Product Management']}/>

      <div className="shop-layout">
        <aside className="shop-sidebar">

          {/* ── Filter by Price ── */}
          <div className="filter-block">
            <div className="filter-header" onClick={()=>setPriceOpen(p=>!p)}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span className="filter-title">Filter by Price</span>
                {isPriceFilterActive&&<span style={{width:7,height:7,borderRadius:'50%',background:'#1a7a5e',flexShrink:0,animation:'pulse 1.5s ease infinite'}}/>}
              </div>
              <span className="filter-arrow" style={{transform:priceOpen?'rotate(180deg)':'none'}}>▼</span>
            </div>
            {priceOpen&&<div className="filter-body">

              {isPriceFilterActive&&(
                <div className="price-filter-status">
                  <span className="price-filter-status-text">
                    {priceFilterLoading ? '⏳ Filtering…' : `✓ ${priceFiltered.length} result${priceFiltered.length!==1?'s':''} found`}
                  </span>
                  <button className="price-filter-reset" onClick={resetPriceFilter}>Reset</button>
                </div>
              )}

              <div className="price-inputs">
                <input
                  className={`price-input${isPriceFilterActive?' active':''}`}
                  type="number" placeholder="Min"
                  value={priceMin === 0 ? '' : priceMin}
                  onChange={e=>handlePriceMinChange(Math.max(0,Number(e.target.value||0)))}
                />
                <span className="price-dash">—</span>
                <input
                  className={`price-input${isPriceFilterActive?' active':''}`}
                  type="number" placeholder="Max"
                  value={priceMax === 9999999 ? '' : priceMax}
                  onChange={e=>handlePriceMaxChange(Number(e.target.value||9999999))}
                />
              </div>

              <div className="range-wrap">
                <div className="range-track">
                  <div className="range-fill" style={{
                    left:`${Math.min((sliderMin/200000)*100,100)}%`,
                    width:`${Math.min(((sliderMax-sliderMin)/200000)*100,100)}%`,
                  }}/>
                </div>
                <input type="range" min={0} max={200000} step={100}
                  value={sliderMin}
                  onChange={e=>handlePriceMinChange(Math.min(Number(e.target.value),sliderMax-100))}
                  className="range-slider"
                />
                <input type="range" min={0} max={200000} step={100}
                  value={sliderMax}
                  onChange={e=>handlePriceMaxChange(Math.max(Number(e.target.value),sliderMin+100))}
                  className="range-slider"
                />
              </div>
              <div className="range-labels"><span>₹0</span><span>50K</span><span>1L</span><span>1.5L</span><span>2L+</span></div>

              {priceFilterLoading&&(
                <div style={{display:'flex',alignItems:'center',gap:7,marginTop:10,color:'#1a7a5e',fontFamily:"'DM Sans',sans-serif",fontSize:12}}>
                  <span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(26,122,94,0.25)',borderTopColor:'#1a7a5e',animation:'spin 0.7s linear infinite',display:'inline-block',flexShrink:0}}/>
                  Fetching prices…
                </div>
              )}
            </div>}
          </div>

          {/* ── Filter by Brand ── */}
          <div className="filter-block">
            <div className="filter-header" onClick={()=>setBrandOpen(p=>!p)}>
              <div style={{display:'flex',alignItems:'center',gap:7}}>
                <span className="filter-title">Filter by Brand</span>
                {isBrandFilterActive&&<span style={{width:7,height:7,borderRadius:'50%',background:'#1a7a5e',flexShrink:0,animation:'pulse 1.5s ease infinite'}}/>}
              </div>
              <span className="filter-arrow" style={{transform:brandOpen?'rotate(180deg)':'none'}}>▼</span>
            </div>
            {brandOpen&&<div className="filter-body">

              {/* Active brand filter badge */}
              {isBrandFilterActive&&(
                <div className="brand-filter-status">
                  <span className="brand-filter-status-text">
                    {brandFilterLoading
                      ? '⏳ Filtering…'
                      : `✓ ${brandFiltered.length} result${brandFiltered.length!==1?'s':''} found`
                    }
                  </span>
                  <button className="brand-filter-reset" onClick={resetBrandFilter}>Reset</button>
                </div>
              )}

              {/* Loading skeletons while brands fetch */}
              {brandsLoading
                ? [1,2,3,4,5].map(i=>(
                    <div key={i} className="brand-skeleton" style={{width:`${60+i*8}%`}}/>
                  ))
                : brands.length === 0
                  ? <div style={{fontSize:13,color:'#ccc',fontFamily:"'DM Sans',sans-serif",padding:'8px 0'}}>No brands available</div>
                  : brands.map(b=>(
                      <label key={b.brand_id} className="brand-row">
                        <input
                          type="checkbox"
                          className="brand-check"
                          checked={selectedBrandIds.includes(b.brand_id)}
                          onChange={()=>handleBrandToggle(b.brand_id)}
                          disabled={brandFilterLoading}
                        />
                        <span className="brand-name">{b.brand_name}</span>
                        {/* Subtle loading indicator per row when filter is running */}
                        {brandFilterLoading && selectedBrandIds.includes(b.brand_id) && (
                          <span style={{width:10,height:10,borderRadius:'50%',border:'1.5px solid rgba(26,122,94,0.25)',borderTopColor:'#1a7a5e',animation:'spin 0.7s linear infinite',display:'inline-block',flexShrink:0}}/>
                        )}
                      </label>
                    ))
              }

              {/* Inline spinner when API call is running */}
              {brandFilterLoading&&(
                <div style={{display:'flex',alignItems:'center',gap:7,marginTop:10,color:'#1a7a5e',fontFamily:"'DM Sans',sans-serif",fontSize:12}}>
                  <span style={{width:13,height:13,borderRadius:'50%',border:'2px solid rgba(26,122,94,0.25)',borderTopColor:'#1a7a5e',animation:'spin 0.7s linear infinite',display:'inline-block',flexShrink:0}}/>
                  Filtering by brand…
                </div>
              )}
            </div>}
          </div>

          {/* ── Filter by Category ── */}
          <div className="filter-block">
            <div className="filter-header" onClick={()=>setCatFilterOpen(p=>!p)}>
              <span className="filter-title">Filter by Category</span>
              <span className="filter-arrow" style={{transform:catFilterOpen?'rotate(180deg)':'none'}}>▼</span>
            </div>
            {catFilterOpen&&<div className="filter-body">
              {CATEGORIES.filter(c=>c!=='All').map(cat=><label key={cat} className="brand-row"><input type="checkbox" className="brand-check" checked={activeCategory===cat} onChange={()=>setActiveCategory(activeCategory===cat?'All':cat)}/><span className="brand-name">{cat}</span></label>)}
            </div>}
          </div>
        </aside>

        <div className="shop-main">
          <div className="shop-toolbar">
            <div className="shop-toolbar-left">
              <div className="shop-view-btns">
                <button className={`shop-view-btn${viewMode==='grid'?' active':''}`} onClick={()=>setViewMode('grid')} title="Grid view"><svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="0" y="0" width="6" height="6" rx="1.5"/><rect x="9" y="0" width="6" height="6" rx="1.5"/><rect x="0" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/></svg></button>
                <button className={`shop-view-btn${viewMode==='table'?' active':''}`} onClick={()=>setViewMode('table')} title="Table view"><svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor"><rect x="0" y="0" width="15" height="2.5" rx="1"/><rect x="0" y="6" width="15" height="2.5" rx="1"/><rect x="0" y="12" width="15" height="2.5" rx="1"/></svg></button>
              </div>
              <span className="shop-count">
                <strong>{isAnyFilterActive ? sorted.length : totalCount}</strong> products
                {isBrandFilterActive&&<span style={{marginLeft:6,fontSize:11,color:'#1a7a5e',fontWeight:600}}>
                  (brand filtered{isPriceFilterActive?' + price':''})
                </span>}
                {!isBrandFilterActive&&isPriceFilterActive&&<span style={{marginLeft:6,fontSize:11,color:'#1a7a5e',fontWeight:600}}>(price filtered)</span>}
              </span>
            </div>
            <div className="shop-toolbar-right">
              <div className="shop-search-inline">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="#ccc" strokeWidth="1.5"/><path d="M9 9l3 3" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round"/></svg>
                <input className="shop-search-input" type="text" placeholder="Search products…" value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
              </div>
              <div className="shop-sort-wrap">
                <select className="shop-sort-select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
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

          {/* Loading state */}
          {(productsLoading || priceFilterLoading || brandFilterLoading) ? (
            <div className="shop-grid">
              {Array.from({length:PAGE_LIMIT}).map((_,i)=>(
                <div key={i} className="shop-card" style={{animationDelay:`${i*0.06}s`}}>
                  <div style={{padding:'12px 12px 0'}}><div style={{width:'100%',height:158,borderRadius:12,background:'#f0f0ee',animation:'pulse 1.3s ease infinite'}}/></div>
                  <div style={{padding:13}}>
                    <div style={{height:13,borderRadius:4,background:'#f0f0ee',width:'78%',marginBottom:8,animation:'pulse 1.3s ease infinite'}}/>
                    <div style={{height:11,borderRadius:4,background:'#f5f5f3',width:'48%',marginBottom:12,animation:'pulse 1.3s ease infinite'}}/>
                    <div style={{height:34,borderRadius:8,background:'#f5f5f3',animation:'pulse 1.3s ease infinite'}}/>
                  </div>
                </div>
              ))}
            </div>
          ) : sorted.length === 0 ? (
            <div className="prod-empty">
              <div className="prod-emptyIcon">{isBrandFilterActive ? '🏷️' : isPriceFilterActive ? '💰' : '📦'}</div>
              <div style={{fontSize:15}}>
                {isBrandFilterActive
                  ? `No products found for the selected brand${selectedBrandIds.length>1?'s':''}`
                  : isPriceFilterActive
                    ? 'No products in this price range'
                    : 'No products found'
                }
              </div>
              {isBrandFilterActive && (
                <button onClick={resetBrandFilter} style={{marginTop:12,padding:'8px 18px',background:'#1a7a5e',color:'#fff',border:'none',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  Clear Brand Filter
                </button>
              )}
              {isPriceFilterActive && !isBrandFilterActive && (
                <button onClick={resetPriceFilter} style={{marginTop:12,padding:'8px 18px',background:'#1a7a5e',color:'#fff',border:'none',borderRadius:8,fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:600,cursor:'pointer'}}>
                  Clear Price Filter
                </button>
              )}
              {searchQuery && !isAnyFilterActive && <div style={{fontSize:13,marginTop:6,color:'#ccc'}}>Try a different search or filter</div>}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="shop-grid">
              {sorted.map((p,i)=>{
                const d=disc(p.original_price,p.price)
                const isW=!!wishlist.find(w=>w.id===p.id)
                const isHov=hoveredCard===p.id
                return (
                  <div
                    className="shop-card"
                    key={p.id}
                    style={{
                      animationDelay:`${i*0.05}s`,
                      boxShadow: isHov ? '0 10px 36px rgba(0,0,0,0.13)' : undefined,
                      transform: isHov ? 'translateY(-4px)' : undefined,
                      borderColor: isHov ? '#e0e0e0' : undefined,
                    }}
                    onMouseEnter={()=>setHoveredCard(p.id)}
                    onMouseLeave={()=>setHoveredCard(null)}
                  >
                    <div className="shop-card-img-wrap">
                      {d>0&&<span className="shop-disc-badge">-{d}%</span>}
                      <div className="shop-side-actions" style={{
                        opacity: isHov ? 1 : 0,
                        transform: isHov ? 'translateX(0)' : 'translateX(10px)',
                        transition: 'opacity 0.22s ease, transform 0.22s ease',
                        pointerEvents: isHov ? 'all' : 'none',
                      }}>
                        <button className={`shop-side-btn${isW?' is-wished':''}`} data-tip={isW?'Remove Wishlist':'Add to Wishlist'} onClick={e=>{e.stopPropagation();handleToggleWishlist(p)}}>{isW?'❤️':'🤍'}</button>
                        <button className="shop-side-btn is-qv" data-tip="Quick View" onClick={e=>{e.stopPropagation();setQuickViewProduct(p)}}><span style={{fontSize:14,filter:'brightness(0) invert(1)'}}>👁</span></button>
                      </div>
                      {p.imageObj
                        ? <div style={{width:'100%',height:160,borderRadius:12,background:'#f9f9f9',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden'}}><ProductImage imageObj={p.imageObj} alt={p.name} style={{maxWidth:'100%',maxHeight:160,objectFit:'contain',display:'block'}}/></div>
                        : <ProductThumb name={p.name} category={p.category}/>
                      }
                    </div>
                    <div className="shop-card-body">
                      <div className="shop-card-name">{p.name}</div>
                      {p.category&&<div className="shop-card-brand">{p.category}</div>}
                      <div className="shop-card-price-row">
                        <span className="shop-card-price">{fmt(p.price)}</span>
                        {p.original_price>p.price&&<span className="shop-card-orig">{fmt(p.original_price)}</span>}
                      </div>
                      {p.stock===0
                        ? <button className="shop-oos-btn" disabled>Out of Stock</button>
                        : <div style={{
                            overflow:'hidden',
                            maxHeight: isHov ? 52 : 0,
                            opacity: isHov ? 1 : 0,
                            marginTop: isHov ? 8 : 0,
                            transition:'max-height 0.28s ease, opacity 0.22s ease, margin-top 0.28s ease',
                          }}>
                            <button className="shop-cart-btn" onClick={e=>{e.stopPropagation();handleAddToCart(p)}}><span>🛒</span>Add To Cart</button>
                          </div>
                      }
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="prod-tableWrapper" style={{background:'#fff',borderRadius:13,border:'1px solid #ebebeb',overflow:'hidden',boxShadow:'0 1px 6px rgba(0,0,0,0.04)'}}>
              <table className="prod-table">
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Updated</th><th>Actions</th></tr></thead>
                <tbody>
                  {sorted.map(p=>{
                    const d=disc(p.original_price,p.price)
                    return <tr key={p.id}>
                      <td><div style={{display:'flex',alignItems:'center',gap:12}}>
                        {p.imageObj?<div style={{width:44,height:44,borderRadius:10,background:'#f5f5f3',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center'}}><ProductImage imageObj={p.imageObj} alt={p.name} style={{width:44,height:44,objectFit:'contain'}}/></div>:<div style={{width:44,height:44,borderRadius:10,background:'#f5f5f3',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{CAT_ICONS[p.category]||'📦'}</div>}
                        <div><div style={{fontWeight:600,color:'#1a1a1a',fontSize:13.5,fontFamily:"'Syne',sans-serif"}}>{p.name}</div>{p.sku&&<div style={{fontSize:11,color:'#ccc',fontFamily:'monospace',marginTop:2}}>{p.sku}</div>}</div>
                      </div></td>
                      <td><CategoryBadge category={p.category}/></td>
                      <td><div style={{fontWeight:700,color:'#1a1a1a',fontFamily:"'Syne',sans-serif",fontSize:14}}>{fmt(p.price)}</div>{d>0&&<div style={{fontSize:11,color:'#1a7a5e',fontWeight:600,marginTop:1}}>-{d}% off</div>}</td>
                      <td><span style={{fontSize:13.5,fontWeight:600,color:p.stock===0?'#b94a48':p.stock<=5?'#c2570a':'#1a7a5e'}}>{p.stock===0?'Out of stock':p.stock}</span></td>
                      <td><StatusBadge status={p.status}/></td>
                      <td style={{color:'#bbb',fontSize:12.5}}>{fmtDate(p.updated_at)}</td>
                      <td><div className="prod-tblActions">
                        <button className="prod-editBtn" onClick={()=>setModal({mode:'edit',productData:p})} title="Edit">✏️</button>
                        <button className="prod-deleteBtn" onClick={()=>setConfirmDelete({id:p.id,name:p.name})} title="Delete">🗑️</button>
                        <button className="prod-qvBtn" onClick={()=>setQuickViewProduct(p)} title="Quick View">👁</button>
                      </div></td>
                    </tr>
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination — only show when no server-side filter is active */}
          {!isAnyFilterActive && totalPages > 1 && (
            <div className="prod-pagination">
              <div className="prod-paginationControls">
                <button className="prod-pageBtn" onClick={()=>goToPage(1)} disabled={currentPage===1||productsLoading}>«</button>
                <button className="prod-pageBtn" onClick={()=>goToPage(currentPage-1)} disabled={currentPage===1||productsLoading}>‹</button>
                {getPages().map((page,idx)=>page==='...'?<span key={`e-${idx}`} className="prod-pageEllipsis">…</span>:<button key={page} className={`prod-pageBtn${currentPage===page?' active':''}`} onClick={()=>goToPage(page)} disabled={productsLoading}>{page}</button>)}
                <button className="prod-pageBtn" onClick={()=>goToPage(currentPage+1)} disabled={currentPage===totalPages||productsLoading}>›</button>
                <button className="prod-pageBtn" onClick={()=>goToPage(totalPages)} disabled={currentPage===totalPages||productsLoading}>»</button>
              </div>
              <div className="prod-paginationInfo">Page {currentPage} of {totalPages} · {totalCount} products</div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
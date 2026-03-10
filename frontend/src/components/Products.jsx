import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

/* ── helpers ─────────────────────────────────────────── */
const PAGE_SIZE  = 5
const MAX_IMAGES = 5

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

/* ── Image URL resolver ──────────────────────────────── */
function resolveImageUrl(p) {
  if (p.image_data) return bufferToDataUrl(p.image_data)
  if (Array.isArray(p.product_images) && p.product_images.length > 0) {
    const first = p.product_images[0]
    if (first.image_url && typeof first.image_url === 'string') return first.image_url
    if (first.image_data) return bufferToDataUrl(first.image_data)
    if (first.data) return bufferToDataUrl(first)
  }
  if (p.product_image) {
    if (typeof p.product_image === 'string') return p.product_image
    return bufferToDataUrl(p.product_image)
  }
  return null
}

function bufferToDataUrl(bufferObj) {
  if (!bufferObj) return null
  const raw = bufferObj.image_data ?? bufferObj
  if (!raw || !Array.isArray(raw.data) || raw.data.length === 0) return null
  try {
    const bytes = new Uint8Array(raw.data)
    let binary  = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    return `data:image/jpeg;base64,${btoa(binary)}`
  } catch { return null }
}

/* ── useProducts hook ────────────────────────────────── */
function useProducts() {
  const [products, setProducts]         = useState([])
  const [productsLoading, setLoading]   = useState(true)
  const [totalRecords, setTotalRecords] = useState(0)
  const [currentPage, setCurrentPage]   = useState(1)

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const res  = await fetch('http://localhost:5000/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'displayAllProducts', page, limit: PAGE_SIZE }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to fetch products.')
      const mapped = (json.data ?? []).map((p, i) => ({
        id:         p.product_id ?? p.id ?? i + 1,
        name:       p.product_name,
        category:   p.category_name ?? '',
        price:      parseFloat(p.price) || 0,
        stock:      p.stock ?? 0,
        status:     p.status ?? 1,
        image_url:  resolveImageUrl(p),
        updated_at: p.updated_at ?? null,
      }))
      setProducts(mapped)
      setTotalRecords(json.pagination?.totalRecords ?? mapped.length)
      setCurrentPage(json.pagination?.currentPage ?? page)
    } catch (err) {
      setProducts([]); setTotalRecords(0)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProducts(1) }, [fetchProducts])
  return { products, setProducts, productsLoading, totalRecords, currentPage, refetch: fetchProducts }
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

/* ── useCategoryOptions hook ─────────────────────────── */
function useCategoryOptions() {
  const [categoryOptions, setCategoryOptions]     = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    fetch('http://localhost:5000/list-categories', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'listAllCategories' }),
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then(json => {
        if (cancelled) return
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const active = json.data.filter(c => c.status === 1)
          const list   = (active.length > 0 ? active : json.data).map(c => ({ id: c.id, category_name: c.category_name }))
          setCategoryOptions(list)
        } else { setCategoryOptions([]) }
      })
      .catch(() => { if (!cancelled) setCategoryOptions([]) })
      .finally(() => { if (!cancelled) setCategoriesLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { categoryOptions, categoriesLoading }
}

/* ── Helpers ─────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—'
  const d    = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

/* ── Multi-Image Upload ──────────────────────────────── */
function ImageUpload({ imageEntries, onChange }) {
  const inputRef  = useRef(null)
  const [drag, setDrag] = useState(false)
  const canAddMore = imageEntries.length < MAX_IMAGES

  const addFiles = (files) => {
    const valid = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - imageEntries.length)
    if (!valid.length) return
    onChange([...imageEntries, ...valid.map(file => ({ file, preview: URL.createObjectURL(file) }))])
  }

  const handleRemove = (index) => {
    const entry = imageEntries[index]
    if (entry.preview?.startsWith('blob:')) URL.revokeObjectURL(entry.preview)
    onChange(imageEntries.filter((_, i) => i !== index))
  }

  const thumbStyle = { width: 72, height: 72, borderRadius: 10, objectFit: 'cover', display: 'block', border: '1px solid #e0e0e0' }

  return (
    <div style={{ gridColumn: '1 / -1' }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
        Product Images
        <span style={{ marginLeft: 8, fontWeight: 400, color: '#aaa', fontSize: 12 }}>({imageEntries.length}/{MAX_IMAGES})</span>
      </label>

      {imageEntries.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 8 }}>
          {imageEntries.map((entry, i) => (
            <div key={i} style={{ position: 'relative' }}>
              <img src={entry.preview} alt={`img-${i}`} style={thumbStyle} />
              {i === 0 && (
                <span style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9, fontWeight: 700, background: '#1a7a5e', color: '#fff', borderRadius: 4, padding: '2px 5px', letterSpacing: '0.04em' }}>PRIMARY</span>
              )}
              <button type="button" onClick={() => handleRemove(i)}
                style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: '#e05555', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>✕</button>
            </div>
          ))}
          {canAddMore && (
            <div onClick={() => inputRef.current?.click()}
              style={{ width: 72, height: 72, borderRadius: 10, border: '2px dashed #d0d0d0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#aaa', fontSize: 12, gap: 4, transition: 'border-color 0.15s' }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>＋</span>
              <span>Add</span>
            </div>
          )}
        </div>
      )}

      {imageEntries.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }}
          onClick={() => inputRef.current?.click()}
          style={{ border: `2px dashed ${drag ? '#1a7a5e' : '#d0d0d0'}`, borderRadius: 12, padding: '28px 20px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s', background: drag ? 'rgba(26,122,94,0.04)' : '#fafafa' }}>
          <div style={{ fontSize: 28, marginBottom: 8, color: '#ccc' }}>🖼</div>
          <p style={{ margin: '0 0 4px', fontSize: 14, fontFamily: "'DM Sans', sans-serif", color: '#666' }}>
            <span style={{ color: '#1a7a5e', fontWeight: 600 }}>Click to upload</span> or drag &amp; drop
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#aaa', fontFamily: "'DM Sans', sans-serif" }}>PNG, JPG, WEBP — max 5 MB each · up to {MAX_IMAGES} images</p>
        </div>
      )}

      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }}
        onChange={e => { addFiles(e.target.files); e.target.value = '' }} />
    </div>
  )
}

/* ── Product Modal ───────────────────────────────────── */
const EMPTY_FORM = { name: '', category_id: '', price: '', stock: '', status: 'Active' }

function ProductModal({ mode, initial, onClose, onSave, loading, categoryOptions, categoriesLoading }) {
  const [form, setForm]     = useState(initial || { ...EMPTY_FORM, category_id: categoryOptions[0]?.id ?? '' })
  const [errors, setErrors] = useState({})
  const [imageEntries, setImageEntries] = useState(() =>
    initial?.image_url ? [{ file: null, preview: initial.image_url }] : []
  )
  const isEdit = mode === 'edit'

  useEffect(() => {
    if (mode === 'add' && !form.category_id && categoryOptions.length > 0)
      setForm(f => ({ ...f, category_id: categoryOptions[0].id }))
  }, [categoryOptions, mode, form.category_id])

  useEffect(() => {
    return () => imageEntries.forEach(e => { if (e.preview?.startsWith('blob:')) URL.revokeObjectURL(e.preview) })
  }, [])

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Product name is required.'
    if (form.price === '' || isNaN(+form.price) || +form.price < 0) e.price = 'Enter a valid price.'
    if (form.stock === '' || isNaN(+form.stock) || !Number.isInteger(+form.stock) || +form.stock < 0) e.stock = 'Enter a valid stock quantity.'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10), imageFiles: imageEntries.map(e => e.file).filter(Boolean) })
  }

  const inp = (hasError, disabled) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    border: `1px solid ${hasError ? '#e05555' : '#e0e0e0'}`,
    background: disabled ? '#f7f7f7' : '#fff',
    color: disabled ? '#aaa' : '#1a1a1a',
    outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease',
  })
  const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }
  const err = { fontSize: 12, color: '#e05555', marginTop: 4, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 580, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#edf7f2', border: '1px solid rgba(26,122,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>◈</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>{isEdit ? 'Edit Product' : 'Add New Product'}</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{isEdit ? 'Update the product details below.' : 'Fill in the details to create a new product.'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            {/* Product Name */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={lbl}>Product Name <span style={{ color: '#e05555' }}>*</span></label>
              <input style={inp(errors.name)} placeholder="e.g. Wireless Headphones" value={form.name} onChange={e => set('name', e.target.value)} />
              {errors.name && <span style={err}>{errors.name}</span>}
            </div>

            {/* Category */}
            <div>
              <label style={lbl}>Category <span style={{ color: '#e05555' }}>*</span></label>
              <div style={{ position: 'relative' }}>
                {categoriesLoading ? (
                  <select style={{ ...inp(false, true), appearance: 'none', paddingRight: 36 }} disabled><option>Loading…</option></select>
                ) : (
                  <select style={{ ...inp(false), appearance: 'none', paddingRight: 36, cursor: 'pointer' }}
                    value={form.category_id} onChange={e => set('category_id', Number(e.target.value))}>
                    {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                )}
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888', fontSize: 13 }}>▾</span>
              </div>
            </div>

            {/* Price */}
            <div>
              <label style={lbl}>Price (Rupees) <span style={{ color: '#e05555' }}>*</span></label>
              <input style={inp(errors.price)} placeholder="0.00" type="number" min="0" step="0.01" value={form.price} onChange={e => set('price', e.target.value)} />
              {errors.price && <span style={err}>{errors.price}</span>}
            </div>

            {/* Stock */}
            <div>
              <label style={lbl}>Stock Qty <span style={{ color: '#e05555' }}>*</span></label>
              <input style={inp(errors.stock)} placeholder="0" type="number" min="0" step="1" value={form.stock} onChange={e => set('stock', e.target.value)} />
              {errors.stock && <span style={err}>{errors.stock}</span>}
            </div>

            {/* Status (edit only) */}
            {isEdit && (
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Status <span style={{ color: '#e05555' }}>*</span></label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {['Active', 'Inactive'].map(opt => {
                    const isActive   = opt === 'Active'
                    const isSelected = form.status === opt
                    return (
                      <label key={opt} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', padding: '9px 20px', borderRadius: 10, border: `1.5px solid ${isSelected ? (isActive ? '#22c55e' : '#ef4444') : '#e0e0e0'}`, background: isSelected ? (isActive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') : 'transparent', fontWeight: isSelected ? 600 : 400, color: isSelected ? (isActive ? '#16a34a' : '#dc2626') : '#999', fontSize: 14, transition: 'all 0.15s ease', fontFamily: "'DM Sans', sans-serif" }}>
                        <input type="radio" name="product-status" value={opt} checked={isSelected} onChange={() => set('status', opt)} style={{ display: 'none' }} />
                        <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: isActive ? '#22c55e' : '#ef4444', boxShadow: isSelected ? `0 0 0 3px ${isActive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` : 'none', display: 'inline-block' }} />
                        {opt}
                      </label>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Image upload */}
            <ImageUpload imageEntries={imageEntries} onChange={setImageEntries} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#1a7a5e', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(26,122,94,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : null}
            {isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete Modal ────────────────────────────────────── */
function DeleteModal({ product, onClose, onConfirm, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf2f2', border: '1px solid rgba(185,74,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#b94a48' }}>⚠</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>Delete Product</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>This action cannot be undone.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', fontSize: 15, color: '#555', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: '#1a1a1a' }}>{product.name}</strong>? This will permanently remove the product and all associated data.
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#b94a48', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(185,74,72,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : null}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ MAIN PAGE ═══════════════════════════════════════════ */
export default function Products() {
  const { products, setProducts, productsLoading, totalRecords, currentPage, refetch } = useProducts()
  const [page, setPage]     = useState(1)
  const [modal, setModal]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [user, setUser]     = useState(null)
  const navigate            = useNavigate()
  const { toasts, add: toast, remove: removeToast } = useToasts()
  const { categoryOptions, categoriesLoading }       = useCategoryOptions()

  useEffect(() => { refetch(page) }, [page])

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    try { setUser(JSON.parse(stored)) }
    catch { localStorage.removeItem('user'); navigate('/') }
  }, [])

  const total    = totalRecords
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, lastPage)
  const pages    = buildPages(total, safePage)
  const slice    = products

  const openAdd    = () => setModal({ type: 'add' })
  const openEdit   = (p) => setModal({ type: 'edit', product: { ...p, name: p.name, category_id: categoryOptions.find(c => c.category_name === p.category)?.id ?? '', price: String(p.price), stock: String(p.stock), status: p.status === 1 ? 'Active' : 'Inactive', image_url: p.image_url ?? null } })
  const openDelete = (p) => setModal({ type: 'delete', product: p })
  const closeModal = () => setModal(null)

  const handleSave = async (data) => {
    setSaving(true)
    if (modal.type === 'add') {
      try {
        const fd = new FormData()
        fd.append('product_name', data.name)
        fd.append('category_id',  data.category_id)
        fd.append('price',        data.price)
        fd.append('stock',        data.stock)
        fd.append('status',       data.status === 'Active' ? 1 : 2)
        data.imageFiles?.forEach(file => fd.append('images', file))
        const res  = await fetch('http://localhost:5000/add-product', { method: 'POST', body: fd })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to add product.')
        const cat = categoryOptions.find(c => c.id === data.category_id)
        setProducts(ps => [{ id: json.data.product_id, name: data.name, category: cat?.category_name ?? '', price: data.price, stock: data.stock, status: data.status === 'Active' ? 1 : 2, image_url: data.imageFiles?.length > 0 ? URL.createObjectURL(data.imageFiles[0]) : null, updated_at: new Date().toISOString() }, ...ps])
        toast('Product added successfully.', 'success')
        closeModal()
        refetch(page)
      } catch (err) { toast(err.message || 'Something went wrong.', 'error') }
      finally { setSaving(false) }
    } else {
      try {
        const fd = new FormData()
        fd.append('type',         'updateProduct')
        fd.append('product_id',   modal.product.id)
        fd.append('product_name', data.name)
        fd.append('category_id',  data.category_id)
        fd.append('price',        data.price)
        fd.append('stock',        data.stock)
        fd.append('status',       data.status === 'Active' ? 1 : 2)
        data.imageFiles?.forEach(file => fd.append('images', file))
        const res  = await fetch('http://localhost:5000/update-product', { method: 'PUT', body: fd })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update product.')
        const cat = categoryOptions.find(c => c.id === data.category_id)
        setProducts(ps => ps.map(p => p.id === modal.product.id ? { ...p, name: data.name, category: cat?.category_name ?? p.category, price: parseFloat(data.price), stock: parseInt(data.stock, 10), status: data.status === 'Active' ? 1 : 2, image_url: data.imageFiles?.length > 0 ? URL.createObjectURL(data.imageFiles[0]) : p.image_url, updated_at: new Date().toISOString() } : p))
        toast('Product updated successfully.', 'success')
        closeModal()
        refetch(page)
      } catch (err) { toast(err.message || 'Something went wrong.', 'error') }
      finally { setSaving(false) }
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res  = await fetch('http://localhost:5000/delete-product', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ product_id: modal.product.id }) })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete product.')
      setProducts(ps => ps.filter(p => p.id !== modal.product.id))
      toast('Product deleted successfully.', 'info')
      closeModal()
      const newPage = products.length === 1 && page > 1 ? page - 1 : page
      setPage(newPage); refetch(newPage)
    } catch (err) { toast(err.message || 'Something went wrong.', 'error') }
    finally { setSaving(false) }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .prod-wrap { width: 100%; }

        .prod-topbar {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
        }

        .prod-title {
          font-family: 'Syne', sans-serif; font-size: 26px;
          font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px; margin: 0 0 4px;
        }

        .prod-subtitle {
          font-size: 14px; color: #888; margin: 0; font-family: 'DM Sans', sans-serif;
        }

        .prod-addBtn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px; background: #1a7a5e; color: #fff;
          border: none; border-radius: 12px; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 14px rgba(26,122,94,0.3);
          transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .prod-addBtn:hover { background: #1d8a6a; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,122,94,0.35); }

        .prod-card {
          background: #fff; border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .prod-tableWrapper { overflow-x: auto; }

        .prod-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; min-width: 700px;
        }

        .prod-table thead tr {
          background: #f9f8f6; border-bottom: 1px solid rgba(0,0,0,0.07);
        }

        .prod-table th {
          padding: 14px 20px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #aaa; text-align: left; white-space: nowrap;
        }

        .prod-table tbody tr {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: background 0.15s ease;
        }

        .prod-table tbody tr:last-child { border-bottom: none; }
        .prod-table tbody tr:hover { background: #fafaf8; }

        .prod-table td {
          padding: 13px 20px; font-size: 14px; color: #444; vertical-align: middle;
        }

        .prod-name { font-weight: 600; color: #1a1a1a; font-size: 14px; }

        .prod-price { font-weight: 600; color: #1a1a1a; }

        .prod-stock { font-weight: 600; color: #1a1a1a; }
        .prod-stock--low { color: #d97706; }
        .prod-stock--out { color: #b94a48; }

        .prod-badge {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 3px 12px; border-radius: 999px; font-size: 12px; font-weight: 600;
        }
        .prod-badge--active   { background: rgba(34,197,94,.10); color: #16a34a; border: 1px solid rgba(34,197,94,.25); }
        .prod-badge--inactive { background: rgba(185,74,72,.08); color: #b94a48; border: 1px solid rgba(185,74,72,.22); }

        .prod-actions { display: flex; gap: 8px; justify-content: center; }

        .prod-editBtn, .prod-deleteBtn {
          width: 34px; height: 34px; border-radius: 9px; border: none;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 15px;
          transition: background 0.15s ease, transform 0.12s ease;
        }
        .prod-editBtn   { background: #f0f7f4; }
        .prod-editBtn:hover   { background: #d6f0e6; transform: scale(1.08); }
        .prod-deleteBtn { background: #fdf2f2; }
        .prod-deleteBtn:hover { background: #fce0e0; transform: scale(1.08); }

        .prod-empty {
          text-align: center; padding: 60px 20px;
          color: #aaa; font-family: 'DM Sans', sans-serif; font-size: 15px;
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }

        .prod-pagination {
          padding: 18px 20px; border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }

        .prod-paginationControls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }

        .prod-pageBtn {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e0e0e0;
          background: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #555; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s ease;
        }
        .prod-pageBtn:hover:not(:disabled) { background: #f0f7f4; border-color: rgba(26,122,94,0.3); color: #1a7a5e; }
        .prod-pageBtn.active { background: #1a7a5e; color: #fff; border-color: #1a7a5e; font-weight: 700; }
        .prod-pageBtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .prod-pageEllipsis { color: #bbb; font-size: 16px; padding: 0 4px; line-height: 36px; }
        .prod-paginationInfo { font-size: 13px; color: #aaa; font-family: 'DM Sans', sans-serif; }
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
      {modal?.type === 'add'    && <ProductModal mode="add" onClose={closeModal} onSave={handleSave} loading={saving} categoryOptions={categoryOptions} categoriesLoading={categoriesLoading} />}
      {modal?.type === 'edit'   && <ProductModal mode="edit" initial={modal.product} onClose={closeModal} onSave={handleSave} loading={saving} categoryOptions={categoryOptions} categoriesLoading={categoriesLoading} />}
      {modal?.type === 'delete' && <DeleteModal product={modal.product} onClose={closeModal} onConfirm={handleDelete} loading={saving} />}

      <div className="prod-wrap">
        {/* Top bar */}
        <div className="prod-topbar">
          <div>
            <h1 className="prod-title">Products</h1>
            <p className="prod-subtitle">Manage your product catalogue — {total} product{total !== 1 ? 's' : ''} total.</p>
          </div>
          <button className="prod-addBtn" onClick={openAdd}>＋ Add Product</button>
        </div>

        {/* Table card */}
        <div className="prod-card">
          <div className="prod-tableWrapper">
            {productsLoading ? (
              <div className="prod-empty">
                <span style={{ fontSize: 32, animation: 'spin 1s linear infinite', display: 'inline-block', color: '#1a7a5e' }}>◈</span>
                <span>Loading products…</span>
              </div>
            ) : products.length === 0 ? (
              <div className="prod-empty">
                <span style={{ fontSize: 36 }}>◈</span>
                <div style={{ fontWeight: 600, color: '#555' }}>No products yet</div>
                <div>Click <strong>+ Add Product</strong> to create your first listing.</div>
              </div>
            ) : (
              <table className="prod-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {slice.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid #e0e0e0' }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: '#f5f5f5', border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: '#ccc' }}>🖼</div>
                          )}
                          <span className="prod-name">{p.name}</span>
                        </div>
                      </td>
                      <td style={{ color: '#666' }}>{p.category}</td>
                      <td className="prod-price">Rs.{parseFloat(p.price).toFixed(2)}</td>
                      <td>
                        <span className={`prod-stock${p.stock === 0 ? ' prod-stock--out' : p.stock < 50 ? ' prod-stock--low' : ''}`}>
                          {p.stock.toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className={`prod-badge${p.status === 1 ? ' prod-badge--active' : ' prod-badge--inactive'}`}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 1 ? '#22c55e' : '#b94a48', flexShrink: 0 }} />
                          {p.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: '#aaa', fontSize: 13 }}>{formatDate(p.updated_at)}</td>
                      <td>
                        <div className="prod-actions">
                          <button className="prod-editBtn"   title="Edit"   onClick={() => openEdit(p)}>✎</button>
                          <button className="prod-deleteBtn" title="Delete" onClick={() => openDelete(p)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!productsLoading && total > 0 && (
            <div className="prod-pagination">
              <div className="prod-paginationControls">
                <button className="prod-pageBtn" onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
                <button className="prod-pageBtn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>
                {pages.map((pg, i) =>
                  pg === '…'
                    ? <span key={`e${i}`} className="prod-pageEllipsis">…</span>
                    : <button key={pg} className={`prod-pageBtn${pg === safePage ? ' active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
                )}
                <button className="prod-pageBtn" onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={safePage === lastPage}>›</button>
                <button className="prod-pageBtn" onClick={() => setPage(lastPage)} disabled={safePage === lastPage}>»</button>
              </div>
              <div className="prod-paginationInfo">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} of {total} product{total !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
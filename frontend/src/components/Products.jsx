import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Products.css'
import '../styles/Dashboard.css'
import '../styles/Imageupload.css'

const MENUS = [
  { icon: '⬡', label: 'Users',    key: 'users',    path: '/users' },
  { icon: '◎', label: 'Category', key: 'category', path: '/category' },
  { icon: '◈', label: 'Products', key: 'products', path: '/products' },
  { icon: '◇', label: 'Settings', key: 'settings', path: '/settings' },
]

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
// Handles every possible shape the API might return:
//   1. image_data: { type:'Buffer', data:[...] }           ← root-level buffer (new API)
//   2. product_images: [{ image_url: "http://..." }, ...]  ← multi-image array
//   3. product_images: [{ image_data: { ... } }, ...]
//   4. product_image: { type:'Buffer', data:[...] }        ← old single-image
//   5. product_image: "http://..."                         ← string URL
function resolveImageUrl(p) {
  // ── Case 1: root-level image_data buffer (new API) ───
  if (p.image_data) return bufferToDataUrl(p.image_data)

  // ── Case 2 & 3: multi-image array field ──────────────
  if (Array.isArray(p.product_images) && p.product_images.length > 0) {
    const first = p.product_images[0]
    if (first.image_url && typeof first.image_url === 'string') return first.image_url
    if (first.image_data) return bufferToDataUrl(first.image_data)
    if (first.data) return bufferToDataUrl(first)
  }

  // ── Case 4 & 5: legacy single product_image field ────
  if (p.product_image) {
    if (typeof p.product_image === 'string') return p.product_image
    return bufferToDataUrl(p.product_image)
  }

  return null
}

/* ── Buffer → data URL helper ────────────────────────── */
function bufferToDataUrl(bufferObj) {
  if (!bufferObj) return null
  const raw = bufferObj.image_data ?? bufferObj
  if (!raw || !Array.isArray(raw.data) || raw.data.length === 0) return null
  try {
    const bytes = new Uint8Array(raw.data)
    let binary  = ''
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i])
    return `data:image/jpeg;base64,${btoa(binary)}`
  } catch {
    return null
  }
}

/* ── useProducts hook ────────────────────────────────── */
function useProducts() {
  const [products, setProducts]       = useState([])
  const [productsLoading, setLoading] = useState(true)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('http://localhost:5000/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type: 'displayAllProducts' }),
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
    } catch (err) {
      setProducts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  return { products, setProducts, productsLoading, refetch: fetchProducts }
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
const TOAST_ICONS = { success: '✓', error: '✕', info: 'ℹ' }

/* ── Empty / Loading ─────────────────────────────────── */
function EmptyState() {
  return (
    <div className="products__empty">
      <div className="products__emptyIcon">◈</div>
      <p className="products__emptyTitle">No products yet</p>
      <p className="products__emptyText">Click <strong>+ Add Product</strong> to create your first listing.</p>
    </div>
  )
}
function LoadingState() {
  return (
    <div className="products__empty">
      <div className="products__emptyIcon" style={{ animation: 'spin 1s linear infinite' }}>◈</div>
      <p className="products__emptyTitle">Loading products…</p>
    </div>
  )
}

/* ── Helpers ─────────────────────────────────────────── */
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  return `${date}, ${time}`
}

/* ── Status badge ────────────────────────────────────── */
function StatusBadge({ status }) {
  const isActive = status === 1
  return (
    <span className={`products__badge${isActive ? ' products__badge--active' : ' products__badge--inactive'}`}>
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

/* ── Multi-Image Upload ──────────────────────────────── */
function ImageUpload({ imageEntries, onChange }) {
  const inputRef = useRef(null)
  const [drag, setDrag] = useState(false)

  const canAddMore = imageEntries.length < MAX_IMAGES

  const addFiles = (files) => {
    const valid = Array.from(files)
      .filter(f => f.type.startsWith('image/'))
      .slice(0, MAX_IMAGES - imageEntries.length)
    if (!valid.length) return
    const newEntries = valid.map(file => ({ file, preview: URL.createObjectURL(file) }))
    onChange([...imageEntries, ...newEntries])
  }

  const handleDrop = (e) => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files) }

  const handleRemove = (index) => {
    const entry = imageEntries[index]
    if (entry.preview?.startsWith('blob:')) URL.revokeObjectURL(entry.preview)
    onChange(imageEntries.filter((_, i) => i !== index))
  }

  return (
    <div className="modal__field modal__field--full">
      <label className="modal__label">
        Product Images
        <span style={{ marginLeft: 8, fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          ({imageEntries.length}/{MAX_IMAGES})
        </span>
      </label>

      {imageEntries.length > 0 && (
        <div className="imgUpload__thumbGrid">
          {imageEntries.map((entry, i) => (
            <div key={i} className="imgUpload__thumb">
              <img src={entry.preview} alt={`Product image ${i + 1}`} className="imgUpload__thumbImg" />
              {i === 0 && <span className="imgUpload__primaryBadge">Primary</span>}
              <button type="button" className="imgUpload__thumbRemove" onClick={() => handleRemove(i)} title="Remove">✕</button>
            </div>
          ))}
          {canAddMore && (
            <div className="imgUpload__thumbAdd" onClick={() => inputRef.current?.click()} title="Add more">
              <span className="imgUpload__thumbAddIcon">＋</span>
              <span className="imgUpload__thumbAddLabel">Add</span>
            </div>
          )}
        </div>
      )}

      {imageEntries.length === 0 && (
        <div
          className={`imgUpload__dropzone${drag ? ' imgUpload__dropzone--active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <p className="imgUpload__hint">
            <span className="imgUpload__hintLink">Click to upload</span> or drag &amp; drop
          </p>
          <p className="imgUpload__sub">PNG, JPG, WEBP — max 5 MB each · up to {MAX_IMAGES} images</p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={e => { addFiles(e.target.files); e.target.value = '' }}
      />
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

  useEffect(() => {
    if (mode === 'add' && !form.category_id && categoryOptions.length > 0)
      setForm(f => ({ ...f, category_id: categoryOptions[0].id }))
  }, [categoryOptions, mode, form.category_id])

  useEffect(() => {
    return () => imageEntries.forEach(e => { if (e.preview?.startsWith('blob:')) URL.revokeObjectURL(e.preview) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const imageFiles = imageEntries.map(e => e.file).filter(Boolean)
    onSave({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10), imageFiles })
  }

  const isEdit = mode === 'edit'

  return (
    <div className="modal__overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel">
        <div className="modal__header">
          <div className="modal__headerLeft">
            <div className="modal__headerIconWrap">◈</div>
            <div>
              <p className="modal__title">{isEdit ? 'Edit Product' : 'Add New Product'}</p>
              <p className="modal__subtitle">{isEdit ? 'Update the product details below.' : 'Fill in the details to create a new product.'}</p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          <div className="modal__grid">
            <div className="modal__field modal__field--full">
              <label className="modal__label">Product Name <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.name ? ' modal__input--error' : ''}`}
                placeholder="e.g. Wireless Headphones"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
              {errors.name && <span className="modal__fieldError">{errors.name}</span>}
            </div>

            <div className="modal__field">
              <label className="modal__label">Category <span className="modal__required">*</span></label>
              <div className="modal__selectWrapper">
                {categoriesLoading ? (
                  <select className="modal__select modal__input--disabled" disabled><option>Loading categories…</option></select>
                ) : (
                  <select className="modal__select" value={form.category_id} onChange={e => set('category_id', Number(e.target.value))}>
                    {categoryOptions.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                  </select>
                )}
                <span className="modal__selectArrow">▾</span>
              </div>
            </div>

            <div className="modal__field">
              <label className="modal__label">Price (Rupees) <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.price ? ' modal__input--error' : ''}`}
                placeholder="0.00" type="number" min="0" step="0.01"
                value={form.price} onChange={e => set('price', e.target.value)}
              />
              {errors.price && <span className="modal__fieldError">{errors.price}</span>}
            </div>

            <div className="modal__field">
              <label className="modal__label">Stock Qty <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.stock ? ' modal__input--error' : ''}`}
                placeholder="0" type="number" min="0" step="1"
                value={form.stock} onChange={e => set('stock', e.target.value)}
              />
              {errors.stock && <span className="modal__fieldError">{errors.stock}</span>}
            </div>

            {isEdit && (
            <div className="modal__field modal__field--full">
              <label className="modal__label">Status <span className="modal__required">*</span></label>
              <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                {['Active', 'Inactive'].map(opt => {
                  const isActive = opt === 'Active'
                  const isSelected = form.status === opt
                  return (
                    <label
                      key={opt}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        cursor: 'pointer', userSelect: 'none',
                        padding: '8px 16px', borderRadius: '8px',
                        border: `1.5px solid ${isSelected ? (isActive ? '#22c55e' : '#ef4444') : 'var(--border)'}`,
                        background: isSelected ? (isActive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)') : 'var(--surface-2)',
                        transition: 'all 0.15s ease',
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? (isActive ? '#16a34a' : '#dc2626') : 'var(--text-secondary)',
                        fontSize: '0.875rem',
                      }}
                    >
                      <input
                        type="radio"
                        name="product-status"
                        value={opt}
                        checked={isSelected}
                        onChange={() => set('status', opt)}
                        style={{ display: 'none' }}
                      />
                      <span style={{
                        width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                        background: isActive ? '#22c55e' : '#ef4444',
                        boxShadow: isSelected ? `0 0 0 3px ${isActive ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` : 'none',
                        display: 'inline-block',
                      }} />
                      {opt}
                    </label>
                  )
                })}
              </div>
            </div>
            )}

            <ImageUpload imageEntries={imageEntries} onChange={setImageEntries} />
          </div>
        </div>

        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onClose}>Cancel</button>
          <button
            className={`modal__submitBtn${loading ? ' modal__submitBtn--loading' : ''}`}
            onClick={handleSubmit} disabled={loading}
          >
            {loading ? <span className="modal__spinner" /> : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete Modal ────────────────────────────────────── */
function DeleteModal({ product, onClose, onConfirm, loading }) {
  return (
    <div className="modal__overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel" style={{ maxWidth: 420 }}>
        <div className="modal__header">
          <div className="modal__headerLeft">
            <div className="modal__headerIconWrap" style={{ background: 'var(--danger-pale)', borderColor: 'rgba(185,74,72,.18)' }}>
              <span style={{ color: 'var(--danger)' }}>⚠</span>
            </div>
            <div>
              <p className="modal__title">Delete Product</p>
              <p className="modal__subtitle">This action cannot be undone.</p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{product.name}</strong>?
            This will permanently remove the product and all associated data.
          </p>
        </div>
        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onClose}>Cancel</button>
          <button
            className={`modal__submitBtn${loading ? ' modal__submitBtn--loading' : ''}`}
            style={{ background: 'var(--danger)', boxShadow: '0 3px 10px rgba(185,74,72,.28)' }}
            onClick={onConfirm} disabled={loading}
          >
            {loading ? <span className="modal__spinner" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── useCategoryOptions hook ─────────────────────────── */
function useCategoryOptions() {
  const [categoryOptions, setCategoryOptions]     = useState([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    setCategoriesLoading(true)
    fetch('http://localhost:5000/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'displayAllCategories' }),
    })
      .then(res => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json() })
      .then(json => {
        if (cancelled) return
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const active = json.data.filter(c => c.status === 1)
          const list   = (active.length > 0 ? active : json.data).map(c => ({ id: c.id, category_name: c.category_name }))
          setCategoryOptions(list)
        } else {
          setCategoryOptions([])
        }
      })
      .catch(() => { if (!cancelled) setCategoryOptions([]) })
      .finally(() => { if (!cancelled) setCategoriesLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { categoryOptions, categoriesLoading }
}

/* ══ MAIN PAGE ═══════════════════════════════════════════ */
export default function Products() {
  const { products, setProducts, productsLoading } = useProducts()
  const [page, setPage]       = useState(1)
  const [modal, setModal]     = useState(null)
  const [saving, setSaving]   = useState(false)
  const [hovered, setHovered] = useState(false)
  const [user, setUser]       = useState(null)
  const navigate              = useNavigate()
  const { toasts, add: toast, remove: removeToast } = useToasts()
  const { categoryOptions, categoriesLoading }       = useCategoryOptions()

  useState(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  })

  const handleLogout    = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/') }
  const handleMenuClick = (menu) => navigate(menu.path)

  const total    = products.length
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const safePage = Math.min(page, lastPage)
  const slice    = products.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const pages    = buildPages(total, safePage)

  /* modal handlers */
  const openAdd    = () => setModal({ type: 'add' })
  const openEdit   = (p) => setModal({
    type: 'edit',
    product: {
      ...p,
      name:        p.name,
      category_id: categoryOptions.find(c => c.category_name === p.category)?.id ?? '',
      price:       String(p.price),
      stock:       String(p.stock),
      status:      p.status === 1 ? 'Active' : 'Inactive',
      image_url:   p.image_url ?? null,
    }
  })
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

        const cat  = categoryOptions.find(c => c.id === data.category_id)
        setProducts(ps => [{
          id:         json.data.product_id,
          name:       data.name,
          category:   cat?.category_name ?? '',
          price:      data.price,
          stock:      data.stock,
          status:     data.status === 'Active' ? 1 : 2,
          image_url:  data.imageFiles?.length > 0 ? URL.createObjectURL(data.imageFiles[0]) : null,
          updated_at: new Date().toISOString(),
        }, ...ps])
        toast('Product added successfully.', 'success')
        closeModal()
      } catch (err) {
        toast(err.message || 'Something went wrong.', 'error')
      } finally {
        setSaving(false)
      }

    } else {
      try {
        const fd = new FormData()
        fd.append('type',         'updateProduct')
        fd.append('product_id',   modal.product.id)
        fd.append('product_name', data.name)
        fd.append('category_id',  data.category_id)
        fd.append('price',        data.price)
        fd.append('stock',        data.stock)
        fd.append('status',       data.status === 'Active' ? 1 : (data.status ?? 1))
        data.imageFiles?.forEach(file => fd.append('images', file))

        const res  = await fetch('http://localhost:5000/update-product', { method: 'PUT', body: fd })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.message || 'Failed to update product.')

        const updated = json.data
        const cat     = categoryOptions.find(c => c.id === (updated.category_id ?? data.category_id))
        setProducts(ps => ps.map(p =>
          p.id === modal.product.id ? {
            ...p,
            name:       updated.product_name ?? data.name,
            category:   cat?.category_name   ?? p.category,
            price:      parseFloat(updated.price ?? data.price),
            stock:      updated.stock         ?? data.stock,
            status:     updated.status        ?? p.status,
            image_url:  data.imageFiles?.length > 0
              ? URL.createObjectURL(data.imageFiles[0])
              : resolveImageUrl(updated) ?? p.image_url,
            updated_at: updated.updated_at ?? new Date().toISOString(),
          } : p
        ))
        toast('Product updated successfully.', 'success')
        closeModal()
      } catch (err) {
        toast(err.message || 'Something went wrong.', 'error')
      } finally {
        setSaving(false)
      }
    }
  }

  // ── Delete: calls DELETE /delete-product with { product_id } ──
  const handleDelete = async () => {
    setSaving(true)
    try {
      const res  = await fetch('http://localhost:5000/delete-product', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ product_id: modal.product.id }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Failed to delete product.')

      setProducts(ps => ps.filter(p => p.id !== modal.product.id))
      toast('Product deleted successfully.', 'info')
      closeModal()
    } catch (err) {
      toast(err.message || 'Something went wrong.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="dash">
      <div className="dash__bg" />

      <header className="dash__topbar">
        <div className="dash__brand">
          <span className="dash__gem">✦</span>
          <span className="dash__brandName">Aurum</span>
        </div>
        <div className="dash__userPill">
          <span className="dash__userDot" />
          <span className="dash__userName">{user?.username ?? ''}</span>
        </div>
      </header>

      <main className="dash__main">
        <div className="users__topBar">
          <div>
            <h1 className="users__title">Products</h1>
            <p className="users__subtitle">Manage your product catalogue — {total} product{total !== 1 ? 's' : ''} total.</p>
          </div>
          <button className="users__addBtn" onClick={openAdd}>
            <span>＋</span> Add Product
          </button>
        </div>

        <div className="users__card">
          <div className="users__tableWrapper">
            {productsLoading ? <LoadingState /> : products.length === 0 ? <EmptyState /> : (
              <table className="users__table">
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--border)' }}
                            />
                          ) : (
                            <div style={{
                              width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 14, color: 'var(--text-muted)',
                            }}>🖼</div>
                          )}
                          <span className="products__productName">{p.name}</span>
                        </div>
                      </td>
                      <td>{p.category}</td>
                      <td className="products__price">Rs.{parseFloat(p.price).toFixed(2)}</td>
                      <td>
                        <span className={`products__stock${p.stock === 0 ? ' products__stock--out' : p.stock < 50 ? ' products__stock--low' : ''}`}>
                          {p.stock.toLocaleString()}
                        </span>
                      </td>
                      <td><StatusBadge status={p.status} /></td>
                      <td className="products__updatedAt">{formatDate(p.updated_at)}</td>
                      <td>
                        <div className="users__actionBtns" style={{ justifyContent: 'center' }}>
                          <button className="users__editBtn"   title="Edit"   onClick={() => openEdit(p)}>✎</button>
                          <button className="users__deleteBtn" title="Delete" onClick={() => openDelete(p)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {!productsLoading && total > 0 && (
            <div className="users__pagination">
              <div className="users__paginationControls">

                {/* « first */}
                <button className="users__pageBtn" onClick={() => setPage(1)} disabled={safePage === 1}>«</button>
                {/* ‹ prev */}
                <button className="users__pageBtn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1}>‹</button>

                {pages.map((pg, i) =>
                  pg === '…'
                    ? <span key={`e${i}`} className="users__pageEllipsis">…</span>
                    : <button
                        key={pg}
                        className={`users__pageBtn${pg === safePage ? ' active' : ''}`}
                        onClick={() => setPage(pg)}
                      >{pg}</button>
                )}

                {/* › next */}
                <button className="users__pageBtn" onClick={() => setPage(p => Math.min(lastPage, p + 1))} disabled={safePage === lastPage}>›</button>
                {/* » last */}
                <button className="users__pageBtn" onClick={() => setPage(lastPage)} disabled={safePage === lastPage}>»</button>

              </div>
              <div className="users__paginationInfo">
                Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, total)} of {total} product{total !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {modal?.type === 'add' && (
          <ProductModal mode="add" onClose={closeModal} onSave={handleSave} loading={saving}
            categoryOptions={categoryOptions} categoriesLoading={categoriesLoading} />
        )}
        {modal?.type === 'edit' && (
          <ProductModal mode="edit" initial={modal.product} onClose={closeModal} onSave={handleSave} loading={saving}
            categoryOptions={categoryOptions} categoriesLoading={categoriesLoading} />
        )}
        {modal?.type === 'delete' && (
          <DeleteModal product={modal.product} onClose={closeModal} onConfirm={handleDelete} loading={saving} />
        )}

        {/* Toasts — top center */}
        <div style={{
          position: 'fixed', top: '24px', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999, display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: '10px', pointerEvents: 'none',
        }}>
          {toasts.map(t => (
            <div key={t.id} className={`toast toast--${t.type}`}
              style={{ pointerEvents: 'auto', minWidth: 280, maxWidth: 400 }}>
              <span className="toast__icon">{TOAST_ICONS[t.type]}</span>
              <span className="toast__msg">{t.msg}</span>
              <button className="toast__close" onClick={() => removeToast(t.id)}>✕</button>
            </div>
          ))}
        </div>
      </main>

      {/* Right-side hover menu */}
      <div
        className={`dash__menuTrigger${hovered ? ' open' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="dash__pill">
          <span className="dash__pillDots"><span /><span /><span /></span>
        </div>
        <nav className="dash__flyout">
          <div className="dash__flyoutInner">
            {MENUS.map((m, i) => (
              <button
                key={m.key}
                className={`dash__menuItem${m.key === 'products' ? ' active' : ''}`}
                style={{ '--i': i }}
                onClick={() => handleMenuClick(m)}
              >
                <span className="dash__menuIcon">{m.icon}</span>
                <span className="dash__menuLabel">{m.label}</span>
                {m.key === 'products' && <span className="dash__activeDot" />}
              </button>
            ))}
            <div className="dash__menuDivider" />
            <button className="dash__logoutItem" onClick={handleLogout}>
              <span className="dash__menuIcon">↩</span>
              <span className="dash__menuLabel">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
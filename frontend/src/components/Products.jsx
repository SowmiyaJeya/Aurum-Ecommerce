import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Products.css'
import '../styles/Dashboard.css'

const MENUS = [
  { icon: '⬡', label: 'Users',     key: 'users',     path: '/users' },
  { icon: '◎', label: 'Category', key: 'category', path: '/category' },
  { icon: '◈', label: 'Products',  key: 'products',  path: '/products' },
  { icon: '◇', label: 'Settings',  key: 'settings',  path: '/settings' },
]

/* ── helpers ─────────────────────────────────────────── */
const PAGE_SIZE = 5

const CATEGORY_OPTIONS = ['Electronics', 'Apparel', 'Home & Living', 'Beauty', 'Sports', 'Books', 'Food & Beverage', 'Toys']
// const STATUS_OPTIONS    = ['Active', 'Draft', 'Archived']


function buildPages(total, current) {
  const pages = []
  const last  = Math.ceil(total / PAGE_SIZE)
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

/* ── mock initial data ───────────────────────────────── */
const SEED_PRODUCTS = [
  { id: 1,  name: 'Wireless Noise-Cancelling Headphones', sku: 'ELEC-0021', category: 'Electronics',     price: 149.99, stock: 204 },
  { id: 2,  name: 'Slim-Fit Oxford Shirt',                sku: 'APRL-0087', category: 'Apparel',         price: 49.99,  stock: 512  },
  { id: 3,  name: 'Ceramic Pour-Over Coffee Set',         sku: 'HOME-0034', category: 'Home & Living',   price: 64.00,  stock: 87 },
  { id: 4,  name: 'Retinol Night Serum',                  sku: 'BEAU-0019', category: 'Beauty',          price: 38.50,  stock: 340},
  { id: 5,  name: 'Adjustable Dumbbell Set',              sku: 'SPRT-0056', category: 'Sports',          price: 219.00, stock: 45},
  { id: 6,  name: 'The Pragmatic Programmer (2nd Ed.)',   sku: 'BOOK-0003', category: 'Books',           price: 29.99,  stock: 133},
  { id: 7,  name: 'Cold Brew Concentrate 1L',             sku: 'FOOD-0072', category: 'Food & Beverage', price: 12.00,  stock: 620},
  { id: 8,  name: 'STEM Robot Building Kit',              sku: 'TOYS-0011', category: 'Toys',            price: 89.95,  stock: 78},
  { id: 9,  name: 'Bluetooth Mechanical Keyboard',        sku: 'ELEC-0044', category: 'Electronics',     price: 129.00, stock: 156},
  { id: 10, name: 'Linen Jogger Pants',                   sku: 'APRL-0103', category: 'Apparel',         price: 59.99,  stock: 0},
  { id: 11, name: 'Bamboo Cutting Board Set',             sku: 'HOME-0061', category: 'Home & Living',   price: 34.00,  stock: 290 },
  { id: 12, name: 'SPF 50 Tinted Moisturiser',            sku: 'BEAU-0031', category: 'Beauty',          price: 26.00,  stock: 185 },
]

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

/* ── Status badge ────────────────────────────────────── */
// function StatusBadge({ status }) {
//   const cls = {
//     Active:   'badge--active',
//     Draft:    'badge--draft',
//     Archived: 'badge--archived',
//   }[status] || ''
//   return <span className={`products__badge ${cls}`}>{status}</span>
// }

/* ── Modal ───────────────────────────────────────────── */
const EMPTY_FORM = { name: '', sku: '', category: CATEGORY_OPTIONS[0], price: '', stock: '', status: 'Active' }

function ProductModal({ mode, initial, onClose, onSave, loading }) {
  const [form, setForm]     = useState(initial || EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim())                     e.name  = 'Product name is required.'
    if (!form.sku.trim())                      e.sku   = 'SKU is required.'
    if (form.price === '' || isNaN(+form.price) || +form.price < 0) e.price = 'Enter a valid price.'
    if (form.stock === '' || isNaN(+form.stock) || !Number.isInteger(+form.stock) || +form.stock < 0) e.stock = 'Enter a valid stock quantity.'
    return e
  }

  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form, price: parseFloat(form.price), stock: parseInt(form.stock, 10) })
  }

  const isEdit = mode === 'edit'

  return (
    <div className="modal__overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel">
        {/* Header */}
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

        {/* Body */}
        <div className="modal__body">
          <div className="modal__grid">

            {/* Name */}
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

            {/* SKU */}
            <div className="modal__field">
              <label className="modal__label">SKU <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.sku ? ' modal__input--error' : ''}${isEdit ? ' modal__input--disabled' : ''}`}
                placeholder="e.g. ELEC-0021"
                value={form.sku}
                onChange={e => set('sku', e.target.value)}
                disabled={isEdit}
              />
              {errors.sku && <span className="modal__fieldError">{errors.sku}</span>}
            </div>

            {/* Category */}
            <div className="modal__field">
              <label className="modal__label">Category <span className="modal__required">*</span></label>
              <div className="modal__selectWrapper">
                <select className="modal__select" value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORY_OPTIONS.map(c => <option key={c}>{c}</option>)}
                </select>
                <span className="modal__selectArrow">▾</span>
              </div>
            </div>

            {/* Price */}
            <div className="modal__field">
              <label className="modal__label">Price (USD) <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.price ? ' modal__input--error' : ''}`}
                placeholder="0.00"
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
              />
              {errors.price && <span className="modal__fieldError">{errors.price}</span>}
            </div>

            {/* Stock */}
            <div className="modal__field">
              <label className="modal__label">Stock Qty <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.stock ? ' modal__input--error' : ''}`}
                placeholder="0"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={e => set('stock', e.target.value)}
              />
              {errors.stock && <span className="modal__fieldError">{errors.stock}</span>}
            </div>

            {/* Status */}
            {/* <div className="modal__field modal__field--full">
              <label className="modal__label">Status</label>
              <div className="modal__radioGroup">
                {STATUS_OPTIONS.map(s => (
                  <label
                    key={s}
                    className={`modal__radioLabel modal__radioLabel--status-${s.toLowerCase()}`}
                  >
                    <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => set('status', s)} />
                    <span className={`modal__radioDot modal__radioDot--status-${s.toLowerCase()}`} />
                    {s}
                  </label>
                ))}
              </div>
            </div> */}

          </div>
        </div>

        {/* Footer */}
        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onClose}>Cancel</button>
          <button
            className={`modal__submitBtn${loading ? ' modal__submitBtn--loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className="modal__spinner" /> : isEdit ? 'Save Changes' : 'Add Product'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete confirm modal ────────────────────────────── */
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
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="modal__spinner" /> : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ MAIN PAGE ═══════════════════════════════════════════ */
export default function Products() {
  const [products, setProducts] = useState(SEED_PRODUCTS)
  const [page, setPage]         = useState(1)
  const [modal, setModal]       = useState(null)
  const [saving, setSaving]     = useState(false)
  const [hovered, setHovered]   = useState(false)
  const [user, setUser]         = useState(null)
  const navigate                = useNavigate()
  const { toasts, add: toast, remove: removeToast } = useToasts()

  useState(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  })

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleMenuClick = (menu) => {
    navigate(menu.path)
  }

  /* pagination */
  const total   = products.length
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const slice   = products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pages   = buildPages(total, page)

  /* handlers */
  const openAdd    = ()  => setModal({ type: 'add' })
  const openEdit   = (p) => setModal({ type: 'edit',   product: { ...p, price: String(p.price), stock: String(p.stock) } })
  const openDelete = (p) => setModal({ type: 'delete', product: p })
  const closeModal = ()  => setModal(null)

  const handleSave = (data) => {
    setSaving(true)
    setTimeout(() => {
      if (modal.type === 'add') {
        const newP = { ...data, id: Date.now() }
        setProducts(ps => [newP, ...ps])
        toast('Product added successfully.', 'success')
      } else {
        setProducts(ps => ps.map(p => p.id === modal.product.id ? { ...p, ...data } : p))
        toast('Product updated successfully.', 'success')
      }
      setSaving(false)
      closeModal()
    }, 600)
  }

  const handleDelete = () => {
    setSaving(true)
    setTimeout(() => {
      setProducts(ps => ps.filter(p => p.id !== modal.product.id))
      toast('Product deleted.', 'info')
      setSaving(false)
      closeModal()
      if (page > Math.ceil((total - 1) / PAGE_SIZE)) setPage(p => Math.max(1, p - 1))
    }, 500)
  }

  return (
    <div className="dash">
      <div className="dash__bg" />

      {/* Top bar */}
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

      {/* Top bar */}
      <div className="users__topBar">
        <div>
          <h1 className="users__title">Products</h1>
          <p className="users__subtitle">Manage your product catalogue — {total} product{total !== 1 ? 's' : ''} total.</p>
        </div>
        <button className="users__addBtn" onClick={openAdd}>
          <span>＋</span> Add Product
        </button>
      </div>

      {/* Table card */}
      <div className="users__card">
        <div className="users__tableWrapper">
          {products.length === 0 ? <EmptyState /> : (
            <table className="users__table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  {/* <th>Status</th> */}
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {slice.map(p => (
                  <tr key={p.id}>
                    <td>
                      <span className="products__productName">{p.name}</span>
                    </td>
                    <td>
                      <span className="products__sku">{p.sku}</span>
                    </td>
                    <td>{p.category}</td>
                    <td className="products__price">${p.price.toFixed(2)}</td>
                    <td>
                      <span className={`products__stock${p.stock === 0 ? ' products__stock--out' : p.stock < 50 ? ' products__stock--low' : ''}`}>
                        {p.stock.toLocaleString()}
                      </span>
                    </td>
                    {/* <td><StatusBadge status={p.status} /></td> */}
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

        {/* Pagination */}
        {total > PAGE_SIZE && (
          <div className="users__pagination">
            <div className="users__paginationControls">
              <button className="users__pageBtn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
              {pages.map((pg, i) =>
                pg === '…'
                  ? <span key={`e${i}`} className="users__pageEllipsis">…</span>
                  : <button key={pg} className={`users__pageBtn${pg === page ? ' active' : ''}`} onClick={() => setPage(pg)}>{pg}</button>
              )}
              <button className="users__pageBtn" onClick={() => setPage(p => p + 1)} disabled={page === lastPage}>›</button>
            </div>
            <div className="users__paginationInfo">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'add'    && <ProductModal mode="add"  onClose={closeModal} onSave={handleSave}   loading={saving} />}
      {modal?.type === 'edit'   && <ProductModal mode="edit" initial={modal.product} onClose={closeModal} onSave={handleSave} loading={saving} />}
      {modal?.type === 'delete' && <DeleteModal  product={modal.product} onClose={closeModal} onConfirm={handleDelete} loading={saving} />}

      {/* Toasts */}
      <div className="toast__container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast--${t.type}`}>
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
          <span className="dash__pillDots">
            <span /><span /><span />
          </span>
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


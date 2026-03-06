import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'
import '../styles/Category.css'

const MENUS = [
  { icon: '⬡', label: 'Users',    key: 'users',    path: '/users' },
  { icon: '◎', label: 'Category', key: 'category', path: '/category' },
  { icon: '◈', label: 'Products', key: 'products', path: '/products' },
  { icon: '◇', label: 'Settings', key: 'settings', path: '/settings' },
]

/* ── helpers ── */
function buildPages(current, totalPages) {
  const pages = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
    return pages
  }
  pages.push(1)
  if (current > 3) pages.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) pages.push(i)
  if (current < totalPages - 2) pages.push('…')
  pages.push(totalPages)
  return pages
}

/* ── format date ── */
function formatDate(isoString) {
  if (!isoString) return '—'
  const d = new Date(isoString)
  return d.toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    year:   'numeric',
    hour:   '2-digit',
    minute: '2-digit',
  })
}

/* ── Toast ── */
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

/* ── Empty State ── */
function EmptyState() {
  return (
    <div className="products__empty">
      <div className="products__emptyIcon">◉</div>
      <p className="products__emptyTitle">No categories yet</p>
      <p className="products__emptyText">Click <strong>+ Add Category</strong> to create your first category.</p>
    </div>
  )
}

/* ── Category Modal (Add / Edit) ── */
const EMPTY_FORM = { name: '', status: 1 }

function CategoryModal({ mode, initial, onClose, onSave, loading }) {
  const [form, setForm]     = useState(initial || EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Category name is required.'
    return e
  }
  const handleSubmit = () => {
    const e = validate()
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form })
  }

  const isEdit = mode === 'edit'
  const isActive = form.status === 1

  return (
    <div className="modal__overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel" style={{ maxWidth: 480 }}>
        <div className="modal__header">
          <div className="modal__headerLeft">
            <div className="modal__headerIconWrap">◉</div>
            <div>
              <p className="modal__title">{isEdit ? 'Edit Category' : 'Add New Category'}</p>
              <p className="modal__subtitle">{isEdit ? 'Update the category details below.' : 'Enter a name for the new category.'}</p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          <div className="modal__grid">
             <div className="modal__field modal__field--full">
              <label className="modal__label">Category Name <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.name ? ' modal__input--error' : ''}`}
                placeholder="e.g. Electronics"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                autoFocus
              />
              {errors.name && <span className="modal__fieldError">{errors.name}</span>}
            </div>

            {isEdit && (
              <div className="modal__field modal__field--full" style={{ marginTop: 4 }}>
                <label className="modal__label">Status</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
                  {[{ val: 1, label: 'Active' }, { val: 2, label: 'Inactive' }].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => set('status', opt.val)}
                      style={{
                        flex:          1,
                        padding:       '8px 0',
                        borderRadius:  8,
                        fontSize:      '0.88rem',
                        fontWeight:    600,
                        cursor:        'pointer',
                        transition:    'all .18s',
                        border: form.status === opt.val
                          ? (opt.val === 1 ? '1.5px solid #22c55e' : '1.5px solid var(--danger)')
                          : '1.5px solid var(--border)',
                        background: form.status === opt.val
                          ? (opt.val === 1 ? 'rgba(34,197,94,.12)' : 'rgba(185,74,72,.10)')
                          : 'transparent',
                        color: form.status === opt.val
                          ? (opt.val === 1 ? '#16a34a' : 'var(--danger)')
                          : 'var(--text-secondary)',
                      }}
                    >
                      <span style={{
                        display: 'inline-block', width: 7, height: 7,
                        borderRadius: '50%', marginRight: 6, verticalAlign: 'middle',
                        background: form.status === opt.val
                          ? (opt.val === 1 ? '#22c55e' : 'var(--danger)')
                          : 'var(--text-secondary)',
                      }} />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onClose}>Cancel</button>
          <button
            className={`modal__submitBtn${loading ? ' modal__submitBtn--loading' : ''}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? <span className="modal__spinner" /> : isEdit ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete Confirm Modal ── */
function DeleteModal({ category, onClose, onConfirm, loading }) {
  return (
    <div className="modal__overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel" style={{ maxWidth: 420 }}>
        <div className="modal__header">
          <div className="modal__headerLeft">
            <div className="modal__headerIconWrap" style={{ background: 'var(--danger-pale)', borderColor: 'rgba(185,74,72,.18)' }}>
              <span style={{ color: 'var(--danger)' }}>⚠</span>
            </div>
            <div>
              <p className="modal__title">Delete Category</p>
              <p className="modal__subtitle">This action cannot be undone.</p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to delete <strong style={{ color: 'var(--text-primary)' }}>{category.name}</strong>?
            This will permanently remove the category and may affect associated products.
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

/* ══ MAIN PAGE ══ */
export default function Categories() {
  const [categories, setCategories] = useState([])
  const [pagination, setPagination] = useState({ totalRecords: 0, totalPages: 1, currentPage: 1, limit: 5 })
  const [page, setPage]             = useState(1)
  const [refresh, setRefresh]       = useState(0)
  const [modal, setModal]           = useState(null)
  const [saving, setSaving]         = useState(false)
  const [hovered, setHovered]       = useState(false)
  const [user, setUser]             = useState(null)
  const [fetching, setFetching]     = useState(true)
  const navigate                    = useNavigate()
  const { toasts, add: toast, remove: removeToast } = useToasts()

  /* ── load user from localStorage ── */
  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  /* ── fetch categories from API (re-runs whenever page changes) ── */
  useEffect(() => {
    const fetchCategories = async () => {
      setFetching(true)
      try {
        const res = await fetch('http://localhost:5000/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'displayAllCategories', page }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to fetch categories')
        setCategories(
          json.data.map(item => ({
            id:         item.id,
            name:       item.category_name,
            updated_at: item.updated_at,
            status:     item.status,
          }))
        )
        setPagination(json.pagination)
      } catch (err) {
        toast(err.message || 'Failed to load categories.', 'error')
      } finally {
        setFetching(false)
      }
    }
    fetchCategories()
  }, [page, refresh])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleMenuClick = (menu) => navigate(menu.path)

  /* derived from server pagination */
  const { totalRecords, totalPages, limit } = pagination
  const pages = buildPages(page, totalPages)

  /* modal handlers */
  const openAdd    = ()  => setModal({ type: 'add' })
  const openEdit   = (c) => setModal({ type: 'edit', category: { id: c.id, name: c.name, status: c.status } })
  const openDelete = (c) => setModal({ type: 'delete', category: c })
  const closeModal = ()  => setModal(null)

  const handleSave = async (data) => {
  setSaving(true)
  try {
    if (modal.type === 'add') {
      const res = await fetch('http://localhost:5000/add-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_name: data.name }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to add category')

      if (page === 1) setRefresh(r => r + 1)
      else setPage(1)
      toast('Category added successfully.', 'success')
      closeModal() // ✅ only close on success

    } else {
      const res = await fetch('http://localhost:5000/update-category', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:            modal.category.id,
          category_name: data.name,
          status:        data.status,
        }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to update category')

      setCategories(cs =>
        cs.map(c =>
          c.id === modal.category.id
            ? { ...c, name: json.data.category_name, status: json.data.status, updated_at: json.data.updated_at }
            : c
        )
      )
      toast('Category updated successfully.', 'success')
      closeModal() // ✅ only close on success
    }
  } catch (err) {
    toast(err.message || 'Something went wrong.', 'error')
    // ❌ modal stays open so user can correct the input
  } finally {
    setSaving(false) // always stop the spinner
  }
}
  const handleDelete = async () => {
  setSaving(true)
  try {
    const res = await fetch('http://localhost:5000/delete-category', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: modal.category.id }),
    })
    const json = await res.json()
    if (!json.success) throw new Error(json.message || 'Failed to delete category')

    const newTotal = totalRecords - 1
    const maxPage  = Math.max(1, Math.ceil(newTotal / limit))
    const nextPage = Math.min(page, maxPage)
    if (nextPage === page) setRefresh(r => r + 1)
    else setPage(nextPage)

    toast('Category deleted successfully.', 'info')
    closeModal() // ✅ only close on success
  } catch (err) {
    toast(err.message || 'Something went wrong.', 'error')
    // modal stays open on error
  } finally {
    setSaving(false)
  }
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

        {/* Page header */}
        <div className="users__topBar">
          <div>
            <h1 className="users__title">Product Categories</h1>
            <p className="users__subtitle">
              Manage your product categories — {totalRecords} categor{totalRecords !== 1 ? 'ies' : 'y'} total.
            </p>
          </div>
          <button className="users__addBtn" onClick={openAdd}>
            <span>＋</span> Add Category
          </button>
        </div>

        {/* Table card */}
        <div className="users__card">
          <div className="users__tableWrapper">
            {fetching ? (
              <div className="products__empty">
                <div className="products__emptyIcon" style={{ animation: 'spin 1s linear infinite' }}>◌</div>
                <p className="products__emptyText">Loading categories…</p>
              </div>
            ) : categories.length === 0 ? (
              <EmptyState />
            ) : (
              <table className="users__table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Category Name</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c, idx) => (
                    <tr key={c.id}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', width: 48 }}>
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td>
                        <span className="products__productName">{c.name}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display:       'inline-flex',
                          alignItems:    'center',
                          gap:           '5px',
                          padding:       '3px 10px',
                          borderRadius:  '999px',
                          fontSize:      '0.78rem',
                          fontWeight:    600,
                          letterSpacing: '0.02em',
                          background:    c.status === 1 ? 'rgba(34,197,94,.12)'  : 'rgba(185,74,72,.10)',
                          color:         c.status === 1 ? '#16a34a'              : 'var(--danger)',
                          border:        c.status === 1 ? '1px solid rgba(34,197,94,.25)' : '1px solid rgba(185,74,72,.22)',
                        }}>
                          <span style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: c.status === 1 ? '#22c55e' : 'var(--danger)',
                            flexShrink: 0,
                          }} />
                          {c.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                        {formatDate(c.updated_at)}
                      </td>
                      <td>
                        <div className="users__actionBtns" style={{ justifyContent: 'center' }}>
                          <button className="users__editBtn"   title="Edit"   onClick={() => openEdit(c)}>✎</button>
                          <button className="users__deleteBtn" title="Delete" onClick={() => openDelete(c)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Server-driven pagination */}
          {totalPages > 1 && (
            <div className="users__pagination">
              <div className="users__paginationControls">
                <button className="users__pageBtn" onClick={() => setPage(p => p - 1)} disabled={page === 1 || fetching}>‹</button>
                {pages.map((pg, i) =>
                  pg === '…'
                    ? <span key={`e${i}`} className="users__pageEllipsis">…</span>
                    : <button key={pg} className={`users__pageBtn${pg === page ? ' active' : ''}`} onClick={() => setPage(pg)} disabled={fetching}>{pg}</button>
                )}
                <button className="users__pageBtn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || fetching}>›</button>
              </div>
              <div className="users__paginationInfo">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)} of {totalRecords}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {modal?.type === 'add'    && <CategoryModal mode="add"  onClose={closeModal} onSave={handleSave} loading={saving} />}
        {modal?.type === 'edit'   && <CategoryModal mode="edit" initial={modal.category} onClose={closeModal} onSave={handleSave} loading={saving} />}
        {modal?.type === 'delete' && <DeleteModal   category={modal.category} onClose={closeModal} onConfirm={handleDelete} loading={saving} />}

        {/* Toasts */}
        <div className="toast__container" style={{
                position: 'fixed',
                top: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                bottom: 'auto',
                right: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 10,
                zIndex: 9999,
              }}>
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
                className={`dash__menuItem${m.key === 'categories' ? ' active' : ''}`}
                style={{ '--i': i }}
                onClick={() => handleMenuClick(m)}
              >
                <span className="dash__menuIcon">{m.icon}</span>
                <span className="dash__menuLabel">{m.label}</span>
                {m.key === 'categories' && <span className="dash__activeDot" />}
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
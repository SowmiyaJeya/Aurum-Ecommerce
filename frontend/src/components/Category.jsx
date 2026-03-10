import { useState, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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

function formatDate(isoString) {
  if (!isoString) return '—'
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
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

/* ── Category Modal ── */
const EMPTY_FORM = { name: '', status: 1 }

function CategoryModal({ mode, initial, onClose, onSave, loading }) {
  const [form, setForm]     = useState(initial || EMPTY_FORM)
  const [errors, setErrors] = useState({})
  const isEdit = mode === 'edit'

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const handleSubmit = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Category name is required.'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form })
  }

  const inputStyle = (hasError) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    border: `1px solid ${hasError ? '#e05555' : '#e0e0e0'}`,
    background: '#fff', color: '#1a1a1a', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s ease',
  })

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 480, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#edf7f2', border: '1px solid rgba(26,122,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>◉</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>{isEdit ? 'Edit Category' : 'Add New Category'}</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{isEdit ? 'Update the category details below.' : 'Enter a name for the new category.'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
              Category Name <span style={{ color: '#e05555' }}>*</span>
            </label>
            <input
              style={inputStyle(errors.name)}
              placeholder="e.g. Electronics"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              autoFocus
            />
            {errors.name && <span style={{ fontSize: 12, color: '#e05555', marginTop: 4, display: 'block' }}>{errors.name}</span>}
          </div>

          {isEdit && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Status</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {[{ val: 1, label: 'Active' }, { val: 2, label: 'Inactive' }].map(opt => (
                  <button key={opt.val} type="button" onClick={() => set('status', opt.val)}
                    style={{
                      flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 14, fontWeight: 600,
                      cursor: 'pointer', transition: 'all .18s', fontFamily: "'DM Sans', sans-serif",
                      border: form.status === opt.val
                        ? (opt.val === 1 ? '1.5px solid #22c55e' : '1.5px solid #b94a48')
                        : '1.5px solid #e0e0e0',
                      background: form.status === opt.val
                        ? (opt.val === 1 ? 'rgba(34,197,94,.10)' : 'rgba(185,74,72,.08)')
                        : 'transparent',
                      color: form.status === opt.val
                        ? (opt.val === 1 ? '#16a34a' : '#b94a48')
                        : '#999',
                    }}>
                    <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', marginRight: 6, verticalAlign: 'middle', background: form.status === opt.val ? (opt.val === 1 ? '#22c55e' : '#b94a48') : '#ccc' }} />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#1a7a5e', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(26,122,94,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : null}
            {isEdit ? 'Save Changes' : 'Add Category'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete Modal ── */
function DeleteModal({ category, onClose, onConfirm, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf2f2', border: '1px solid rgba(185,74,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#b94a48' }}>⚠</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>Delete Category</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>This action cannot be undone.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', fontSize: 15, color: '#555', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: '#1a1a1a' }}>{category.name}</strong>? This will permanently remove the category and may affect associated products.
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#b94a48', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(185,74,72,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : null}
            Delete
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
  const [user, setUser]             = useState(null)
  const [fetching, setFetching]     = useState(true)
  const navigate                    = useNavigate()
  const { toasts, add: toast, remove: removeToast } = useToasts()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    try { setUser(JSON.parse(stored)) }
    catch { localStorage.removeItem('user'); navigate('/') }
  }, [])

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
        setCategories(json.data.map(item => ({
          id: item.id, name: item.category_name,
          updated_at: item.updated_at, status: item.status,
        })))
        setPagination(json.pagination)
      } catch (err) {
        toast(err.message || 'Failed to load categories.', 'error')
      } finally {
        setFetching(false)
      }
    }
    fetchCategories()
  }, [page, refresh])

  const { totalRecords, totalPages, limit } = pagination
  const pages = buildPages(page, totalPages)

  const openAdd    = () => setModal({ type: 'add' })
  const openEdit   = (c) => setModal({ type: 'edit', category: { id: c.id, name: c.name, status: c.status } })
  const openDelete = (c) => setModal({ type: 'delete', category: c })
  const closeModal = () => setModal(null)

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal.type === 'add') {
        const res = await fetch('http://localhost:5000/add-category', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ category_name: data.name }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to add category')
        if (page === 1) setRefresh(r => r + 1); else setPage(1)
        toast('Category added successfully.', 'success')
        closeModal()
      } else {
        const res = await fetch('http://localhost:5000/update-category', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: modal.category.id, category_name: data.name, status: data.status }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to update category')
        setCategories(cs => cs.map(c => c.id === modal.category.id
          ? { ...c, name: json.data.category_name, status: json.data.status, updated_at: json.data.updated_at }
          : c
        ))
        toast('Category updated successfully.', 'success')
        closeModal()
      }
    } catch (err) {
      toast(err.message || 'Something went wrong.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      const res = await fetch('http://localhost:5000/delete-category', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: modal.category.id }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to delete category')
      const newTotal = totalRecords - 1
      const maxPage  = Math.max(1, Math.ceil(newTotal / limit))
      const nextPage = Math.min(page, maxPage)
      if (nextPage === page) setRefresh(r => r + 1); else setPage(nextPage)
      toast('Category deleted successfully.', 'info')
      closeModal()
    } catch (err) {
      toast(err.message || 'Something went wrong.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes catSpin { to { transform: rotate(360deg); } }

        .cat-wrap { width: 100%; }

        .cat-topbar {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
        }

        .cat-title {
          font-family: 'Syne', sans-serif; font-size: 26px;
          font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px; margin: 0 0 4px;
        }

        .cat-subtitle {
          font-size: 14px; color: #888; margin: 0; font-family: 'DM Sans', sans-serif;
        }

        .cat-addBtn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px; background: #1a7a5e; color: #fff;
          border: none; border-radius: 12px; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 14px rgba(26,122,94,0.3);
          transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .cat-addBtn:hover { background: #1d8a6a; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,122,94,0.35); }

        .cat-card {
          background: #fff; border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .cat-tableWrapper { overflow-x: auto; }

        .cat-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; min-width: 500px;
        }

        .cat-table thead tr {
          background: #f9f8f6; border-bottom: 1px solid rgba(0,0,0,0.07);
        }

        .cat-table th {
          padding: 14px 20px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #aaa; text-align: left; white-space: nowrap;
        }

        .cat-table tbody tr {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: background 0.15s ease;
        }

        .cat-table tbody tr:last-child { border-bottom: none; }
        .cat-table tbody tr:hover { background: #fafaf8; }

        .cat-table td {
          padding: 14px 20px; font-size: 14px; color: #444; vertical-align: middle;
        }

        .cat-name {
          font-weight: 600; color: #1a1a1a; font-size: 14px;
        }

        .cat-actions { display: flex; gap: 8px; justify-content: center; }

        .cat-editBtn, .cat-deleteBtn {
          width: 34px; height: 34px; border-radius: 9px; border: none;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 15px;
          transition: background 0.15s ease, transform 0.12s ease;
        }
        .cat-editBtn { background: #f0f7f4; }
        .cat-editBtn:hover { background: #d6f0e6; transform: scale(1.08); }
        .cat-deleteBtn { background: #fdf2f2; }
        .cat-deleteBtn:hover { background: #fce0e0; transform: scale(1.08); }

        .cat-empty {
          text-align: center; padding: 60px 20px;
          color: #aaa; font-family: 'DM Sans', sans-serif; font-size: 15px;
        }

        .cat-loading {
          text-align: center; padding: 60px 20px;
          color: #aaa; font-family: 'DM Sans', sans-serif; font-size: 15px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }

        .cat-spinner {
          font-size: 28px; color: #1a7a5e;
          animation: catSpin 1s linear infinite; display: inline-block;
        }

        .cat-pagination {
          padding: 18px 20px; border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }

        .cat-paginationControls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }

        .cat-pageBtn {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e0e0e0;
          background: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #555; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s ease;
        }
        .cat-pageBtn:hover:not(:disabled) { background: #f0f7f4; border-color: rgba(26,122,94,0.3); color: #1a7a5e; }
        .cat-pageBtn.active { background: #1a7a5e; color: #fff; border-color: #1a7a5e; font-weight: 700; }
        .cat-pageBtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .cat-pageEllipsis { color: #bbb; font-size: 16px; padding: 0 4px; line-height: 36px; }

        .cat-paginationInfo { font-size: 13px; color: #aaa; font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Toasts */}
      <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '12px 16px', borderRadius: 12, minWidth: 280, maxWidth: 380,
            background: t.type === 'success' ? '#edfaf4' : t.type === 'error' ? '#fdf2f2' : '#f0f4ff',
            border: `1px solid ${t.type === 'success' ? 'rgba(30,126,78,0.2)' : t.type === 'error' ? 'rgba(185,74,72,0.2)' : 'rgba(66,99,235,0.2)'}`,
            color: t.type === 'success' ? '#1e7e4e' : t.type === 'error' ? '#b94a48' : '#4263eb',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
          }}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5 }}>×</button>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal?.type === 'add'    && <CategoryModal mode="add"  onClose={closeModal} onSave={handleSave} loading={saving} />}
      {modal?.type === 'edit'   && <CategoryModal mode="edit" initial={modal.category} onClose={closeModal} onSave={handleSave} loading={saving} />}
      {modal?.type === 'delete' && <DeleteModal   category={modal.category} onClose={closeModal} onConfirm={handleDelete} loading={saving} />}

      <div className="cat-wrap">
        {/* Top bar */}
        <div className="cat-topbar">
          <div>
            <h1 className="cat-title">Product Categories</h1>
            <p className="cat-subtitle">
              Manage your product categories — {totalRecords} categor{totalRecords !== 1 ? 'ies' : 'y'} total.
            </p>
          </div>
          <button className="cat-addBtn" onClick={openAdd}>＋ Add Category</button>
        </div>

        {/* Table card */}
        <div className="cat-card">
          <div className="cat-tableWrapper">
            {fetching ? (
              <div className="cat-loading">
                <span className="cat-spinner">◌</span>
                <span>Loading categories…</span>
              </div>
            ) : categories.length === 0 ? (
              <div className="cat-empty">
                <div style={{ fontSize: 32, marginBottom: 12 }}>◉</div>
                <div style={{ fontWeight: 600, color: '#555', marginBottom: 6 }}>No categories yet</div>
                <div>Click <strong>+ Add Category</strong> to create your first category.</div>
              </div>
            ) : (
              <table className="cat-table">
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
                      <td style={{ color: '#aaa', fontSize: 13, width: 48 }}>{(page - 1) * limit + idx + 1}</td>
                      <td><span className="cat-name">{c.name}</span></td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600,
                          background: c.status === 1 ? 'rgba(34,197,94,.10)' : 'rgba(185,74,72,.08)',
                          color: c.status === 1 ? '#16a34a' : '#b94a48',
                          border: c.status === 1 ? '1px solid rgba(34,197,94,.25)' : '1px solid rgba(185,74,72,.22)',
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: c.status === 1 ? '#22c55e' : '#b94a48', flexShrink: 0 }} />
                          {c.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: '#aaa', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(c.updated_at)}</td>
                      <td>
                        <div className="cat-actions">
                          <button className="cat-editBtn" title="Edit" onClick={() => openEdit(c)}>✎</button>
                          <button className="cat-deleteBtn" title="Delete" onClick={() => openDelete(c)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="cat-pagination">
              <div className="cat-paginationControls">
                <button className="cat-pageBtn" onClick={() => setPage(p => p - 1)} disabled={page === 1 || fetching}>‹</button>
                {pages.map((pg, i) =>
                  pg === '…'
                    ? <span key={`e${i}`} className="cat-pageEllipsis">…</span>
                    : <button key={pg} className={`cat-pageBtn${pg === page ? ' active' : ''}`} onClick={() => setPage(pg)} disabled={fetching}>{pg}</button>
                )}
                <button className="cat-pageBtn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || fetching}>›</button>
              </div>
              <div className="cat-paginationInfo">
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalRecords)} of {totalRecords}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
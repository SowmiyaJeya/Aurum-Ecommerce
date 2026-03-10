import { useState, useCallback, useEffect, useRef } from 'react'
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

/* ── useCategoryOptions ── */
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
      .then(res => { if (!res.ok) throw new Error(); return res.json() })
      .then(json => {
        if (cancelled) return
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const active = json.data.filter(c => c.status === 1)
          setCategoryOptions((active.length > 0 ? active : json.data).map(c => ({ id: c.id, category_name: c.category_name })))
        } else { setCategoryOptions([]) }
      })
      .catch(() => { if (!cancelled) setCategoryOptions([]) })
      .finally(() => { if (!cancelled) setCategoriesLoading(false) })
    return () => { cancelled = true }
  }, [])

  return { categoryOptions, categoriesLoading }
}

/* ── White Category Multi-Selector ── */
function CategoryChips({ categoryOptions, categoriesLoading, selectedIds, onChange, error }) {
  const [query, setQuery]             = useState('')
  const [open, setOpen]               = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef                  = useRef(null)
  const inputRef                      = useRef(null)
  const listRef                       = useRef(null)

  const filtered = query.trim()
    ? categoryOptions.filter(c => c.category_name.toLowerCase().includes(query.toLowerCase()))
    : categoryOptions

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
    setQuery('')
    setHighlighted(-1)
    inputRef.current?.focus()
  }

  const removeTag = (id, e) => {
    e.preventDefault(); e.stopPropagation()
    onChange(selectedIds.filter(x => x !== id))
  }

  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false); setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return }
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted(h => Math.min(h + 1, filtered.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setHighlighted(h => Math.max(h - 1, 0)) }
    if (e.key === 'Enter' && highlighted >= 0 && filtered[highlighted]) { e.preventDefault(); toggle(filtered[highlighted].id) }
    if (e.key === 'Backspace' && !query && selectedIds.length > 0) onChange(selectedIds.slice(0, -1))
  }

  useEffect(() => {
    if (highlighted >= 0 && listRef.current) {
      listRef.current.children[highlighted]?.scrollIntoView({ block: 'nearest' })
    }
  }, [highlighted])

  const selectedItems = categoryOptions.filter(c => selectedIds.includes(c.id))

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>

      {/* ── Selected tags row (always visible above input) ── */}
      {selectedItems.length > 0 && (
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 6,
          marginBottom: 8,
        }}>
          {selectedItems.map(c => (
            <span key={c.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 8px 4px 11px', borderRadius: 999,
              background: '#edf7f2', color: '#1a7a5e',
              border: '1px solid rgba(26,122,94,0.25)',
              fontSize: 12, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
              lineHeight: 1.4,
            }}>
              {c.category_name}
              <button type="button" onMouseDown={e => removeTag(c.id, e)}
                style={{
                  background: 'rgba(26,122,94,0.12)', border: 'none', cursor: 'pointer',
                  width: 16, height: 16, borderRadius: '50%', display: 'inline-flex',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: 9, color: '#1a7a5e', lineHeight: 1, padding: 0, flexShrink: 0,
                }}>✕</button>
            </span>
          ))}
          {selectedItems.length > 1 && (
            <button type="button" onMouseDown={e => { e.preventDefault(); onChange([]); setQuery('') }}
              style={{
                background: 'none', border: '1px dashed #e0e0e0', borderRadius: 999,
                cursor: 'pointer', fontSize: 11, color: '#e05555',
                fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
                padding: '4px 10px', lineHeight: 1.4,
              }}>
              Clear all
            </button>
          )}
        </div>
      )}

      {/* ── Search / trigger input ── */}
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus() }}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '0 10px', borderRadius: 10, cursor: 'text', height: 42,
          border: `1.5px solid ${open ? '#1a7a5e' : error ? '#e05555' : '#e0e0e0'}`,
          background: '#fff',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? '0 0 0 3px rgba(26,122,94,0.07)' : 'none',
        }}
      >
        {/* Search icon */}
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0, color: '#bbb' }}>
          <circle cx="9" cy="9" r="6" stroke="currentColor" strokeWidth="2"/>
          <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); setHighlighted(-1) }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={categoriesLoading ? 'Loading categories…' : 'Search and select categories…'}
          disabled={categoriesLoading}
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 13, fontFamily: "'DM Sans', sans-serif",
            background: 'transparent', color: '#1a1a1a', padding: 0,
          }}
        />

        {/* Chevron */}
        <span style={{
          color: open ? '#1a7a5e' : '#bbb', fontSize: 11,
          transition: 'transform 0.2s, color 0.15s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          flexShrink: 0, lineHeight: 1,
        }}>▾</span>
      </div>

      {/* ── White Dropdown ── */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0, right: 0,
          background: '#fff',
          borderRadius: 12,
          zIndex: 300,
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          border: '1px solid #e8e8e8',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{
            padding: '10px 14px 8px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: '#bbb',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {query ? `Results for "${query}"` : 'All Categories'}
            </span>
            {selectedIds.length > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#1a7a5e',
                background: 'rgba(26,122,94,0.08)', padding: '2px 8px', borderRadius: 999,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {selectedIds.length} selected
              </span>
            )}
          </div>

          {/* List */}
          <div ref={listRef} style={{ maxHeight: 200, overflowY: 'auto' }}>
            {categoriesLoading ? (
              <div style={{ padding: '16px', fontSize: 13, color: '#aaa', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
                Loading…
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '16px', fontSize: 13, color: '#aaa', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}>
                No results for "{query}"
              </div>
            ) : filtered.map((c, i) => {
              const selected = selectedIds.includes(c.id)
              const isHover  = i === highlighted
              return (
                <div key={c.id}
                  onMouseDown={e => { e.preventDefault(); toggle(c.id) }}
                  onMouseEnter={() => setHighlighted(i)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', cursor: 'pointer',
                    background: selected ? '#f0faf6' : isHover ? '#fafafa' : '#fff',
                    borderBottom: '1px solid #f5f5f5',
                    transition: 'background 0.1s',
                  }}
                >
                  {/* Checkbox-style indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 16, height: 16, borderRadius: 5, flexShrink: 0,
                      border: selected ? 'none' : '1.5px solid #d0d0d0',
                      background: selected ? '#1a7a5e' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.15s',
                    }}>
                      {selected && <span style={{ color: '#fff', fontSize: 9, lineHeight: 1, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{
                      fontSize: 13, fontFamily: "'DM Sans', sans-serif",
                      color: selected ? '#1a7a5e' : '#333',
                      fontWeight: selected ? 600 : 400,
                    }}>
                      {c.category_name}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && <span style={{ display: 'block', fontSize: 12, color: '#e05555', marginTop: 6 }}>{error}</span>}
    </div>
  )
}

/* ── Brand Modal (Add / Edit) ── */
function BrandModal({ mode, initial, onClose, onSave, loading, categoryOptions, categoriesLoading }) {
  const isEdit = mode === 'edit'
  const [form, setForm]     = useState(initial || { name: '', category_ids: [], status: 1 })
  const [errors, setErrors] = useState({})

  const set = (k, v) => {
    setForm(f => ({ ...f, [k]: v }))
    setErrors(e => ({ ...e, [k]: undefined }))
  }

  const handleSubmit = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Brand name is required.'
    // Only validate category for add mode
    if (!isEdit && (!form.category_ids || form.category_ids.length === 0))
      e.category_ids = 'Please select at least one category.'
    if (Object.keys(e).length) { setErrors(e); return }
    onSave({ ...form })
  }

  const inp = (hasError) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    border: `1px solid ${hasError ? '#e05555' : '#e0e0e0'}`,
    background: '#fff', color: '#1a1a1a', outline: 'none',
    boxSizing: 'border-box', transition: 'border-color 0.15s ease',
  })
  const lbl = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }
  const errStyle = { fontSize: 12, color: '#e05555', marginTop: 4, display: 'block' }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 500, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#edf7f2', border: '1px solid rgba(26,122,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏷️</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>{isEdit ? 'Edit Brand' : 'Add New Brand'}</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{isEdit ? 'Update the brand details below.' : 'Enter details for the new brand.'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18, overflowY: 'auto', flex: 1 }}>

          {/* Brand Name */}
          <div>
            <label style={lbl}>Brand Name <span style={{ color: '#e05555' }}>*</span></label>
            <input style={inp(errors.name)} placeholder="e.g. Samsung" value={form.name}
              onChange={e => set('name', e.target.value)} autoFocus />
            {errors.name && <span style={errStyle}>{errors.name}</span>}
          </div>

          {/* Category — only shown in Add mode */}
          {!isEdit && (
            <div>
              <label style={lbl}>
                Category <span style={{ color: '#e05555' }}>*</span>
                {form.category_ids?.length > 0 && (
                  <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 500, color: '#1a7a5e', background: 'rgba(26,122,94,0.08)', padding: '2px 8px', borderRadius: 999 }}>
                    {form.category_ids.length} selected
                  </span>
                )}
              </label>
              <CategoryChips
                categoryOptions={categoryOptions}
                categoriesLoading={categoriesLoading}
                selectedIds={form.category_ids || []}
                onChange={v => set('category_ids', v)}
                error={errors.category_ids}
              />
            </div>
          )}

          {/* Status — edit only */}
          {isEdit && (
            <div>
              <label style={lbl}>Status</label>
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
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#1a7a5e', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(26,122,94,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            {isEdit ? 'Save Changes' : 'Add Brand'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Delete Modal ── */
function DeleteModal({ brand, onClose, onConfirm, loading }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf2f2', border: '1px solid rgba(185,74,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, color: '#b94a48' }}>⚠</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>Delete Brand</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>This action cannot be undone.</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', fontSize: 15, color: '#555', lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: '#1a1a1a' }}>{brand.name}</strong>? This will permanently remove the brand and may affect associated products.
        </div>
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#b94a48', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, opacity: loading ? 0.7 : 1, boxShadow: '0 3px 10px rgba(185,74,72,0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {loading && <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />}
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

/* ══ MAIN PAGE ══ */
export default function Brands() {
  const [brands, setBrands]         = useState([])
  const [total, setTotal]           = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage]             = useState(1)
  const [fetching, setFetching]     = useState(true)
  const [modal, setModal]           = useState(null)
  const [saving, setSaving]         = useState(false)
  const [user, setUser]             = useState(null)
  const [refresh, setRefresh]       = useState(0)
  const navigate                    = useNavigate()
  const { toasts, add: toast, remove: removeToast } = useToasts()
  const { categoryOptions, categoriesLoading }       = useCategoryOptions()

  const LIMIT = 5

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (!stored) { navigate('/'); return }
    try { setUser(JSON.parse(stored)) }
    catch { localStorage.removeItem('user'); navigate('/') }
  }, [])

  useEffect(() => {
    const fetchBrands = async () => {
      setFetching(true)
      try {
        const res  = await fetch('http://localhost:5000/brands', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'displayAllBrands', page, limit: LIMIT }),
        })
        const json = await res.json()
        if (!json.success) throw new Error(json.message || 'Failed to fetch brands')
        setBrands(json.data.map(b => ({
          id:            b.brand_id,
          name:          b.brand_name,
          category_id:   b.category_id,
          category_name: b.category_name,
          status:        b.status,
          updated_at:    b.updated_at,
        })))
        setTotal(json.total)
        setTotalPages(Math.max(1, Math.ceil(json.total / LIMIT)))
      } catch (err) {
        toast(err.message || 'Failed to load brands.', 'error')
      } finally {
        setFetching(false)
      }
    }
    fetchBrands()
  }, [page, refresh])

  const pages = buildPages(page, totalPages)

  const openAdd    = () => setModal({ type: 'add' })
  const openEdit   = (b) => {
    setModal({ type: 'edit', brand: { id: b.id, name: b.name, category_ids: [], status: b.status } })
  }
  const openDelete = (b) => setModal({ type: 'delete', brand: { id: b.id, name: b.name, category_id: b.category_id } })
  const closeModal = () => setModal(null)

  const handleSave = async (data) => {
    setSaving(true)
    try {
      if (modal.type === 'add') {
        const res  = await fetch('http://localhost:5000/addBrand', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_name:   data.name,
            category_ids: data.category_ids,
            category_id:  data.category_ids[0],
          }),
        })
        const json = await res.json()
        if (!json.success) {
          const msg = json.message || ''
          if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('exist')) {
            toast(`Brand "${data.name}" already exists.`, 'error')
          } else {
            toast(msg || 'Failed to add brand.', 'error')
          }
          return
        }
        if (page === 1) setRefresh(r => r + 1); else setPage(1)
        toast('Brand added successfully.', 'success')
        closeModal()
      } else {
        const res  = await fetch('http://localhost:5000/updateBrand', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            brand_id:   modal.brand.id,
            brand_name: data.name,
            status:     data.status,
          }),
        })
        const json = await res.json()
        if (!json.success) {
          const msg = json.message || ''
          if (msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('duplicate') || msg.toLowerCase().includes('exist')) {
            toast(`Brand "${data.name}" already exists.`, 'error')
          } else {
            toast(msg || 'Failed to update brand.', 'error')
          }
          return
        }
        setBrands(bs => bs.map(b => b.id === modal.brand.id
          ? { ...b, name: json.data?.brand_name ?? data.name, status: json.data?.status ?? data.status, updated_at: json.data?.updated_at ?? new Date().toISOString() }
          : b
        ))
        const prevBrand     = brands.find(b => b.id === modal.brand.id)
        const nameChanged   = prevBrand?.name !== (json.data?.brand_name ?? data.name)
        const statusChanged = prevBrand?.status !== (json.data?.status ?? data.status)
        const newStatus     = json.data?.status ?? data.status

        let friendlyMsg = ''
        if (json.message && json.message.toLowerCase().includes('inactive')) {
          friendlyMsg = `"${json.data?.brand_name}" has been updated and set to Inactive.`
        } else if (json.message && json.message.toLowerCase().includes('active')) {
          friendlyMsg = `"${json.data?.brand_name}" has been updated and set to Active.`
        } else if (nameChanged && statusChanged) {
          friendlyMsg = `Brand renamed to "${json.data?.brand_name}" and marked ${newStatus === 1 ? 'Active' : 'Inactive'}.`
        } else if (nameChanged) {
          friendlyMsg = `Brand renamed to "${json.data?.brand_name}" successfully.`
        } else if (statusChanged) {
          friendlyMsg = `"${json.data?.brand_name}" marked as ${newStatus === 1 ? 'Active ✓' : 'Inactive'}.`
        } else {
          friendlyMsg = `"${json.data?.brand_name}" updated successfully.`
        }
        toast(friendlyMsg, newStatus === 2 && statusChanged ? 'info' : 'success')
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
      const res  = await fetch('http://localhost:5000/deleteBrand', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand_id: modal.brand.id, category_id: modal.brand.category_id }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.message || 'Failed to delete brand')
      const newTotal = total - 1
      const maxPage  = Math.max(1, Math.ceil(newTotal / LIMIT))
      const nextPage = Math.min(page, maxPage)
      if (nextPage === page) setRefresh(r => r + 1); else setPage(nextPage)
      toast(json.message || 'Brand deleted successfully.', 'info')
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
        @keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
        @keyframes toastIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        .brand-wrap { width: 100%; }

        .brand-topbar {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
        }

        .brand-title {
          font-family: 'Syne', sans-serif; font-size: 26px;
          font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px; margin: 0 0 4px;
        }

        .brand-subtitle {
          font-size: 14px; color: #888; margin: 0; font-family: 'DM Sans', sans-serif;
        }

        .brand-addBtn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px; background: #1a7a5e; color: #fff;
          border: none; border-radius: 12px; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 14px rgba(26,122,94,0.3);
          transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .brand-addBtn:hover { background: #1d8a6a; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,122,94,0.35); }

        .brand-card {
          background: #fff; border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .brand-tableWrapper { overflow-x: auto; }

        .brand-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; min-width: 560px;
        }

        .brand-table thead tr {
          background: #f9f8f6; border-bottom: 1px solid rgba(0,0,0,0.07);
        }

        .brand-table th {
          padding: 14px 20px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #aaa; text-align: left; white-space: nowrap;
        }

        .brand-table tbody tr {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: background 0.15s ease;
        }

        .brand-table tbody tr:last-child { border-bottom: none; }
        .brand-table tbody tr:hover { background: #fafaf8; }

        .brand-table td {
          padding: 14px 20px; font-size: 14px; color: #444; vertical-align: middle;
        }

        .brand-name { font-weight: 600; color: #1a1a1a; font-size: 14px; }

        .brand-actions { display: flex; gap: 8px; justify-content: center; }

        .brand-editBtn, .brand-deleteBtn {
          width: 34px; height: 34px; border-radius: 9px; border: none;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 15px;
          transition: background 0.15s ease, transform 0.12s ease;
        }
        .brand-editBtn   { background: #f0f7f4; }
        .brand-editBtn:hover   { background: #d6f0e6; transform: scale(1.08); }
        .brand-deleteBtn { background: #fdf2f2; }
        .brand-deleteBtn:hover { background: #fce0e0; transform: scale(1.08); }

        .brand-empty, .brand-loading {
          text-align: center; padding: 60px 20px;
          color: #aaa; font-family: 'DM Sans', sans-serif; font-size: 15px;
          display: flex; flex-direction: column; align-items: center; gap: 12px;
        }

        .brand-pagination {
          padding: 18px 20px; border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }

        .brand-paginationControls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }

        .brand-pageBtn {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e0e0e0;
          background: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #555; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s ease;
        }
        .brand-pageBtn:hover:not(:disabled) { background: #f0f7f4; border-color: rgba(26,122,94,0.3); color: #1a7a5e; }
        .brand-pageBtn.active { background: #1a7a5e; color: #fff; border-color: #1a7a5e; font-weight: 700; }
        .brand-pageBtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .brand-pageEllipsis { color: #bbb; font-size: 16px; padding: 0 4px; line-height: 36px; }
        .brand-paginationInfo { font-size: 13px; color: #aaa; font-family: 'DM Sans', sans-serif; }

        /* ── Toast — fixed top center ── */
        .brand-toasts {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          pointer-events: none;
        }

        .brand-toast {
          pointer-events: auto;
          display: flex; align-items: center; gap: 10px;
          padding: 12px 20px; border-radius: 12px;
          min-width: 260px; max-width: 420px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.13);
          font-family: 'DM Sans', sans-serif; font-size: 14px;
          animation: toastIn 0.28s cubic-bezier(0.16,1,0.3,1) forwards;
          white-space: nowrap;
        }

        .brand-toast--success { background: #edfaf4; border: 1px solid rgba(30,126,78,0.2); color: #1e7e4e; }
        .brand-toast--error   { background: #fdf2f2; border: 1px solid rgba(185,74,72,0.2);  color: #b94a48; }
        .brand-toast--info    { background: #f0f4ff; border: 1px solid rgba(66,99,235,0.2);  color: #4263eb; }

        .brand-toast__close {
          background: none; border: none; cursor: pointer;
          font-size: 15px; opacity: 0.45; line-height: 1;
          transition: opacity 0.15s; padding: 0; margin-left: auto;
        }
        .brand-toast__close:hover { opacity: 0.8; }


      `}</style>

      {/* ── Top-center Toasts ── */}
      <div className="brand-toasts">
        {toasts.map(t => (
          <div key={t.id} className={`brand-toast brand-toast--${t.type}`}>
            <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
            <span style={{ flex: 1 }}>{t.msg}</span>
            <button className="brand-toast__close" onClick={() => removeToast(t.id)}>×</button>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal?.type === 'add'    && <BrandModal mode="add" onClose={closeModal} onSave={handleSave} loading={saving} categoryOptions={categoryOptions} categoriesLoading={categoriesLoading} />}
      {modal?.type === 'edit'   && <BrandModal mode="edit" initial={modal.brand} onClose={closeModal} onSave={handleSave} loading={saving} categoryOptions={categoryOptions} categoriesLoading={categoriesLoading} />}
      {modal?.type === 'delete' && <DeleteModal brand={modal.brand} onClose={closeModal} onConfirm={handleDelete} loading={saving} />}

      <div className="brand-wrap">
        <div className="brand-topbar">
          <div>
            <h1 className="brand-title">Brands</h1>
            <p className="brand-subtitle">Manage your brands — {total} brand{total !== 1 ? 's' : ''} total.</p>
          </div>
          <button className="brand-addBtn" onClick={openAdd}>＋ Add Brand</button>
        </div>

        <div className="brand-card">
          <div className="brand-tableWrapper">
            {fetching ? (
              <div className="brand-loading">
                <span style={{ fontSize: 28, animation: 'spin 1s linear infinite', display: 'inline-block' }}>🏷️</span>
                <span>Loading brands…</span>
              </div>
            ) : brands.length === 0 ? (
              <div className="brand-empty">
                <div style={{ fontSize: 36 }}>🏷️</div>
                <div style={{ fontWeight: 600, color: '#555' }}>No brands yet</div>
                <div>Click <strong>+ Add Brand</strong> to create your first brand.</div>
              </div>
            ) : (
              <table className="brand-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Brand Name</th>
                    <th>Category</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                    <th>Last Updated</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {brands.map((b, idx) => (
                    <tr key={b.id}>
                      <td style={{ color: '#aaa', fontSize: 13, width: 48 }}>{(page - 1) * LIMIT + idx + 1}</td>
                      <td><span className="brand-name">{b.name}</span></td>
                      <td>
                        <span style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: '#f0f7f4', color: '#2a6b50', border: '1px solid rgba(42,107,80,0.2)' }}>
                          {b.category_name}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: b.status === 1 ? 'rgba(34,197,94,.10)' : 'rgba(185,74,72,.08)', color: b.status === 1 ? '#16a34a' : '#b94a48', border: b.status === 1 ? '1px solid rgba(34,197,94,.25)' : '1px solid rgba(185,74,72,.22)' }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.status === 1 ? '#22c55e' : '#b94a48', flexShrink: 0 }} />
                          {b.status === 1 ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ color: '#aaa', fontSize: 13, whiteSpace: 'nowrap' }}>{formatDate(b.updated_at)}</td>
                      <td>
                        <div className="brand-actions">
                          <button className="brand-editBtn" title="Edit"   onClick={() => openEdit(b)}>✎</button>
                          <button className="brand-deleteBtn" title="Delete" onClick={() => openDelete(b)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="brand-pagination">
              <div className="brand-paginationControls">
                <button className="brand-pageBtn" onClick={() => setPage(p => p - 1)} disabled={page === 1 || fetching}>‹</button>
                {pages.map((pg, i) =>
                  pg === '…'
                    ? <span key={`e${i}`} className="brand-pageEllipsis">…</span>
                    : <button key={pg} className={`brand-pageBtn${pg === page ? ' active' : ''}`} onClick={() => setPage(pg)} disabled={fetching}>{pg}</button>
                )}
                <button className="brand-pageBtn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages || fetching}>›</button>
              </div>
              <div className="brand-paginationInfo">
                Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
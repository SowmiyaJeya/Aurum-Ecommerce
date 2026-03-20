import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const RECORDS_PER_PAGE = 5

// ── Status helpers ─────────────────────────────────────
const STATUS_MAP = {
  1: 'active', 2: 'inactive',
  active: 'active', inactive: 'inactive',
  Active: 'active', Inactive: 'inactive',
}
function normalizeStatus(raw) {
  return STATUS_MAP[raw] ?? 'active'
}

// ── Toast ──────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toasts.map((t) => (
        <div key={t.id} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12, minWidth: 280, maxWidth: 380,
          background: t.type === 'success' ? '#edfaf4' : t.type === 'error' ? '#fdf2f2' : '#f0f4ff',
          border: `1px solid ${t.type === 'success' ? 'rgba(30,126,78,0.2)' : t.type === 'error' ? 'rgba(185,74,72,0.2)' : 'rgba(66,99,235,0.2)'}`,
          color: t.type === 'success' ? '#1e7e4e' : t.type === 'error' ? '#b94a48' : '#4263eb',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)', fontFamily: "'DM Sans', sans-serif", fontSize: 14,
        }}>
          <span style={{ fontSize: 16 }}>{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <span style={{ flex: 1 }}>{t.message}</span>
          <button onClick={() => removeToast(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, opacity: 0.5, lineHeight: 1 }}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Confirm Dialog ─────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={onCancel}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 0, width: 420, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fdf2f2', border: '1px solid rgba(185,74,72,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🗑️</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>Delete User</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>This action cannot be undone</div>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ padding: '20px 24px', fontSize: 15, color: '#555', lineHeight: 1.6 }}>{message}</div>
        <div style={{ padding: '16px 24px 24px', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button onClick={onCancel} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={onConfirm} style={{ padding: '10px 22px', borderRadius: 10, border: 'none', background: '#b94a48', color: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, boxShadow: '0 3px 10px rgba(185,74,72,0.25)' }}>Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── User Modal ─────────────────────────────────────────
function UserModal({ mode, userData, onClose, onSubmit }) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState({
    usercode: userData?.usercode ?? userData?.id ?? userData?.user_id ?? null,
    fullname: userData?.fullname || '',
    username: userData?.username || '',
    password: '',
    mobile: userData?.mobile || '',
    email: userData?.email || '',
    role: userData?.role || 'User',
    status: normalizeStatus(userData?.status) || 'active',
  })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.fullname.trim()) e.fullname = 'Full name is required'
    if (!form.username.trim()) e.username = 'Username is required'
    if (!isEdit && !form.password.trim()) e.password = 'Password is required'
    if (!form.email.trim()) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (form.mobile && !/^\d{10}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit number'
    return e
  }

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }))
  }

  const handleSubmit = async () => {
    const e = validate()
    if (Object.keys(e).length > 0) { setErrors(e); return }
    setSubmitting(true)
    await onSubmit(form)
    setSubmitting(false)
  }

  const inputStyle = (hasError, disabled) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    border: `1px solid ${hasError ? '#e05555' : '#e0e0e0'}`,
    background: disabled ? '#f7f7f7' : '#fff',
    color: disabled ? '#aaa' : '#1a1a1a',
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.15s ease',
  })

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 600, color: '#444', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }
  const errorStyle = { fontSize: 12, color: '#e05555', marginTop: 4, display: 'block' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '22px 24px 16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', border: '1px solid rgba(185, 28, 28, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{isEdit ? '✏️' : '✦'}</div>
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 17, color: '#1a1a1a' }}>{isEdit ? 'Edit User' : 'Add New User'}</div>
              <div style={{ fontSize: 13, color: '#999', marginTop: 2 }}>{isEdit ? 'Update the user details below' : 'Fill in the details to create a new user'}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#aaa', lineHeight: 1, padding: 4 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
            <div>
              <label style={labelStyle}>Full Name <span style={{ color: '#e05555' }}>*</span></label>
              <input style={inputStyle(errors.fullname)} type="text" placeholder="e.g. John Doe" value={form.fullname} onChange={e => handleChange('fullname', e.target.value)} autoComplete="off" />
              {errors.fullname && <span style={errorStyle}>{errors.fullname}</span>}
            </div>
            <div>
              <label style={labelStyle}>Username <span style={{ color: '#e05555' }}>*</span></label>
              <input style={inputStyle(errors.username, isEdit)} type="text" placeholder="e.g. johndoe" value={form.username} onChange={e => handleChange('username', e.target.value)} disabled={isEdit} autoComplete="off" />
              {errors.username && <span style={errorStyle}>{errors.username}</span>}
            </div>
            <div>
              <label style={labelStyle}>Password {!isEdit && <span style={{ color: '#e05555' }}>*</span>}{isEdit && <span style={{ fontSize: 12, color: '#aaa', fontWeight: 400 }}> (leave blank to keep)</span>}</label>
              <input style={inputStyle(errors.password)} type="password" placeholder={isEdit ? '••••••••' : 'Enter password'} value={form.password} onChange={e => handleChange('password', e.target.value)} autoComplete="new-password" />
              {errors.password && <span style={errorStyle}>{errors.password}</span>}
            </div>
            <div>
              <label style={labelStyle}>Phone Number</label>
              <input style={inputStyle(errors.mobile)} type="text" placeholder="e.g. 9876543210" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} autoComplete="off" />
              {errors.mobile && <span style={errorStyle}>{errors.mobile}</span>}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Email <span style={{ color: '#e05555' }}>*</span></label>
              <input style={inputStyle(errors.email)} type="email" placeholder="e.g. john@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} autoComplete="off" />
              {errors.email && <span style={errorStyle}>{errors.email}</span>}
            </div>
            <div>
              <label style={labelStyle}>User Role</label>
              <div style={{ position: 'relative' }}>
                <select style={{ ...inputStyle(false), appearance: 'none', cursor: 'pointer', paddingRight: 36 }} value={form.role} onChange={e => handleChange('role', e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  <option value="Operator">Operator</option>
                </select>
                <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#888', fontSize: 13 }}>▾</span>
              </div>
            </div>
            {isEdit && (
              <div>
                <label style={labelStyle}>Status</label>
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {['active', 'inactive'].map(s => (
                    <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px', borderRadius: 10, border: `1px solid ${form.status === s ? (s === 'active' ? 'rgba(30,126,78,0.3)' : 'rgba(185,74,72,0.3)') : '#e0e0e0'}`, background: form.status === s ? (s === 'active' ? '#edfaf4' : '#fdf2f2') : '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500, color: form.status === s ? (s === 'active' ? '#1e7e4e' : '#b94a48') : '#888', transition: 'all 0.15s ease' }}>
                      <input type="radio" name="status" value={s} checked={form.status === s} onChange={() => handleChange('status', s)} style={{ display: 'none' }} />
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: s === 'active' ? '#1e7e4e' : '#b94a48', opacity: form.status === s ? 1 : 0.3 }} />
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px 22px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '10px 22px', borderRadius: 10, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, color: '#555' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={submitting} style={{ padding: '10px 24px', borderRadius: 10, border: 'none', background: '#b91c1c', color: '#fff', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, opacity: submitting ? 0.7 : 1, boxShadow: '0 3px 10px rgba(185, 28, 28, 0.25)', display: 'flex', alignItems: 'center', gap: 8 }}>
            {submitting ? <span style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> : null}
            {isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Avatar ─────────────────────────────────────────────
function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: '50%', background: `hsl(${hue},30%,88%)`, color: `hsl(${hue},35%,32%)`, fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.03em', flexShrink: 0, border: '1.5px solid rgba(0,0,0,0.06)' }}>
      {initials}
    </span>
  )
}

// ── Role Badge ─────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    Admin:    { bg: '#e8f1f7', color: '#2d5f82', border: 'rgba(45,95,130,0.2)' },
    Operator: { bg: '#f3eef9', color: '#6b3fa0', border: 'rgba(107,63,160,0.2)' },
    User:     { bg: '#f0f7f4', color: '#2a6b50', border: 'rgba(42,107,80,0.2)' },
  }
  const s = map[role] || map.User
  return (
    <span style={{ display: 'inline-block', padding: '0.28rem 0.75rem', borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '0.88rem', fontWeight: 600 }}>
      {role}
    </span>
  )
}

// ── Status Badge ───────────────────────────────────────
function StatusBadge({ status }) {
  const isActive = normalizeStatus(status) === 'active'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.38rem', padding: '0.28rem 0.75rem', borderRadius: 999, background: isActive ? '#edfaf4' : '#fdf2f2', color: isActive ? '#1e7e4e' : '#b94a48', border: `1px solid ${isActive ? 'rgba(30,126,78,0.22)' : 'rgba(185,74,72,0.22)'}`, fontSize: '0.88rem', fontWeight: 600 }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#1e7e4e' : '#b94a48', flexShrink: 0 }} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── Main ───────────────────────────────────────────────
export default function Users() {
  const [user, setUser]               = useState(null)
  const [users, setUsers]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [currentPage, setCurrentPage] = useState(() => parseInt(sessionStorage.getItem('usersPage') || '1', 10))
  const [totalUsers, setTotalUsers]   = useState(0)
  const [modal, setModal]             = useState(null)
  const [toasts, setToasts]           = useState([])
  const [confirmDelete, setConfirmDelete] = useState(null)
  const navigate = useNavigate()

  const totalPages = Math.ceil(totalUsers / RECORDS_PER_PAGE)

  const addToast = (message, type = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }
  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    else navigate('/')
  }, [navigate])

  useEffect(() => { sessionStorage.setItem('usersPage', currentPage) }, [currentPage])

  const parseResponse = async (res) => {
    try { return await res.json() }
    catch { throw new Error('Unexpected server error. Please try again.') }
  }

  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true); setError(null)
      const res = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'getAllUsers', page, limit: RECORDS_PER_PAGE })
      })
      const data = await parseResponse(res)
      if (data.success) { setUsers(data.users); setTotalUsers(data.total) }
      else throw new Error(data.message || 'Failed to load users')
    } catch (err) { setError(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers(currentPage) }, [currentPage]) // eslint-disable-line

  const goToPage = (page) => { if (page >= 1 && page <= totalPages) setCurrentPage(page) }

  const handleAddSubmit = async (form) => {
    try {
      const res = await fetch('http://localhost:5000/add-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname: form.fullname, username: form.username, password: form.password, email: form.email, mobile: form.mobile, role: form.role, maker_id: user.usercode })
      })
      const data = await parseResponse(res)
      if (data.success) { setModal(null); addToast(`User "${form.username}" created successfully!`, 'success'); fetchUsers(currentPage) }
      else addToast(data.message || 'Failed to create user', 'error')
    } catch (err) { addToast(err.message, 'error') }
  }

  const handleEditSubmit = async (form) => {
    try {
      if (!form.usercode) { addToast('Unable to identify user — usercode missing.', 'error'); return }
      const statusNumeric = form.status === 'active' ? 1 : 2
      const payload = { usercode: form.usercode, fullname: form.fullname, username: form.username, email: form.email, mobile: form.mobile, role: form.role, status: statusNumeric, password: form.password || '' }
      const res = await fetch('http://localhost:5000/update-user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await parseResponse(res)
      if (data.success) { setModal(null); addToast(data.message || `User "${form.username}" updated successfully!`, 'success'); fetchUsers(currentPage) }
      else addToast(data.message || 'Failed to update user', 'error')
    } catch (err) { addToast(err.message, 'error') }
  }

  const handleDeleteClick = (userItem) => setConfirmDelete({ usercode: userItem.usercode, username: userItem.username })

  const handleDeleteConfirm = async () => {
    const { usercode, username } = confirmDelete; setConfirmDelete(null)
    try {
      const res = await fetch('http://localhost:5000/delete-user', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ usercode }) })
      const data = await parseResponse(res)
      if (data.success) {
        addToast(data.message || `User "${username}" deleted successfully.`, 'success')
        const newTotalPages = Math.ceil((totalUsers - 1) / RECORDS_PER_PAGE)
        const targetPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage
        if (targetPage !== currentPage) setCurrentPage(targetPage); else fetchUsers(currentPage)
      } else addToast(data.message || 'Failed to delete user', 'error')
    } catch (err) { addToast(err.message, 'error') }
  }

  const formatDate = (d) => {
    if (!d) return '—'
    return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(d))
  }

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []; const left = Math.max(2, currentPage - 1); const right = Math.min(totalPages - 1, currentPage + 1)
    pages.push(1); if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...'); pages.push(totalPages)
    return pages
  }

  if (!user) return null

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        .users-wrap { width: 100%; }

        .users-topbar {
          display: flex; align-items: flex-start;
          justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap;
        }

        .users-title {
          font-family: 'Syne', sans-serif; font-size: 26px;
          font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px; margin: 0 0 4px;
        }

        .users-subtitle {
          font-size: 14px; color: #888; margin: 0; font-family: 'DM Sans', sans-serif;
        }

        .users-addBtn {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 22px; background: #1a7a5e; color: #fff;
          border: none; border-radius: 12px; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
          box-shadow: 0 4px 14px rgba(26,122,94,0.3);
          transition: background 0.18s ease, transform 0.15s ease, box-shadow 0.18s ease;
          white-space: nowrap; flex-shrink: 0;
        }
        .users-addBtn:hover { background: #1d8a6a; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(26,122,94,0.35); }

        .users-card {
          background: #fff; border-radius: 18px;
          border: 1px solid rgba(0,0,0,0.07);
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
          overflow: hidden;
        }

        .users-tableWrapper { overflow-x: auto; }

        .users-table {
          width: 100%; border-collapse: collapse;
          font-family: 'DM Sans', sans-serif; min-width: 800px;
        }

        .users-table thead tr {
          background: #f9f8f6; border-bottom: 1px solid rgba(0,0,0,0.07);
        }

        .users-table th {
          padding: 14px 20px; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: #aaa; text-align: left; white-space: nowrap;
        }

        .users-table tbody tr {
          border-bottom: 1px solid rgba(0,0,0,0.05);
          transition: background 0.15s ease;
        }

        .users-table tbody tr:last-child { border-bottom: none; }
        .users-table tbody tr:hover { background: #fafaf8; }

        .users-table td {
          padding: 14px 20px; font-size: 14px;
          color: #444; vertical-align: middle;
        }

        .users-actions { display: flex; gap: 8px; }

        .users-editBtn, .users-deleteBtn {
          width: 34px; height: 34px; border-radius: 9px; border: none;
          cursor: pointer; display: flex; align-items: center;
          justify-content: center; font-size: 15px;
          transition: background 0.15s ease, transform 0.12s ease;
        }
        .users-editBtn { background: #f0f7f4; }
        .users-editBtn:hover { background: #d6f0e6; transform: scale(1.08); }
        .users-deleteBtn { background: #fdf2f2; }
        .users-deleteBtn:hover { background: #fce0e0; transform: scale(1.08); }

        .users-loading, .users-empty {
          text-align: center; padding: 60px 20px;
          color: #aaa; font-family: 'DM Sans', sans-serif; font-size: 15px;
        }

        .users-error {
          text-align: center; padding: 60px 20px;
          color: #b94a48; font-family: 'DM Sans', sans-serif; font-size: 15px;
        }
        .users-error button {
          margin-top: 12px; padding: 8px 20px; border-radius: 8px;
          border: 1px solid rgba(185,74,72,0.3); background: #fdf2f2;
          color: #b94a48; cursor: pointer; font-size: 14px;
        }

        .users-pagination {
          padding: 18px 20px; border-top: 1px solid rgba(0,0,0,0.06);
          display: flex; flex-direction: column; align-items: center; gap: 10px;
        }

        .users-paginationControls { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; justify-content: center; }

        .users-pageBtn {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid #e0e0e0;
          background: #fff; cursor: pointer; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #555; display: flex; align-items: center;
          justify-content: center; transition: all 0.15s ease;
        }
        .users-pageBtn:hover:not(:disabled) { background: #f0f7f4; border-color: rgba(26,122,94,0.3); color: #1a7a5e; }
        .users-pageBtn.active { background: #b91c1c; color: #fff; border-color: #b91c1c; font-weight: 700; }
        .users-pageBtn:disabled { opacity: 0.35; cursor: not-allowed; }

        .users-pageEllipsis { color: #bbb; font-size: 16px; padding: 0 4px; line-height: 36px; }

        .users-paginationInfo { font-size: 13px; color: #aaa; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <Toast toasts={toasts} removeToast={removeToast} />

      {confirmDelete && (
        <ConfirmDialog
          message={`Are you sure you want to permanently delete "${confirmDelete.username}"? This action cannot be undone.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {modal && (
        <UserModal
          mode={modal.mode}
          userData={modal.userData}
          onClose={() => setModal(null)}
          onSubmit={modal.mode === 'add' ? handleAddSubmit : handleEditSubmit}
        />
      )}

      <div className="users-wrap">
        {/* Top bar */}
        <div className="users-topbar">
          <div>
            <h1 className="users-title">User Management</h1>
            <p className="users-subtitle">View and manage all registered users in the system</p>
          </div>
          <button className="users-addBtn" onClick={() => setModal({ mode: 'add' })}>
            ＋ Add New User
          </button>
        </div>

        {/* Table card */}
        <div className="users-card">
          {loading ? (
            <div className="users-loading">Loading users…</div>
          ) : error ? (
            <div className="users-error">
              <p>Error loading users: {error}</p>
              <button onClick={() => fetchUsers(currentPage)}>Try Again</button>
            </div>
          ) : (
            <>
              <div className="users-tableWrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Phone</th>
                      <th>Last Updated</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? users.map((u) => (
                      <tr key={u.username}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Avatar name={u.fullname || u.username} />
                            <span style={{ fontWeight: 500, color: '#1a1a1a', fontSize: 14 }}>{u.fullname || '—'}</span>
                          </div>
                        </td>
                        <td>{u.username}</td>
                        <td style={{ color: '#888', fontFamily: 'monospace', fontSize: 13 }}>{u.email}</td>
                        <td><RoleBadge role={u.role || 'User'} /></td>
                        <td><StatusBadge status={u.status} /></td>
                        <td style={{ color: '#aaa' }}>{u.mobile || '—'}</td>
                        <td>
                          {u.maker_name && (
                            <div style={{ fontWeight: 500, color: '#555', fontSize: 13 }}>Updated by: {u.maker_name}</div>
                          )}
                          <div style={{ color: '#aaa', fontSize: 12 }}>{formatDate(u.updated_at)}</div>
                        </td>
                        <td>
                          <div className="users-actions">
                            <button className="users-editBtn" onClick={() => setModal({ mode: 'edit', userData: u })} title="Edit user">✏️</button>
                            <button className="users-deleteBtn" onClick={() => handleDeleteClick(u)} title="Delete user">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className="users-empty">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="users-pagination">
                  <div className="users-paginationControls">
                    <button className="users-pageBtn" onClick={() => goToPage(1)} disabled={currentPage === 1}>«</button>
                    <button className="users-pageBtn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                    {getPageNumbers().map((page, idx) =>
                      page === '...'
                        ? <span key={`e-${idx}`} className="users-pageEllipsis">…</span>
                        : <button key={page} className={`users-pageBtn${currentPage === page ? ' active' : ''}`} onClick={() => goToPage(page)}>{page}</button>
                    )}
                    <button className="users-pageBtn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                    <button className="users-pageBtn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                  </div>
                  <div className="users-paginationInfo">
                    Showing {(currentPage - 1) * RECORDS_PER_PAGE + 1}–{Math.min(currentPage * RECORDS_PER_PAGE, totalUsers)} of {totalUsers} users
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'
import '../styles/Users.css'

const RECORDS_PER_PAGE = 5

// ── Status helpers ────────────────────────────────────
const STATUS_MAP = {
  1: 'active',
  2: 'inactive',
  active: 'active',
  inactive: 'inactive',
  Active: 'active',
  Inactive: 'inactive',
}
function normalizeStatus(raw) {
  return STATUS_MAP[raw] ?? 'active'
}

// ── Toast ─────────────────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="toast__container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">{t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}</span>
          <span className="toast__msg">{t.message}</span>
          <button className="toast__close" onClick={() => removeToast(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Confirm Dialog ────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal__overlay" onClick={onCancel}>
      <div className="modal__panel" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__headerLeft">
            <div className="modal__headerIconWrap" style={{ background: 'var(--danger-pale)', borderColor: 'rgba(185,74,72,0.2)' }}>🗑️</div>
            <div>
              <h2 className="modal__title">Delete User</h2>
              <p className="modal__subtitle">This action cannot be undone</p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onCancel}>✕</button>
        </div>
        <div className="modal__body" style={{ padding: '1.3rem 1.5rem' }}>
          <p style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</p>
        </div>
        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onCancel}>Cancel</button>
          <button className="modal__submitBtn" style={{ background: 'var(--danger)', boxShadow: '0 3px 10px rgba(185,74,72,0.25)' }} onClick={onConfirm}>Yes, Delete</button>
        </div>
      </div>
    </div>
  )
}

// ── User Modal ────────────────────────────────────────
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

  return (
    <div className="modal__overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__panel">
        <div className="modal__header">
          <div className="modal__headerLeft">
            <div className="modal__headerIconWrap">{isEdit ? '✏️' : '✦'}</div>
            <div>
              <h2 className="modal__title">{isEdit ? 'Edit User' : 'Add New User'}</h2>
              <p className="modal__subtitle">{isEdit ? 'Update the user details below' : 'Fill in the details to create a new user'}</p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onClose}>✕</button>
        </div>
        <div className="modal__body">
          <div className="modal__grid">
            <div className="modal__field">
              <label className="modal__label">Full Name <span className="modal__required">*</span></label>
              <input className={`modal__input${errors.fullname ? ' modal__input--error' : ''}`} type="text" placeholder="e.g. John Doe" value={form.fullname} onChange={e => handleChange('fullname', e.target.value)} autoComplete="off" data-lpignore="true" data-form-type="other" />
              {errors.fullname && <span className="modal__fieldError">{errors.fullname}</span>}
            </div>
            <div className="modal__field">
              <label className="modal__label">Username <span className="modal__required">*</span></label>
              <input className={`modal__input${errors.username ? ' modal__input--error' : ''}${isEdit ? ' modal__input--disabled' : ''}`} type="text" placeholder="e.g. johndoe" value={form.username} onChange={e => handleChange('username', e.target.value)} disabled={isEdit} autoComplete="off" data-lpignore="true" data-form-type="other" />
              {errors.username && <span className="modal__fieldError">{errors.username}</span>}
            </div>
            <div className="modal__field">
              <label className="modal__label">Password {!isEdit && <span className="modal__required">*</span>}{isEdit && <span className="modal__optional"> (leave blank to keep current)</span>}</label>
              <input className={`modal__input${errors.password ? ' modal__input--error' : ''}`} type="password" placeholder={isEdit ? '••••••••' : 'Enter password'} value={form.password} onChange={e => handleChange('password', e.target.value)} autoComplete="new-password" data-lpignore="true" data-form-type="other" />
              {errors.password && <span className="modal__fieldError">{errors.password}</span>}
            </div>
            <div className="modal__field">
              <label className="modal__label">Phone Number</label>
              <input className={`modal__input${errors.mobile ? ' modal__input--error' : ''}`} type="text" placeholder="e.g. 9876543210" value={form.mobile} onChange={e => handleChange('mobile', e.target.value)} autoComplete="off" data-lpignore="true" data-form-type="other" />
              {errors.mobile && <span className="modal__fieldError">{errors.mobile}</span>}
            </div>
            <div className="modal__field modal__field--full">
              <label className="modal__label">Email <span className="modal__required">*</span></label>
              <input className={`modal__input${errors.email ? ' modal__input--error' : ''}`} type="email" placeholder="e.g. john@example.com" value={form.email} onChange={e => handleChange('email', e.target.value)} autoComplete="off" data-lpignore="true" data-form-type="other" />
              {errors.email && <span className="modal__fieldError">{errors.email}</span>}
            </div>
            <div className="modal__field">
              <label className="modal__label">User Role</label>
              <div className="modal__selectWrapper">
                <select className="modal__select" value={form.role} onChange={e => handleChange('role', e.target.value)}>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  <option value="Operator">Operator</option>
                </select>
                <span className="modal__selectArrow">▾</span>
              </div>
            </div>
            {isEdit && (
              <div className="modal__field">
                <label className="modal__label">Status</label>
                <div className="modal__radioGroup">
                  <label className={`modal__radioLabel${form.status === 'active' ? ' modal__radioLabel--active' : ''}`}>
                    <input type="radio" name="status" value="active" checked={form.status === 'active'} onChange={() => handleChange('status', 'active')} />
                    <span className="modal__radioDot modal__radioDot--active" />Active
                  </label>
                  <label className={`modal__radioLabel${form.status === 'inactive' ? ' modal__radioLabel--inactive' : ''}`}>
                    <input type="radio" name="status" value="inactive" checked={form.status === 'inactive'} onChange={() => handleChange('status', 'inactive')} />
                    <span className="modal__radioDot modal__radioDot--inactive" />Inactive
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onClose}>Cancel</button>
          <button className={`modal__submitBtn${submitting ? ' modal__submitBtn--loading' : ''}`} onClick={handleSubmit} disabled={submitting}>
            {submitting ? <span className="modal__spinner" /> : isEdit ? 'Save Changes' : 'Create User'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Avatar ────────────────────────────────────────────
function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  const hue = (name || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 38, height: 38, borderRadius: '50%',
      background: `hsl(${hue}, 30%, 88%)`, color: `hsl(${hue}, 35%, 32%)`,
      fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.03em',
      flexShrink: 0, border: '1.5px solid rgba(0,0,0,0.06)',
    }}>{initials}</span>
  )
}

// ── Role Badge ────────────────────────────────────────
function RoleBadge({ role }) {
  const map = {
    Admin:    { bg: '#e8f1f7', color: '#2d5f82', border: 'rgba(45,95,130,0.2)' },
    Operator: { bg: '#f3eef9', color: '#6b3fa0', border: 'rgba(107,63,160,0.2)' },
    User:     { bg: '#f0f7f4', color: '#2a6b50', border: 'rgba(42,107,80,0.2)' },
  }
  const s = map[role] || map.User
  return (
    <span style={{ display: 'inline-block', padding: '0.28rem 0.75rem', borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.03em' }}>
      {role}
    </span>
  )
}

// ── Status Badge ──────────────────────────────────────
function StatusBadge({ status }) {
  const isActive = normalizeStatus(status) === 'active'
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.38rem',
      padding: '0.28rem 0.75rem', borderRadius: 999,
      background: isActive ? '#edfaf4' : '#fdf2f2',
      color: isActive ? '#1e7e4e' : '#b94a48',
      border: `1px solid ${isActive ? 'rgba(30,126,78,0.22)' : 'rgba(185,74,72,0.22)'}`,
      fontSize: '0.88rem', fontWeight: 600, letterSpacing: '0.03em',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: isActive ? '#1e7e4e' : '#b94a48', flexShrink: 0 }} />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  )
}

// ── Main ──────────────────────────────────────────────
export default function Users() {
  const [user, setUser] = useState(null)
  const [hovered, setHovered] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('usersPage')
    return saved ? parseInt(saved, 10) : 1
  })
  const [totalUsers, setTotalUsers] = useState(0)
  const [modal, setModal] = useState(null)
  const [toasts, setToasts] = useState([])
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

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user')
    sessionStorage.removeItem('usersPage'); navigate('/')
  }

  const handleAddSubmit = async (form) => {
    try {
      const res = await fetch('http://localhost:5000/add-user', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullname: form.fullname, username: form.username, password: form.password, email: form.email, mobile: form.mobile, role: form.role,maker_id: user.usercode })
      })
      const data = await parseResponse(res)
      if (data.success) { setModal(null); addToast(`User "${form.username}" created successfully!`, 'success'); fetchUsers(currentPage) }
      else addToast(data.message || 'Failed to create user', 'error')
    } catch (err) { addToast(err.message, 'error') }
  }

  // const handleEditSubmit = async (form) => {
  //   try {
  //     if (!form.usercode) { addToast('Unable to identify user — usercode missing.', 'error'); return }
  //     const statusNumeric = form.status === 'active' ? 1 : 2
  //     const payload = { usercode: form.usercode, fullname: form.fullname, username: form.username, email: form.email, mobile: form.mobile, role: form.role, status: statusNumeric, password: form.password || '' }
  //     const res = await fetch('http://localhost:5000/update-user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  //     const data = await parseResponse(res)
  //     if (data.success) {
  //       setUsers(prev => prev.map(u => u.username === form.username ? { ...u, ...form, status: statusNumeric, updated_at: new Date().toISOString() } : u))
  //       setModal(null); addToast(data.message || `User "${form.username}" updated successfully!`, 'success')
  //     } else addToast(data.message || 'Failed to update user', 'error')
  //   } catch (err) { addToast(err.message, 'error') }
  // }

  const handleEditSubmit = async (form) => {
    try {
      if (!form.usercode) { addToast('Unable to identify user — usercode missing.', 'error'); return }
      const statusNumeric = form.status === 'active' ? 1 : 2
      const payload = { usercode: form.usercode, fullname: form.fullname, username: form.username, email: form.email, mobile: form.mobile, role: form.role, status: statusNumeric, password: form.password || '' }
      const res = await fetch('http://localhost:5000/update-user', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const data = await parseResponse(res)
      if (data.success) {
        setModal(null)
        addToast(data.message || `User "${form.username}" updated successfully!`, 'success')
        fetchUsers(currentPage)   // ← add this, remove the setUsers optimistic update
      } else addToast(data.message || 'Failed to update user', 'error')
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

  if (!user) return null

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []; const left = Math.max(2, currentPage - 1); const right = Math.min(totalPages - 1, currentPage + 1)
    pages.push(1); if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...'); pages.push(totalPages)
    return pages
  }

  return (
    <div className="dash">
      <div className="dash__bg" />
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

      <header className="dash__topbar">
        <div className="dash__brand">
          <span className="dash__gem">✦</span>
          <span className="dash__brandName">Aurum</span>
        </div>
        <div className="dash__userPill">
          <span className="dash__userDot" />
          <span className="dash__userName">{user.username}</span>
        </div>
      </header>

      <main className="dash__main">

        {/* ── TOP BAR: title + button ── */}
        <div className="users__topBar">
          <div>
            <h1 className="users__title">User Management</h1>
            <p className="users__subtitle">View and manage all registered users in the system</p>
          </div>
          <button className="users__addBtn" onClick={() => setModal({ mode: 'add' })}>
            <span>＋</span> Add New User
          </button>
        </div>

        {/* ── TABLE CARD ── */}
        <div className="users__card">
          {loading ? (
            <div className="users__loading">Loading users…</div>
          ) : error ? (
            <div className="users__error">
              <p>Error loading users: {error}</p>
              <button onClick={() => fetchUsers(currentPage)}>Try Again</button>
            </div>
          ) : (
            <>
              <div className="users__tableWrapper">
                <table className="users__table">
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
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '1rem' }}>{u.fullname || '—'}</span>
                          </div>
                        </td>
                        <td style={{ fontSize: '1rem' }}>{u.username}</td>
                        <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.93rem' }}>{u.email}</td>
                        <td><RoleBadge role={u.role || 'User'} /></td>
                        <td><StatusBadge status={u.status} /></td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.97rem' }}>{u.mobile || '—'}</td>
                        <td style={{ fontSize: '0.95rem' }}>
                          {u.maker_name && (
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)', fontSize: '0.93rem' }}>
                             Updated by:  {u.maker_name}
                            </div>
                          )}
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                            {formatDate(u.updated_at)}
                          </div>
                        </td>
                        <td>
                          <div className="users__actionBtns">
                            <button className="users__editBtn" onClick={() => setModal({ mode: 'edit', userData: u })} title="Edit user">✏️</button>
                            <button className="users__deleteBtn" onClick={() => handleDeleteClick(u)} title="Delete user">🗑️</button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className="users__empty">No users found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── PAGINATION: centered controls, info below ── */}
              {totalPages > 1 && (
                <div className="users__pagination">
                  <div className="users__paginationControls">
                    <button className="users__pageBtn" onClick={() => goToPage(1)} disabled={currentPage === 1}>«</button>
                    <button className="users__pageBtn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                    {getPageNumbers().map((page, idx) =>
                      page === '...'
                        ? <span key={`e-${idx}`} className="users__pageEllipsis">…</span>
                        : <button key={page} className={`users__pageBtn${currentPage === page ? ' active' : ''}`} onClick={() => goToPage(page)}>{page}</button>
                    )}
                    <button className="users__pageBtn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                    <button className="users__pageBtn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>»</button>
                  </div>
                  <div className="users__paginationInfo">
                    Showing {(currentPage - 1) * RECORDS_PER_PAGE + 1}–{Math.min(currentPage * RECORDS_PER_PAGE, totalUsers)} of {totalUsers} users
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

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
            <button className="dash__menuItem active" onClick={() => navigate('/users')}>
              <span className="dash__menuIcon">⬡</span><span className="dash__menuLabel">Users</span><span className="dash__activeDot" />
            </button>
            <button className="dash__menuItem" onClick={() => navigate('/category')}>
              <span className="dash__menuIcon">◎</span><span className="dash__menuLabel">Category</span>
            </button>
            <button className="dash__menuItem" onClick={() => navigate('/products')}>
              <span className="dash__menuIcon">◈</span><span className="dash__menuLabel">Products</span>
            </button>
            <button className="dash__menuItem" onClick={() => navigate('/settings')}>
              <span className="dash__menuIcon">◇</span><span className="dash__menuLabel">Settings</span>
            </button>
            <div className="dash__menuDivider" />
            <button className="dash__logoutItem" onClick={handleLogout}>
              <span className="dash__menuIcon">↩</span><span className="dash__menuLabel">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </div>
  )
}
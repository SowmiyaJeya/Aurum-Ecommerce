import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'
import '../styles/Users.css'

const RECORDS_PER_PAGE = 5

// ── Toast Component ──────────────────────────────────
function Toast({ toasts, removeToast }) {
  return (
    <div className="toast__container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.type}`}>
          <span className="toast__icon">
            {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
          </span>
          <span className="toast__msg">{t.message}</span>
          <button className="toast__close" onClick={() => removeToast(t.id)}>×</button>
        </div>
      ))}
    </div>
  )
}

// ── Confirm Dialog Component ─────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal__overlay" onClick={onCancel}>
      <div
        className="modal__panel"
        style={{ maxWidth: '420px' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="modal__header">
          <div className="modal__headerLeft">
            <div className="modal__headerIconWrap">🗑️</div>
            <div>
              <h2 className="modal__title">Delete User</h2>
              <p className="modal__subtitle">This action cannot be undone</p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onCancel}>✕</button>
        </div>
        <div className="modal__body" style={{ padding: '20px 24px' }}>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-secondary, #aaa)' }}>
            {message}
          </p>
        </div>
        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onCancel}>Cancel</button>
          <button
            className="modal__submitBtn"
            style={{ background: '#e05c5c' }}
            onClick={onConfirm}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Modal Component ──────────────────────────────────
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
    status: userData?.status || 'active',
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
            <div className="modal__headerIconWrap">
              {isEdit ? '✏️' : '✦'}
            </div>
            <div>
              <h2 className="modal__title">{isEdit ? 'Edit User' : 'Add New User'}</h2>
              <p className="modal__subtitle">
                {isEdit ? 'Update the user details below' : 'Fill in the details to create a new user'}
              </p>
            </div>
          </div>
          <button className="modal__closeBtn" onClick={onClose}>✕</button>
        </div>

        <div className="modal__body">
          <div className="modal__grid" autoComplete="off">

            <div className="modal__field">
              <label className="modal__label">Full Name <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.fullname ? ' modal__input--error' : ''}`}
                type="text"
                placeholder="e.g. John Doe"
                value={form.fullname}
                onChange={e => handleChange('fullname', e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
              />
              {errors.fullname && <span className="modal__fieldError">{errors.fullname}</span>}
            </div>

            <div className="modal__field">
              <label className="modal__label">Username <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.username ? ' modal__input--error' : ''}${isEdit ? ' modal__input--disabled' : ''}`}
                type="text"
                placeholder="e.g. johndoe"
                value={form.username}
                onChange={e => handleChange('username', e.target.value)}
                disabled={isEdit}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
              />
              {errors.username && <span className="modal__fieldError">{errors.username}</span>}
            </div>

            <div className="modal__field">
              <label className="modal__label">
                Password {!isEdit && <span className="modal__required">*</span>}
                {isEdit && <span className="modal__optional"> (leave blank to keep current)</span>}
              </label>
              <input
                className={`modal__input${errors.password ? ' modal__input--error' : ''}`}
                type="password"
                placeholder={isEdit ? '••••••••' : 'Enter password'}
                value={form.password}
                onChange={e => handleChange('password', e.target.value)}
                autoComplete="new-password"
                data-lpignore="true"
                data-form-type="other"
              />
              {errors.password && <span className="modal__fieldError">{errors.password}</span>}
            </div>

            <div className="modal__field">
              <label className="modal__label">Phone Number</label>
              <input
                className={`modal__input${errors.mobile ? ' modal__input--error' : ''}`}
                type="text"
                placeholder="e.g. 9876543210"
                value={form.mobile}
                onChange={e => handleChange('mobile', e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
              />
              {errors.mobile && <span className="modal__fieldError">{errors.mobile}</span>}
            </div>

            <div className="modal__field modal__field--full">
              <label className="modal__label">Email <span className="modal__required">*</span></label>
              <input
                className={`modal__input${errors.email ? ' modal__input--error' : ''}`}
                type="email"
                placeholder="e.g. john@example.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                autoComplete="off"
                data-lpignore="true"
                data-form-type="other"
              />
              {errors.email && <span className="modal__fieldError">{errors.email}</span>}
            </div>

            <div className="modal__field">
              <label className="modal__label">User Role</label>
              <div className="modal__selectWrapper">
                <select
                  className="modal__select"
                  value={form.role}
                  onChange={e => handleChange('role', e.target.value)}
                >
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
                    <input
                      type="radio"
                      name="status"
                      value="active"
                      checked={form.status === 'active'}
                      onChange={() => handleChange('status', 'active')}
                    />
                    <span className="modal__radioDot modal__radioDot--active" />
                    Active
                  </label>
                  <label className={`modal__radioLabel${form.status === 'inactive' ? ' modal__radioLabel--inactive' : ''}`}>
                    <input
                      type="radio"
                      name="status"
                      value="inactive"
                      checked={form.status === 'inactive'}
                      onChange={() => handleChange('status', 'inactive')}
                    />
                    <span className="modal__radioDot modal__radioDot--inactive" />
                    Inactive
                  </label>
                </div>
              </div>
            )}

          </div>
        </div>

        <div className="modal__footer">
          <button className="modal__cancelBtn" onClick={onClose}>Cancel</button>
          <button
            className={`modal__submitBtn${submitting ? ' modal__submitBtn--loading' : ''}`}
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting
              ? <span className="modal__spinner" />
              : isEdit ? 'Save Changes' : 'Create User'
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────
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
  const [confirmDelete, setConfirmDelete] = useState(null) // { usercode, username }
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

  useEffect(() => {
    sessionStorage.setItem('usersPage', currentPage)
  }, [currentPage])

  const parseResponse = async (response) => {
    try {
      return await response.json()
    } catch {
      throw new Error('Unexpected server error. Please try again.')
    }
  }

  // ── Fetch Users ───────────────────────────────────
  const fetchUsers = async (page = 1) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('http://localhost:5000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'getAllUsers', page, limit: RECORDS_PER_PAGE })
      })
      const data = await parseResponse(response)
      if (data.success) {
        setUsers(data.users)
        setTotalUsers(data.total)
      } else {
        throw new Error(data.message || 'Failed to load users')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage)
  }, [currentPage]) // eslint-disable-line react-hooks/exhaustive-deps

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('usersPage')
    navigate('/')
  }

  // ── Add User ──────────────────────────────────────
  const handleAddSubmit = async (form) => {
    try {
      const response = await fetch('http://localhost:5000/add-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullname: form.fullname,
          username: form.username,
          password: form.password,
          email: form.email,
          mobile: form.mobile,
          role: form.role,
        })
      })
      const data = await parseResponse(response)
      if (data.success) {
        setModal(null)
        addToast(`User "${form.username}" created successfully!`, 'success')
        fetchUsers(currentPage)
      } else {
        addToast(data.message || 'Failed to create user', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // ── Edit User ─────────────────────────────────────
  const handleEditSubmit = async (form) => {
    try {
      const usercode = form.usercode
      if (!usercode) {
        addToast('Unable to identify user — usercode missing. Please refresh and try again.', 'error')
        return
      }

      const payload = {
        usercode,
        fullname: form.fullname,
        username: form.username,
        email: form.email,
        mobile: form.mobile,
        role: form.role,
        status: form.status.charAt(0).toUpperCase() + form.status.slice(1).toLowerCase(),
        password: form.password || '',
      }

      const response = await fetch('http://localhost:5000/update-user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await parseResponse(response)
      if (data.success) {
        setUsers(prev => prev.map(u =>
          u.username === form.username
            ? { ...u, ...form, status: payload.status, updated_at: new Date().toISOString() }
            : u
        ))
        setModal(null)
        addToast(data.message || `User "${form.username}" updated successfully!`, 'success')
      } else {
        addToast(data.message || 'Failed to update user', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  // ── Delete — step 1: show confirm dialog ─────────
  const handleDeleteClick = (userItem) => {
    setConfirmDelete({ usercode: userItem.usercode, username: userItem.username })
  }
  // ── Delete — step 2: confirmed, call API ──────────
  const handleDeleteConfirm = async () => {
    const { usercode, username } = confirmDelete
    setConfirmDelete(null)

    try {
      const response = await fetch('http://localhost:5000/delete-user', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usercode })
      })
      const data = await parseResponse(response)
      if (data.success) {
        addToast(data.message || `User "${username}" deleted successfully.`, 'success')
        // Recalculate target page after deletion
        const newTotal = totalUsers - 1
        const newTotalPages = Math.ceil(newTotal / RECORDS_PER_PAGE)
        const targetPage = currentPage > newTotalPages ? Math.max(1, newTotalPages) : currentPage
        if (targetPage !== currentPage) {
          setCurrentPage(targetPage) // triggers useEffect → fetchUsers
        } else {
          fetchUsers(currentPage)    // same page, re-fetch
        }
      } else {
        addToast(data.message || 'Failed to delete user', 'error')
      }
    } catch (err) {
      addToast(err.message, 'error')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString))
  }

  if (!user) return null

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    const left = Math.max(2, currentPage - 1)
    const right = Math.min(totalPages - 1, currentPage + 1)
    pages.push(1)
    if (left > 2) pages.push('...')
    for (let i = left; i <= right; i++) pages.push(i)
    if (right < totalPages - 1) pages.push('...')
    pages.push(totalPages)
    return pages
  }

  return (
    <div className="dash">
      <div className="dash__bg" />

      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Confirm Delete Dialog */}
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
        <div className="users__container">
          <div className="users__header">
            <div className="users__titleSection">
              <h1 className="users__title">List of Users</h1>
              <p className="users__subtitle">View all registered users in the system</p>
            </div>
            <div className="users__actions">
              <button className="users__addBtn" onClick={() => setModal({ mode: 'add' })}>
                <span>➕</span> Add New User
              </button>
            </div>
          </div>

          {loading ? (
            <div className="users__loading">Loading users...</div>
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
                      <th>FULL NAME</th>
                      <th>USERNAME</th>
                      <th>EMAIL</th>
                      <th>PHONE NUMBER</th>
                      <th>LAST UPDATED</th>
                      <th>ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length > 0 ? (
                      users.map((userItem) => (
                        <tr key={userItem.username}>
                          <td>{userItem.fullname || '—'}</td>
                          <td>{userItem.username}</td>
                          <td>{userItem.email}</td>
                          <td>{userItem.mobile || '—'}</td>
                          <td>{formatDate(userItem.updated_at)}</td>
                          <td>
                            <div className="users__actionBtns">
                              <button
                                className="users__editBtn"
                                onClick={() => setModal({ mode: 'edit', userData: userItem })}
                                title="Edit user"
                              >✏️</button>
                              <button
                                className="users__deleteBtn"
                                onClick={() => handleDeleteClick(userItem)}
                                title="Delete user"
                              >🗑️</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="users__empty">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="users__pagination">
                  <span className="users__paginationInfo">
                    Showing {(currentPage - 1) * RECORDS_PER_PAGE + 1}–{Math.min(currentPage * RECORDS_PER_PAGE, totalUsers)} of {totalUsers} users
                  </span>
                  <div className="users__paginationControls">
                    <button className="users__pageBtn" onClick={() => goToPage(1)} disabled={currentPage === 1}>«</button>
                    <button className="users__pageBtn" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>‹</button>
                    {getPageNumbers().map((page, idx) =>
                      page === '...'
                        ? <span key={`ellipsis-${idx}`} className="users__pageEllipsis">…</span>
                        : (
                          <button
                            key={page}
                            className={`users__pageBtn${currentPage === page ? ' active' : ''}`}
                            onClick={() => goToPage(page)}
                          >{page}</button>
                        )
                    )}
                    <button className="users__pageBtn" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>›</button>
                    <button className="users__pageBtn" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>»</button>
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
              <span className="dash__menuIcon">⬡</span>
              <span className="dash__menuLabel">Users</span>
              <span className="dash__activeDot" />
            </button>
            <button className="dash__menuItem" onClick={() => navigate('/tasks')}>
              <span className="dash__menuIcon">◈</span>
              <span className="dash__menuLabel">Tasks</span>
            </button>
            <button className="dash__menuItem" onClick={() => navigate('/analytics')}>
              <span className="dash__menuIcon">◎</span>
              <span className="dash__menuLabel">Analytics</span>
            </button>
            <button className="dash__menuItem" onClick={() => navigate('/settings')}>
              <span className="dash__menuIcon">◇</span>
              <span className="dash__menuLabel">Settings</span>
            </button>
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
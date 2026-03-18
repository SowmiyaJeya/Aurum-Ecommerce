import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation, Outlet } from 'react-router-dom'
import '../styles/Dashboard.css'
const MENUS = [
  { icon: '⬡', label: 'Users',    key: 'users',    path: '/users' },
  { icon: '🏷️', label: 'Brands', key: 'brands', path: '/brands' },
  { icon: '◎', label: 'Category', key: 'category', path: '/category' },
  { icon: '◈', label: 'Products', key: 'products', path: '/products' },
  { icon: '🛒', label: 'Products List', key: 'lists', path: '/lists' },
  { icon: '◇', label: 'Settings', key: 'settings', path: '/settings' }

]

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=DM+Sans:wght@300;400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .dash {
    display: flex;
    width: 100vw;
    min-height: 100vh;
    background: #f7f5f0;
    font-family: 'DM Sans', sans-serif;
    overflow: hidden;
  }

  .dash__sidebar {
    width: 84px;
    min-height: 100vh;
    background: #1a1a1a;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 0 24px 0;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
  }

  .dash__sidebarLogo {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 22px 0 20px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    margin-bottom: 16px;
  }

  .dash__sidebarLogoMark {
    width: 38px;
    height: 38px;
    background: #1a7a5e;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #fff;
    letter-spacing: -0.5px;
  }

  .dash__nav {
    flex: 1;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 0 10px;
  }

  .dash__navItem {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 12px 6px 10px;
    border-radius: 12px;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.18s ease;
    position: relative;
  }

  .dash__navItem:hover { background: rgba(255,255,255,0.07); }
  .dash__navItem.active { background: #1a7a5e; }

  .dash__navItem.active::before {
    content: '';
    position: absolute;
    left: 0; top: 25%;
    height: 50%; width: 3px;
    background: #5ef0c8;
    border-radius: 0 3px 3px 0;
  }

  .dash__navIcon {
    font-size: 20px;
    color: rgba(255,255,255,0.45);
    line-height: 1;
    transition: color 0.18s ease, transform 0.18s ease;
  }

  .dash__navItem:hover .dash__navIcon { color: rgba(255,255,255,0.85); transform: scale(1.08); }
  .dash__navItem.active .dash__navIcon { color: #fff; }

  .dash__navLabel {
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 500;
    color: rgba(255,255,255,0.35);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    transition: color 0.18s ease;
    white-space: nowrap;
  }

  .dash__navItem:hover .dash__navLabel { color: rgba(255,255,255,0.75); }
  .dash__navItem.active .dash__navLabel { color: rgba(255,255,255,0.9); }

  .dash__sidebarDivider {
    width: 40px;
    height: 1px;
    background: rgba(255,255,255,0.08);
    margin: 10px 0;
    flex-shrink: 0;
  }

  .dash__sidebarUser {
    width: 100%;
    padding: 0 10px;
    position: relative;
  }

  .dash__sidebarUserBtn {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px 6px 8px;
    border-radius: 12px;
    background: none;
    border: none;
    cursor: pointer;
    transition: background 0.18s ease;
  }

  .dash__sidebarUserBtn:hover { background: rgba(255,255,255,0.07); }

  .dash__sidebarAvatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #1a7a5e, #2db68a);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #fff;
    position: relative;
  }

  .dash__sidebarAvatar::after {
    content: '';
    position: absolute;
    bottom: 0; right: 0;
    width: 9px; height: 9px;
    border-radius: 50%;
    background: #4ade80;
    border: 2px solid #1a1a1a;
  }

  .dash__sidebarUserName {
    font-family: 'DM Sans', sans-serif;
    font-size: 9.5px;
    font-weight: 500;
    color: rgba(255,255,255,0.4);
    letter-spacing: 0.02em;
    text-transform: uppercase;
    max-width: 64px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dash__logoutPopup {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%) translateY(6px);
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.1);
    border: 1px solid rgba(0,0,0,0.07);
    padding: 6px;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease, transform 0.2s cubic-bezier(0.16,1,0.3,1);
    min-width: 140px;
    z-index: 100;
  }

  .dash__logoutPopup.show {
    opacity: 1;
    pointer-events: all;
    transform: translateX(-50%) translateY(0);
  }

  .dash__logoutPopupUser {
    padding: 8px 12px 6px;
    font-size: 12px;
    font-weight: 600;
    color: #1a1a1a;
    font-family: 'DM Sans', sans-serif;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dash__logoutBtn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 12px;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 8px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: #e05555;
    font-weight: 500;
    transition: background 0.15s ease;
    text-align: left;
  }

  .dash__logoutBtn:hover { background: #fff5f5; }

  .dash__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .dash__topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 36px;
    background: rgba(247,245,240,0.95);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid rgba(0,0,0,0.07);
    flex-shrink: 0;
  }

  .dash__topbarBrand {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dash__topbarGem { font-size: 18px; color: #1a7a5e; }

  .dash__topbarName {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.3px;
  }

  .dash__topbarTitle {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: -0.4px;
  }

  .dash__main {
    flex: 1;
    padding: 32px 36px;
    overflow-y: auto;
  }

  .dash__bg {
    position: fixed;
    inset: 0;
    background-image:
      radial-gradient(circle at 30% 20%, rgba(26,122,94,0.05) 0%, transparent 50%),
      radial-gradient(circle at 80% 80%, rgba(26,122,94,0.03) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }

  @media (max-width: 600px) {
    .dash__sidebar { width: 68px; }
    .dash__topbar { padding: 14px 18px; }
    .dash__main { padding: 20px 18px; }
  }
`

export default function Dashboard() {
  const [user, setUser]             = useState(null)
  const [showLogout, setShowLogout] = useState(false)
  const navigate                    = useNavigate()
  const location                    = useLocation()
  const logoutRef                   = useRef(null)

  const active = MENUS.find(m => location.pathname === m.path)?.key || ''

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      setUser(JSON.parse(stored))
    } else {
      navigate('/')
    }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (logoutRef.current && !logoutRef.current.contains(e.target)) {
        setShowLogout(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const getInitials = (name) => (name ? name.slice(0, 2).toUpperCase() : 'U')
  const getActiveLabel = () => MENUS.find(m => m.key === active)?.label || 'Dashboard'

  if (!user) return null

  return (
    <>
      <style>{styles}</style>
      <div className="dash__bg" />

      <div className="dash">
        <aside className="dash__sidebar">
          <div className="dash__sidebarLogo">
            <div className="dash__sidebarLogoMark">A</div>
          </div>

          <nav className="dash__nav">
            {MENUS.map((m) => (
              <button
                key={m.key}
                className={`dash__navItem${active === m.key ? ' active' : ''}`}
                onClick={() => navigate(m.path)}
                title={m.label}
              >
                <span className="dash__navIcon">{m.icon}</span>
                <span className="dash__navLabel">{m.label}</span>
              </button>
            ))}
          </nav>

          <div className="dash__sidebarDivider" />

          <div className="dash__sidebarUser" ref={logoutRef}>
            <div className={`dash__logoutPopup${showLogout ? ' show' : ''}`}>
              <div className="dash__logoutPopupUser">👤 {user.username}</div>
              <button className="dash__logoutBtn" onClick={handleLogout}>
                ↩ &nbsp;Logout
              </button>
            </div>

            <button
              className="dash__sidebarUserBtn"
              onClick={() => setShowLogout(v => !v)}
              title={`${user.username} — click to logout`}
            >
              <div className="dash__sidebarAvatar">{getInitials(user.username)}</div>
              <span className="dash__sidebarUserName">{user.username}</span>
            </button>
          </div>
        </aside>

        <div className="dash__body">
          <header className="dash__topbar">
            <div className="dash__topbarBrand">
              <span className="dash__topbarGem">✦</span>
              <span className="dash__topbarName">Shiva Systems</span>
            </div>
            <span className="dash__topbarTitle">{getActiveLabel()}</span>
          </header>

          <main className="dash__main">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  )
}
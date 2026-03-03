import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Dashboard.css'

const MENUS = [
  { icon: '⬡', label: 'Users',     key: 'users',    path: '/users' },
  { icon: '◈', label: 'Tasks',     key: 'tasks',    path: '/tasks' },
  { icon: '◎', label: 'Analytics', key: 'analytics', path: '/analytics' },
  { icon: '◇', label: 'Settings',  key: 'settings',  path: '/settings' },
]

export default function Dashboard() {
  const [user, setUser]       = useState(null)
  const [hovered, setHovered] = useState(false)
  const [active, setActive]   = useState('overview')
  const navigate              = useNavigate()

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) setUser(JSON.parse(stored))
    else navigate('/')
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/')
  }

  const handleMenuClick = (menu) => {
    setActive(menu.key)
    navigate(menu.path)
  }

  if (!user) return null

  return (
    <div className="dash">

      {/* Subtle background texture */}
      <div className="dash__bg" />

      {/* Top bar */}
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

      {/* Empty main canvas */}
      <main className="dash__main" />

      {/* Right-side hover menu */}
      <div
        className={`dash__menuTrigger${hovered ? ' open' : ''}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Always-visible pill button */}
        <div className="dash__pill">
          <span className="dash__pillDots">
            <span /><span /><span />
          </span>
        </div>

        {/* Flyout panel */}
        <nav className="dash__flyout">
          <div className="dash__flyoutInner">
            {MENUS.map((m, i) => (
              <button
                key={m.key}
                className={`dash__menuItem${active === m.key ? ' active' : ''}`}
                style={{ '--i': i }}
                onClick={() => handleMenuClick(m)}
              >
                <span className="dash__menuIcon">{m.icon}</span>
                <span className="dash__menuLabel">{m.label}</span>
                {active === m.key && <span className="dash__activeDot" />}
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
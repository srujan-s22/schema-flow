import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link, NavLink } from 'react-router-dom'
import { clearAuth } from '../services/api'
import Logo from '../components/Logo'
import { DatabaseIcon } from '../components/Logo'

export default function SidebarLayout({ children, navItems = [], brandLabel = 'SchemaFlow' }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDark(true)
      document.documentElement.classList.add('dark')
    } else {
      setIsDark(false)
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setIsDark(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setIsDark(true)
    }
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="h-screen overflow-hidden bg-[var(--color-surface-alt)] font-sans">

      {/* ── Mobile Topbar ────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between bg-[var(--color-surface)] border-b border-[var(--color-border)] p-4 fixed top-0 left-0 right-0 z-30 shadow-sm">
        <Logo size="sm" brandLabel={brandLabel} />
        <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 -mr-2 text-[var(--color-slate-600)] hover:text-[var(--color-slate-900)] transition-colors cursor-pointer">
          {mobileOpen ? <CloseIcon size={24} /> : <MenuIcon size={24} />}
        </button>
      </div>

      {/* ── Mobile Overlay ───────────────────────────── */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      {/* ── Sidebar ──────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex-shrink-0
          flex flex-col border-r border-[var(--color-border)]
          bg-[var(--color-surface)] shadow-lg shadow-[var(--color-slate-900)]/5
          transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden
          ${mobileOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'}
          ${collapsed ? 'md:w-[72px]' : 'md:w-64'}
          md:translate-x-0
        `}
      >
        {/* Brand (Desktop) */}
        <div className="hidden md:flex items-center px-5 pt-8 pb-8 flex-shrink-0">
          <Logo size="md" hideText={collapsed} brandLabel={brandLabel} />
        </div>

        {/* Mobile Spacer to match topbar visually */}
        <div className="md:hidden h-16 w-full border-b border-[var(--color-border)] flex items-center px-6 flex-shrink-0">
          <span className="text-[14px] font-bold text-[var(--color-slate-400)] uppercase tracking-wider">Navigation</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 flex flex-col gap-1.5 px-3 md:pt-0 pt-6 overflow-y-auto">
          {navItems.map(({ label, path }) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center ${collapsed ? 'md:justify-center' : ''} gap-3.5 rounded-xl px-3 py-3 text-[14px] font-semibold transition-all duration-200
                ${isActive
                  ? 'bg-[var(--color-surface-alt)] text-[var(--color-slate-900)] shadow-sm'
                  : 'text-[var(--color-slate-500)] hover:text-[var(--color-slate-900)] hover:bg-[var(--color-surface-alt)]'
                }`
              }
            >
              <GridIcon size={18} />
              {!collapsed && <span>{label}</span>}
              {collapsed && <span className="md:hidden">{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Action Button at Bottom */}
        <div className="p-4 border-t border-[var(--color-border)] mt-auto space-y-2 flex-shrink-0">
          <Link
            to="/database"
            onClick={() => setMobileOpen(false)}
            className={`btn-primary flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] shadow-sm transition-colors cursor-pointer ${collapsed ? 'md:justify-center' : ''} justify-center w-full`}
          >
            <DatabaseIcon className="w-[18px] h-[18px]" strokeWidth="2.5" />
            {!collapsed && <span>Visualize Database</span>}
            {collapsed && <span className="md:hidden">Visualize Database</span>}
          </Link>

          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[var(--color-slate-500)] hover:bg-red-500/10 hover:text-red-600 transition-colors text-[13px] font-semibold cursor-pointer ${collapsed ? 'md:justify-center' : ''} justify-center w-full`}
          >
            <LogoutIcon size={18} />
            {!collapsed && <span>Logout</span>}
            {collapsed && <span className="md:hidden">Logout</span>}
          </button>
        </div>

        {/* Bottom utility section (Theme & Collapse) */}
        <div className="px-3 pb-4 pt-2 flex flex-col gap-2 border-t border-[var(--color-border)] flex-shrink-0">

          <button
            onClick={toggleTheme}
            className={`flex items-center ${collapsed ? 'md:justify-center px-3' : 'justify-between px-4'} rounded-xl bg-[var(--color-surface-alt)] border border-[var(--color-border)] py-2.5 text-[var(--color-slate-600)] hover:text-[var(--color-accent)] transition-colors cursor-pointer w-full`}
            aria-label="Toggle Theme"
          >
            <div className="flex items-center gap-3">
              {isDark ? <MoonIcon size={16} /> : <SunIcon size={16} />}
              {!collapsed && <span className="font-semibold text-xs tracking-wide uppercase">{isDark ? 'Dark Mode' : 'Light Mode'}</span>}
              {collapsed && <span className="md:hidden font-semibold text-xs tracking-wide uppercase">{isDark ? 'Dark Mode' : 'Light Mode'}</span>}
            </div>
          </button>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex items-center justify-center rounded-xl border border-transparent py-2 text-[var(--color-slate-400)] hover:text-[var(--color-slate-900)] hover:bg-[var(--color-slate-50)] transition-colors cursor-pointer mt-1 w-full"
            aria-label="Toggle sidebar"
          >
            <ChevronIcon collapsed={collapsed} />
          </button>
        </div>
      </aside>

      {/* ── Main Content ─────────────────────────────── */}
      <main className={`
        h-screen overflow-y-auto bg-[var(--color-surface-alt)]
        pt-[64px] md:pt-0
        transition-all duration-300 ease-in-out
        ${collapsed ? 'md:ml-[72px]' : 'md:ml-64'}
      `}>
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-10">
          {children}
        </div>
      </main>
    </div>
  )
}

/* ── Inline SVG icons ───────────────────────────────────── */

function MenuIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  )
}

function CloseIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  )
}

/* ── Inline SVG icons ───────────────────────────────────── */

function GridIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </svg>
  )
}

function LogoutIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function ChevronIcon({ collapsed }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`transition-transform duration-300 ${collapsed ? 'rotate-180 text-[var(--color-accent)]' : ''}`}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  )
}

function SunIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <line x1="12" y1="1" x2="12" y2="3"></line>
      <line x1="12" y1="21" x2="12" y2="23"></line>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
      <line x1="1" y1="12" x2="3" y2="12"></line>
      <line x1="21" y1="12" x2="23" y2="12"></line>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
    </svg>
  )
}

function MoonIcon({ size = 20 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  )
}

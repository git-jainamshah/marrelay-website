'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
/* eslint-disable @next/next/no-img-element */
import { LogOut, Globe, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react'
import NotificationBell from './NotificationBell'
import { NAV_GROUPS, visibleGroups } from './nav'

export default function Sidebar({ userName, userEmail, role = 'admin' }: { userName: string; userEmail: string; role?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setCollapsed(localStorage.getItem('marrelay_admin_sidebar') === 'collapsed')
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform))
  }, [])

  function toggle() {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('marrelay_admin_sidebar', next ? 'collapsed' : 'open')
  }

  async function logout() {
    await fetch('/api/admin/auth/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const allHrefs = NAV_GROUPS.flatMap((gr) => gr.items.map((i) => i.href))
  const groups = visibleGroups(role)

  return (
    <aside className={`ad-side ${collapsed ? 'collapsed' : ''}`}>
      <div className="ad-side-head">
        <img src="/assets/marrelay-mark.png" alt="Marrelay" />
        {!collapsed && (
          <div className="ad-side-title" style={{ flex: 1 }}>
            <b>Marrelay <span>Admin</span></b>
            <small title={userEmail}>{userName}</small>
          </div>
        )}
        <button onClick={toggle} className="ad-collapse-btn" style={{ width: 'auto', padding: 6 }}
          title={collapsed ? 'Expand menu' : 'Collapse menu'}>
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div className="ad-side-search">
        <button type="button" className="ad-search-trigger" onClick={() => window.dispatchEvent(new Event('admin:palette'))}
          title="Search pages and actions">
          <Search size={15} />
          {!collapsed && <><span>Find anything…</span><kbd>{isMac ? '⌘' : 'Ctrl'} K</kbd></>}
        </button>
      </div>

      <nav className="ad-nav">
        <NotificationBell collapsed={collapsed} />
        {groups.map((g) => (
          <div key={g.label} className="ad-nav-group">
            <div className="ad-nav-group-label">{g.label}</div>
            {g.items.filter((i) => i.href !== '/admin/account').map(({ href, label, icon: Icon }) => {
              const active = href === '/admin'
                ? pathname === '/admin'
                : pathname === href ||
                  (!!pathname?.startsWith(href + '/') &&
                    !allHrefs.some((h) => h !== href && h.startsWith(href) && pathname?.startsWith(h)))
              return (
                <Link key={href} href={href} title={collapsed ? label : undefined}
                  className={`ad-nav-item ${active ? 'active' : ''}`}>
                  <Icon />
                  {!collapsed && label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      <div className="ad-side-foot">
        <Link href="/admin/account" className={`ad-nav-item${pathname === '/admin/account' ? ' active' : ''}`} title="My account">
          <span className="ad-avatar" aria-hidden="true">{(userName || '?').trim().charAt(0).toUpperCase()}</span>
          {!collapsed && 'My Account'}
        </Link>
        <a href="/" target="_blank" className="ad-nav-item" title="View site">
          <Globe />
          {!collapsed && 'View site'}
        </a>
        <button onClick={logout} className="ad-nav-item" style={{ border: 0, background: 'transparent', cursor: 'pointer' }} title="Sign out">
          <LogOut />
          {!collapsed && 'Sign out'}
        </button>
      </div>
    </aside>
  )
}

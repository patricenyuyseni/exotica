import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

type AdminLayoutProps = {
  children: React.ReactNode
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const navigate = useNavigate()

  function handleLogout() {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('admin_token')

    navigate('/login')
  }

  const navStyle = ({
    isActive,
  }: {
    isActive: boolean
  }) => ({
    display: 'block',
    padding: '12px 16px',
    borderRadius: '10px',
    textDecoration: 'none',
    color: isActive ? '#fff' : '#9ca3af',
    background: isActive
      ? 'rgba(124, 58, 237, 0.2)'
      : 'transparent',
    border: isActive
      ? '1px solid rgba(124, 58, 237, 0.4)'
      : '1px solid transparent',
    transition: 'all 0.2s ease',
  })

  return (
    <div
      style={{
        display: 'flex',
        minHeight: 'calc(100vh - 70px)',
        background: '#08080d',
        color: '#fff',
      }}
    >
      {/* SIDEBAR */}
      <aside
        style={{
          width: '240px',
          padding: '24px 16px',
          borderRight: '1px solid #1f1f29',
          background: '#0b0b12',
        }}
      >
        <div
          style={{
            marginBottom: '30px',
            padding: '0 10px',
          }}
        >
          <div
            style={{
              fontSize: '12px',
              color: '#8b5cf6',
              fontWeight: 700,
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Exotica
          </div>

          <div
            style={{
              fontSize: '20px',
              fontWeight: 700,
              marginTop: '4px',
            }}
          >
            Admin Panel
          </div>
        </div>

        <nav
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <NavLink
            to="/admin/products"
            style={navStyle}
          >
            🛍️ Products
          </NavLink>

          <NavLink
            to="/admin/orders"
            style={navStyle}
          >
            📦 Orders
          </NavLink>
        </nav>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '40px',
          }}
        >
          <button
            onClick={() => navigate('/shop')}
            style={{
              width: '100%',
              padding: '11px 14px',
              marginBottom: '10px',
              borderRadius: '10px',
              border: '1px solid #272733',
              background: 'transparent',
              color: '#d1d5db',
              cursor: 'pointer',
            }}
          >
            ← Back to Shop
          </button>

          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '11px 14px',
              borderRadius: '10px',
              border: '1px solid #3a2020',
              background: '#171010',
              color: '#fca5a5',
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <section
        style={{
          flex: 1,
          minWidth: 0,
          padding: '30px',
        }}
      >
        {children}
      </section>
    </div>
  )
}
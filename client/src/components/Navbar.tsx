import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

type StoredUser = {
  id: string
  name: string
  email: string
  role: string
}

type CartItem = {
  quantity: number
}

export default function Navbar() {
  const navigate = useNavigate()

  const [cartCount, setCartCount] = useState(0)

  const token = window.localStorage.getItem('auth_token')
  const storedUser = window.localStorage.getItem('auth_user')

  let user: StoredUser | null = null

  try {
    user = storedUser ? JSON.parse(storedUser) : null
  } catch {
    user = null
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD CART COUNT
  |--------------------------------------------------------------------------
  */

  const loadCartCount = async () => {
    try {
      const headers: Record<string, string> = {}

      /*
        If the user is logged in, send their JWT.
        The server will use the user ID inside the JWT
        to load only their cart.
      */
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(
        '/api/cart',
        {
          headers,
        }
      )

      if (!response.ok) {
        setCartCount(0)
        return
      }

      const data = await response.json()

      const items: CartItem[] =
        Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.items)
            ? data.items
            : []

      const total = items.reduce(
        (sum, item) =>
          sum + Number(item.quantity || 0),
        0
      )

      setCartCount(total)
    } catch (error) {
      console.error(
        'Failed to load cart count:',
        error
      )

      setCartCount(0)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | LOAD CART WHEN NAVBAR MOUNTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    loadCartCount()

    const handleFocus = () => {
      loadCartCount()
    }

    window.addEventListener(
      'focus',
      handleFocus
    )

    return () => {
      window.removeEventListener(
        'focus',
        handleFocus
      )
    }
  }, [token])

  /*
  |--------------------------------------------------------------------------
  | UPDATE CART COUNT
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const handleCartUpdated = () => {
      loadCartCount()
    }

    window.addEventListener(
      'cart-updated',
      handleCartUpdated
    )

    return () => {
      window.removeEventListener(
        'cart-updated',
        handleCartUpdated
      )
    }
  }, [token])

  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  function handleLogout() {
    window.localStorage.removeItem('auth_token')
    window.localStorage.removeItem('auth_user')
    window.localStorage.removeItem('admin_token')

    setCartCount(0)

    navigate('/login')
  }

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 18,
        background: '#020205',
      }}
    >
      <Link
        to="/"
        style={{
          color: '#fff',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: 20,
        }}
      >
        EXOTICA
      </Link>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <Link
          to="/shop"
          style={{
            color: '#9ca3af',
            textDecoration: 'none',
          }}
        >
          Shop
        </Link>

        {/* CART */}
        <Link
          to="/cart"
          style={{
            color: '#9ca3af',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <span>Cart</span>

          {cartCount > 0 && (
            <span
              style={{
                minWidth: 21,
                height: 21,
                padding: '0 6px',
                borderRadius: 999,
                background: '#7c3aed',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {cartCount}
            </span>
          )}
        </Link>

        {token && user?.role === 'admin' && (
          <>
            <Link
              to="/admin/products"
              style={{
                color: '#fff',
                textDecoration: 'none',
                background: '#7c3aed',
                padding: '8px 14px',
                borderRadius: 7,
                fontWeight: 600,
              }}
            >
              Products
            </Link>

            <Link
              to="/admin/orders"
              style={{
                color: '#fff',
                textDecoration: 'none',
                background: '#2563eb',
                padding: '8px 14px',
                borderRadius: 7,
                fontWeight: 600,
              }}
            >
              Orders
            </Link>
          </>
        )}

        {token && user ? (
          <>
            <span style={{ color: '#fff' }}>
              {user.name}
            </span>

            <button
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: '1px solid #444',
                color: '#fff',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <Link
            to="/login"
            style={{
              color: '#9ca3af',
              textDecoration: 'none',
            }}
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  )
}
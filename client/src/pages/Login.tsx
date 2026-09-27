
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiUrl } from '../api'

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setError('')
    setEmailError('')
    setPasswordError('')

    const cleanEmail = email.trim().toLowerCase()

    let valid = true

    if (!cleanEmail) {
      setEmailError('Please enter your email address.')
      valid = false
    } else if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.')
      valid = false
    }

    if (!password) {
      setPasswordError('Please enter your password.')
      valid = false
    }

    if (!valid) {
      return
    }

    setLoading(true)

    try {
      const res = await fetch(apiUrl('/api/auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanEmail,
          password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Invalid email or password.')
        return
      }

      if (!data.data?.token || !data.data?.user) {
        setError('Login succeeded but account information was not returned.')
        return
      }

      localStorage.setItem(
        'auth_token',
        data.data.token
      )

      localStorage.setItem(
        'auth_user',
        JSON.stringify(data.data.user)
      )

      if (data.data.user.role === 'admin') {
        localStorage.setItem(
          'admin_token',
          data.data.token
        )

        navigate('/admin/products')
      } else {
        navigate('/shop')
      }
    } catch {
      setError(
        'Unable to connect to the server. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        maxWidth: 450,
        margin: '60px auto',
        padding: 20,
      }}
    >
      <h1>Login</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError('')
              setError('')
            }}
            placeholder="you@example.com"
            autoComplete="email"
            required
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              boxSizing: 'border-box',
              border: emailError
                ? '1px solid red'
                : '1px solid #ccc',
              borderRadius: 4,
            }}
          />

          {emailError && (
            <p
              style={{
                color: 'red',
                fontSize: 14,
                marginTop: 5,
              }}
            >
              {emailError}
            </p>
          )}
        </div>

        <div style={{ marginBottom: 15 }}>
          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              setPasswordError('')
              setError('')
            }}
            placeholder="Enter your password"
            autoComplete="current-password"
            required
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              boxSizing: 'border-box',
              border: passwordError
                ? '1px solid red'
                : '1px solid #ccc',
              borderRadius: 4,
            }}
          />

          {passwordError && (
            <p
              style={{
                color: 'red',
                fontSize: 14,
                marginTop: 5,
              }}
            >
              {passwordError}
            </p>
          )}
        </div>

        {error && (
          <p
            style={{
              color: 'red',
              background: '#fff0f0',
              padding: 10,
              borderRadius: 4,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            cursor: loading
              ? 'not-allowed'
              : 'pointer',
          }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        Don't have an account?{' '}
        <Link to="/register">
          Create an account
        </Link>
      </p>
    </div>
  )
}

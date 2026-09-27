
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiUrl } from '../api'

export default function Register() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setError('')
    setLoading(true)

    try {
      const response = await fetch(apiUrl('/api/auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.message || 'Registration failed')
        return
      }

      if (!data.data?.token || !data.data?.user) {
        setError('Registration succeeded but account data was not returned')
        return
      }

      localStorage.setItem('auth_token', data.data.token)
      localStorage.setItem(
        'auth_user',
        JSON.stringify(data.data.user)
      )

      navigate('/shop')
    } catch {
      setError('Unable to connect to the server')
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
      <h1>Create Account</h1>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 15 }}>
          <label htmlFor="name">Name</label>

          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 15 }}>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              width: '100%',
              padding: 12,
              marginTop: 6,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {error && (
          <p style={{ color: 'red' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: 12,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p style={{ marginTop: 20 }}>
        Already have an account?{' '}
        <Link to="/login">Login</Link>
      </p>
    </div>
  )
}

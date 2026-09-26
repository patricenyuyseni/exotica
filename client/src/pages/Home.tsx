
import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="home-page">
      <section
        style={{
          minHeight: '70vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '60px 20px',
        }}
      >
        <div style={{ maxWidth: 800 }}>
          <h1
            style={{
              fontSize: 'clamp(2.5rem, 6vw, 5rem)',
              marginBottom: 20,
            }}
          >
            Welcome to Exotica
          </h1>

          <p
            style={{
              fontSize: '1.2rem',
              lineHeight: 1.7,
              marginBottom: 35,
            }}
          >
            Discover our collection of exotic products,
            carefully selected for you.
          </p>

          <Link
            to="/shop"
            style={{
              display: 'inline-block',
              padding: '14px 32px',
              textDecoration: 'none',
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            Shop Now
          </Link>
        </div>
      </section>
    </div>
  )
}


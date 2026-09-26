
import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'

type ProtectedRouteProps = {
  children: React.ReactNode
}

export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {
  const location = useLocation()

  const token =
    localStorage.getItem('auth_token') ||
    localStorage.getItem('admin_token')

  if (!token) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return <>{children}</>
}


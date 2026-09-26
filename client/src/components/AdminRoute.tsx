import React from 'react'
import { Navigate } from 'react-router-dom'

type StoredUser = {
  id: string
  name: string
  email: string
  role: string
}

type AdminRouteProps = {
  children: React.ReactNode
}

export default function AdminRoute({
  children,
}: AdminRouteProps) {
  const token = window.localStorage.getItem('auth_token')
  const storedUser = window.localStorage.getItem('auth_user')

  let user: StoredUser | null = null

  try {
    user = storedUser
      ? JSON.parse(storedUser)
      : null
  } catch {
    user = null
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
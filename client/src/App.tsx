import React from 'react'
import { Routes, Route } from 'react-router-dom'
import './styles.css'

import AgeVerification from './components/AgeVerification'
import Shop from './pages/Shop'
import ProductPage from './pages/ProductPage'
import Cart from './pages/Cart'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminProducts from './pages/AdminProducts'
import AdminOrders from './pages/AdminOrders'

import Navbar from './components/Navbar'
import Footer from './components/Footer'
import DemoOrderPopup from './components/DemoOrderPopup'
import AdminRoute from './components/AdminRoute'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  return (
    <div className="app">
      <AgeVerification />

      <Navbar />

      <main>
        <Routes>

          {/* PUBLIC STOREFRONT */}
          <Route
            path="/"
            element={<Shop />}
          />

          {/* LOGIN */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* REGISTER */}
          <Route
            path="/register"
            element={<Register />}
          />

          {/* SHOP */}
          <Route
            path="/shop"
            element={
              <ProtectedRoute>
                <Shop />
              </ProtectedRoute>
            }
          />

          {/* PRODUCT DETAILS */}
          <Route
            path="/product/:slug"
            element={<ProductPage />}
          />

          {/* CART */}
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />

          {/* ADMIN PRODUCTS */}
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />

          {/* ADMIN ORDERS */}
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />

        </Routes>
      </main>

      <Footer />

      <DemoOrderPopup />
    </div>
  )
}
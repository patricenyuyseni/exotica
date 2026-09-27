import React, { useEffect, useState } from 'react'
import './DemoOrderPopup.css'
import { apiUrl } from '../api'

type Product = {
  id: string
  name: string
  price: number
  image?: string
}

const locations = [
  'New York',
  'Los Angeles',
  'Miami',
  'Chicago',
  'Houston',
  'Atlanta',
  'Dallas',
  'Las Vegas',
  'San Francisco',
  'Seattle',
]

export default function DemoOrderPopup() {
  const [products, setProducts] = useState<Product[]>([])
  const [visible, setVisible] = useState(false)
  const [product, setProduct] = useState<Product | null>(null)
  const [location, setLocation] = useState('')

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const response = await fetch(
          apiUrl('/api/products')
        )

        if (!response.ok) return

        const data = await response.json()

        if (
          Array.isArray(data?.data) &&
          data.data.length > 0
        ) {
          setProducts(data.data)
        }
      } catch (error) {
        console.error('Product loading error:', error)
      }
    }

    loadProducts()
  }, [])

  useEffect(() => {
    if (products.length === 0) return

    let productIndex = 0
    let timer: ReturnType<typeof setTimeout>

    const showNotification = () => {
      const selectedProduct =
        products[productIndex % products.length]

      const selectedLocation =
        locations[
          Math.floor(
            Math.random() * locations.length
          )
        ]

      setProduct(selectedProduct)
      setLocation(selectedLocation)
      setVisible(true)

      productIndex++

      timer = setTimeout(() => {
        setVisible(false)

        timer = setTimeout(() => {
          showNotification()
        }, 5000)
      }, 5000)
    }

    timer = setTimeout(showNotification, 5000)

    return () => {
      clearTimeout(timer)
    }
  }, [products])

  if (!visible || !product) {
    return null
  }

  return (
    <div className="order-popup">
      <img
        className="order-popup-image"
        src={
          product.image ||
          '/images/products/placeholder.jpg'
        }
        alt={product.name}
        onError={(
          e: React.SyntheticEvent<HTMLImageElement>
        ) => {
          e.currentTarget.src =
            '/images/products/placeholder.jpg'
        }}
      />

      <div className="order-popup-content">
        <div className="order-popup-title">
          Someone just ordered
        </div>

        <div className="order-popup-product">
          {product.name}
        </div>

        <div className="order-popup-details">
          ${Number(product.price || 0).toFixed(2)}
          {' • '}
          {location}
          {' • '}
          just now
        </div>
      </div>
    </div>
  )
}
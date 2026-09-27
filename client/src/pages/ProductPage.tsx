
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiUrl } from '../api'

type Product = {
  id: string
  name: string
  slug?: string
  description?: string
  price: number
  image?: string
  images?: string[]
  stockQuantity?: number
  stock_quantity?: number
  compareAtPrice?: number
}

const formatUSD = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value))
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const [product, setProduct] = useState<Product | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [addingToCart, setAddingToCart] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      if (!slug) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)

        const response = await fetch(
          apiUrl(`/api/products/${encodeURIComponent(slug)}`)
        )

        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.message || 'Could not load product'
          )
        }

        setProduct(data.data || data)
      } catch (error) {
        console.error('Load product failed:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [slug])

  const addToCart = async () => {
    if (!product) {
      return
    }

    const stock = Number(
      product.stockQuantity ??
        product.stock_quantity ??
        999999
    )

    if (stock < 1) {
      setMessage('This product is out of stock.')
      return
    }

    if (quantity > stock) {
      setMessage(`Only ${stock} item(s) available.`)
      return
    }

    try {
      setAddingToCart(true)
      setMessage('')

      const token =
        localStorage.getItem('auth_token') ||
        localStorage.getItem('admin_token')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch(
        apiUrl('/api/cart'),
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            productId: product.id,
            quantity,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not add product to cart'
        )
      }

      setMessage('Product added to cart.')

      window.dispatchEvent(
        new Event('cart-updated')
      )
    } catch (error) {
      console.error('Add to cart failed:', error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not add product to cart'
      )
    } finally {
      setAddingToCart(false)
    }
  }

  if (loading) {
    return (
      <div className="product-page">
        <button
          type="button"
          className="product-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <p>Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-page">
        <button
          type="button"
          className="product-back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>

        <h2>Product not found.</h2>
        <p>We could not find this product.</p>
      </div>
    )
  }

  const stock = Number(
    product.stockQuantity ??
      product.stock_quantity ??
      999999
  )

  const image =
    product.image ||
    product.images?.[0] ||
    '/images/products/placeholder.jpg'

  return (
    <div className="product-page">

      <button
        type="button"
        className="product-back-button"
        onClick={() => navigate(-1)}
      >
        ← Back to Shop
      </button>

      <div className="product-image">
        <img
          src={image}
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src =
              '/images/products/placeholder.jpg'
          }}
        />
      </div>

      <div className="product-details">
        <h1>{product.name}</h1>

        <p className="product-price">
          {formatUSD(product.price)}
        </p>

        {product.compareAtPrice &&
          product.compareAtPrice > product.price && (
            <p className="product-old-price">
              {formatUSD(product.compareAtPrice)}
            </p>
          )}

        {product.description && (
          <p className="product-description">
            {product.description}
          </p>
        )}

        <p>
          {stock > 0
            ? `${stock} item(s) available`
            : 'Out of stock'}
        </p>

        <div className="quantity-control">
          <button
            type="button"
            onClick={() =>
              setQuantity(
                Math.max(1, quantity - 1)
              )
            }
            disabled={quantity <= 1}
          >
            -
          </button>

          <span>{quantity}</span>

          <button
            type="button"
            onClick={() =>
              setQuantity(
                Math.min(stock, quantity + 1)
              )
            }
            disabled={
              quantity >= stock ||
              stock < 1
            }
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={addToCart}
          disabled={
            addingToCart ||
            stock < 1
          }
        >
          {addingToCart
            ? 'Adding...'
            : 'Add to Cart'}
        </button>

        {message && (
          <p className="cart-message">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

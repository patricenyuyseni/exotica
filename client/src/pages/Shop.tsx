import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Product = {
  id: string
  name: string
  slug: string
  description?: string
  image?: string
  price: number
  compareAtPrice?: number
  stockQuantity: number
  rating?: number
  reviewCount?: number
  featured?: boolean
  active?: boolean
  category?: string
}

const PRODUCTS_PER_PAGE = 12

function AgeGate({ onAccept }: { onAccept: () => void }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const accepted = localStorage.getItem('age_verified')

    if (accepted === 'true') {
      setVisible(false)
    }
  }, [])

  if (!visible) return null

  return (
    <div className="agegate">
      <div className="agegate-card">
        <div className="agegate-logo">EXOTICA</div>

        <h2>Welcome to Exotica</h2>

        <p>
          Please confirm that you are 18 or older to continue.
        </p>

        <div className="agegate-actions">
          <button
            className="agegate-primary"
            onClick={() => {
              localStorage.setItem('age_verified', 'true')
              setVisible(false)
              onAccept()
            }}
          >
            Yes, I am 18+
          </button>

          <button
            className="agegate-secondary"
            onClick={() => {
              window.location.href = 'https://www.google.com'
            }}
          >
            No, leave
          </button>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate()

  const [adding, setAdding] = useState(false)
  const [cartQuantity, setCartQuantity] = useState(0)

  const discount =
    product.compareAtPrice &&
    product.compareAtPrice > product.price
      ? Math.round(
          ((product.compareAtPrice - product.price) /
            product.compareAtPrice) *
            100
        )
      : 0

  const openProduct = () => {
    navigate(`/product/${product.slug}`)
  }

  const addToCart = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation()

    if (product.stockQuantity <= 0 || adding) {
      return
    }

    setAdding(true)

    try {
      /*
        Get the logged-in user's JWT.

        If there is no token, the backend will
        treat this as a guest cart.
      */
      const token = localStorage.getItem('auth_token') || localStorage.getItem('admin_token')

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message || 'Could not add to cart'
        )
      }

      // Update this product's button
      setCartQuantity((current) => current + 1)

      // Tell Navbar that cart changed
      window.dispatchEvent(
        new Event('cart-updated')
      )
    } catch (error) {
      console.error('Add to cart error:', error)
    } finally {
      setAdding(false)
    }
  }

  const remainingStock = Math.max(
    product.stockQuantity - cartQuantity,
    0
  )

  const canAddMore =
    remainingStock > 0 && !adding

  return (
    <article
      className="product-card"
      onClick={openProduct}
    >
      <div className="product-image-wrapper">
        {discount > 0 && (
          <span className="product-badge">
            -{discount}%
          </span>
        )}

        {product.featured && (
          <span className="featured-badge">
            Featured
          </span>
        )}

        <img
          className="product-image"
          src={
            product.image ||
            '/images/products/placeholder.jpg'
          }
          alt={product.name}
          onError={(event) => {
            event.currentTarget.src =
              '/images/products/placeholder.jpg'
          }}
        />

        <div className="product-overlay">
          <button
            className="quick-view"
            onClick={(event) => {
              event.stopPropagation()
              openProduct()
            }}
          >
            View product
          </button>
        </div>
      </div>

      <div className="product-info">
        <div className="product-category">
          EXOTICA COLLECTION
        </div>

        <h3>{product.name}</h3>

        {product.description && (
          <p className="product-description">
            {product.description.length > 90
              ? `${product.description.slice(0, 90)}...`
              : product.description}
          </p>
        )}

        <div className="product-rating">
          <span>★★★★★</span>

          <small>
            ({product.reviewCount || 0})
          </small>
        </div>

        <div className="product-price-row">
          <div className="product-prices">
            <span className="product-price">
              ${Number(product.price).toFixed(2)}
            </span>

            {product.compareAtPrice &&
              product.compareAtPrice > product.price && (
                <span className="product-old-price">
                  $
                  {Number(
                    product.compareAtPrice
                  ).toFixed(2)}
                </span>
              )}
          </div>

          <span
            className={
              remainingStock > 0
                ? 'stock-status'
                : 'stock-status out'
            }
          >
            {remainingStock > 0
              ? 'In stock'
              : 'Sold out'}
          </span>
        </div>

        <button
          className={
            cartQuantity > 0
              ? 'add-cart-button added'
              : 'add-cart-button'
          }
          disabled={!canAddMore}
          onClick={addToCart}
        >
          {adding ? (
            'Adding...'
          ) : cartQuantity > 0 ? (
            <>
              Added to cart
              <span className="cart-quantity">
                {cartQuantity}
              </span>
            </>
          ) : product.stockQuantity > 0 ? (
            'Add to cart'
          ) : (
            'Out of stock'
          )}
        </button>
      </div>
    </article>
  )
}

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)

  const [page, setPage] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [sort, setSort] = useState('featured')
  const [showFilters, setShowFilters] = useState(false)

  /*
  |--------------------------------------------------------------------------
  | LOAD FIRST PAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true)

        const response = await fetch(
          `/api/products?page=1&limit=${PRODUCTS_PER_PAGE}`
        )

        if (!response.ok) {
          throw new Error('Failed to load products')
        }

        const data = await response.json()

        if (Array.isArray(data?.data)) {
          setProducts(data.data)

          setTotalProducts(
            Number(
              data?.meta?.total ||
                data.data.length
            )
          )

          setPage(1)
        }
      } catch (error) {
        console.error(
          'Product loading error:',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  /*
  |--------------------------------------------------------------------------
  | LOAD MORE PRODUCTS
  |--------------------------------------------------------------------------
  */

  const loadMoreProducts = async () => {
    if (loadingMore) return

    if (products.length >= totalProducts) {
      return
    }

    const nextPage = page + 1

    try {
      setLoadingMore(true)

      const response = await fetch(
        `/api/products?page=${nextPage}&limit=${PRODUCTS_PER_PAGE}`
      )

      if (!response.ok) {
        throw new Error(
          'Failed to load more products'
        )
      }

      const data = await response.json()

      if (Array.isArray(data?.data)) {
        setProducts((currentProducts) => [
          ...currentProducts,
          ...data.data,
        ])

        setPage(nextPage)

        if (data?.meta?.total) {
          setTotalProducts(
            Number(data.meta.total)
          )
        }
      }
    } catch (error) {
      console.error(
        'Failed to load more products:',
        error
      )
    } finally {
      setLoadingMore(false)
    }
  }

  /*
  |--------------------------------------------------------------------------
  | CATEGORIES
  |--------------------------------------------------------------------------
  */

  const categories = useMemo(() => {
    const values = products
      .map((product) => product.category)
      .filter(Boolean) as string[]

    return [
      'All',
      ...Array.from(new Set(values)),
    ]
  }, [products])

  /*
  |--------------------------------------------------------------------------
  | FILTER + SORT
  |--------------------------------------------------------------------------
  */

  const filteredProducts = useMemo(() => {
    let result = [...products]

    if (search.trim()) {
      const query = search.toLowerCase()

      result = result.filter((product) =>
        `${product.name} ${product.description || ''}`
          .toLowerCase()
          .includes(query)
      )
    }

    if (category !== 'All') {
      result = result.filter(
        (product) =>
          product.category === category
      )
    }

    switch (sort) {
      case 'price-low':
        result.sort(
          (a, b) =>
            Number(a.price) -
            Number(b.price)
        )
        break

      case 'price-high':
        result.sort(
          (a, b) =>
            Number(b.price) -
            Number(a.price)
        )
        break

      case 'name':
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        )
        break

      case 'newest':
        result.reverse()
        break

      default:
        result.sort(
          (a, b) =>
            Number(Boolean(b.featured)) -
            Number(Boolean(a.featured))
        )
    }

    return result
  }, [
    products,
    search,
    category,
    sort,
  ])

  const featuredProducts = products
    .filter(
      (product) => product.featured
    )
    .slice(0, 4)

  const hasMoreProducts =
    products.length < totalProducts

  return (
    <div className="storefront">
      <AgeGate onAccept={() => {}} />

      {/* Announcement */}
      <div className="announcement">
        <span>
          EXOTICA — Discover the extraordinary
        </span>

        <span className="announcement-divider">
          •
        </span>

        <span>Premium collection</span>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero-content">
          <span className="hero-eyebrow">
            THE EXOTICA COLLECTION
          </span>

          <h1>
            Discover
            <br />
            <em>the extraordinary.</em>
          </h1>

          <p>
            Explore our carefully selected collection
            of exceptional products, designed for those
            who appreciate something different.
          </p>

          <a
            href="#collection"
            className="hero-button"
          >
            Explore collection
          </a>
        </div>

        <div className="hero-decoration">
          <div className="hero-circle hero-circle-one" />
          <div className="hero-circle hero-circle-two" />
          <div className="hero-glow" />
        </div>
      </section>

      {/* Categories */}
      <section className="category-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">
              BROWSE
            </span>

            <h2>Shop by category</h2>
          </div>
        </div>

        <div className="category-list">
          {categories.map((item) => (
            <button
              key={item}
              className={
                category === item
                  ? 'category-button active'
                  : 'category-button'
              }
              onClick={() => {
                setCategory(item)

                document
                  .getElementById('collection')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }}
            >
              {item}
            </button>
          ))}
        </div>
      </section>

      {/* Featured */}
      {featuredProducts.length > 0 && (
        <section className="featured-section">
          <div className="section-heading">
            <div>
              <span className="section-eyebrow">
                CURATED FOR YOU
              </span>

              <h2>Featured collection</h2>
            </div>

            <button
              className="text-link"
              onClick={() => {
                setCategory('All')

                document
                  .getElementById('collection')
                  ?.scrollIntoView({
                    behavior: 'smooth',
                  })
              }}
            >
              View all →
            </button>
          </div>

          <div className="featured-grid">
            {featuredProducts.map(
              (product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              )
            )}
          </div>
        </section>
      )}

      {/* Collection */}
      <section
        id="collection"
        className="collection-section"
      >
        <div className="collection-header">
          <div>
            <span className="section-eyebrow">
              THE COLLECTION
            </span>

            <h2>Explore our products</h2>

            <p>
              {totalProducts} products available
            </p>
          </div>

          <div className="collection-controls">
            <button
              className="filter-toggle"
              onClick={() =>
                setShowFilters(
                  !showFilters
                )
              }
            >
              ☰ Filters
            </button>

            <select
              value={sort}
              onChange={(event) =>
                setSort(
                  event.target.value
                )
              }
              aria-label="Sort products"
            >
              <option value="featured">
                Featured
              </option>

              <option value="newest">
                Newest
              </option>

              <option value="price-low">
                Price: Low to high
              </option>

              <option value="price-high">
                Price: High to low
              </option>

              <option value="name">
                Name
              </option>
            </select>
          </div>
        </div>

        {/* Search + filters */}
        <div
          className={
            showFilters
              ? 'catalog-toolbar open'
              : 'catalog-toolbar'
          }
        >
          <div className="search-box">
            <span>⌕</span>

            <input
              type="search"
              placeholder="Search products..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="filter-options">
            {categories.map((item) => (
              <button
                key={item}
                className={
                  category === item
                    ? 'filter-chip active'
                    : 'filter-chip'
                }
                onClick={() =>
                  setCategory(item)
                }
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />

            <p>
              Loading collection...
            </p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <h3>No products found</h3>

            <p>
              Try another search or category.
            </p>

            <button
              onClick={() => {
                setSearch('')
                setCategory('All')
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <>
            <div className="products-grid">
              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                  />
                )
              )}
            </div>

            {/* See More Products */}
            {hasMoreProducts && (
              <div className="see-more-container">
                <button
                  className="see-more-button"
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                >
                  {loadingMore
                    ? 'Loading Products...'
                    : 'See More Products'}
                </button>

                <p className="products-count">
                  Showing {products.length}{' '}
                  of {totalProducts}{' '}
                  products
                </p>
              </div>
            )}

            {!hasMoreProducts &&
              totalProducts > 12 && (
                <p className="products-count all-products-shown">
                  All {totalProducts} products
                  are displayed.
                </p>
            )}
          </>
        )}
      </section>

      {/* Brand section */}
      <section className="brand-section">
        <div className="brand-section-inner">
          <span className="section-eyebrow">
            THE EXOTICA EXPERIENCE
          </span>

          <h2>
            Something different.
            <br />
            Something extraordinary.
          </h2>

          <p>
            Every product in our collection is selected
            with attention to quality, presentation and
            the experience it creates.
          </p>
        </div>
      </section>
    </div>
  )
}
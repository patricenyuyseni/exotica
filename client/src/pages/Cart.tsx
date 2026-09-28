
import React, { useEffect, useMemo, useState } from 'react'
import { apiUrl } from '../api'

type Product = {
  id: string
  name: string
  price: number
  image?: string
  stockQuantity?: number
  stock_quantity?: number
}

type CartItem = {
  id: string
  productId: string
  quantity: number
  product?: Product
}

type Customer = {
  name: string
  email: string
  phone: string
}

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [customer, setCustomer] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
  })

  const [notes, setNotes] = useState('')
  const [checkoutMessage, setCheckoutMessage] = useState('')
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  const getAuthHeaders = (
    includeContentType = false
  ): Record<string, string> => {
    const token = localStorage.getItem('auth_token')

    const headers: Record<string, string> = {}

    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }

  const loadCart = async () => {
    try {
      setLoading(true)

      const [cartResponse, productsResponse] =
        await Promise.all([
          fetch(apiUrl('/api/cart'), {
            headers: getAuthHeaders(),
          }),
          fetch(apiUrl('/api/products')),
        ])

      const cartData = await cartResponse.json()
      const productsData = await productsResponse.json()

      if (!cartResponse.ok) {
        throw new Error(
          cartData.message || 'Could not load cart'
        )
      }

      if (!productsResponse.ok) {
        throw new Error(
          productsData.message || 'Could not load products'
        )
      }

      const cartItems = cartData.data || []
      const products = productsData.data || []

      const enrichedItems = cartItems.map(
        (item: CartItem) => ({
          ...item,
          product: products.find(
            (product: Product) =>
              String(product.id) === String(item.productId)
          ),
        })
      )

      setItems(enrichedItems)
    } catch (error) {
      console.error('Load cart failed:', error)

      setCheckoutMessage(
        'Could not load your cart.'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCart()
  }, [])

  const updateQuantity = async (
    item: CartItem,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      return
    }

    const stock = Number(
      item.product?.stockQuantity ??
        item.product?.stock_quantity ??
        999999
    )

    if (newQuantity > stock) {
      setCheckoutMessage(
        `Only ${stock} item(s) available for ${
          item.product?.name || 'this product'
        }.`
      )
      return
    }

    try {
      setUpdatingId(item.id)
      setCheckoutMessage('')

      const response = await fetch(
        apiUrl(`/api/cart/${encodeURIComponent(item.id)}`),
        {
          method: 'PATCH',
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            quantity: newQuantity,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not update cart'
        )
      }

      setItems(currentItems =>
        currentItems.map(currentItem =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                quantity: newQuantity,
              }
            : currentItem
        )
      )

      window.dispatchEvent(
        new Event('cart-updated')
      )
    } catch (error) {
      console.error(
        'Update cart quantity failed:',
        error
      )

      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : 'Could not update cart'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const removeItem = async (item: CartItem) => {
    try {
      setUpdatingId(item.id)
      setCheckoutMessage('')

      const response = await fetch(
        apiUrl(`/api/cart/${encodeURIComponent(item.id)}`),
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.message || 'Could not remove item'
        )
      }

      setItems(currentItems =>
        currentItems.filter(
          currentItem => currentItem.id !== item.id
        )
      )

      window.dispatchEvent(
        new Event('cart-updated')
      )
    } catch (error) {
      console.error(
        'Remove cart item failed:',
        error
      )

      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : 'Could not remove cart item'
      )
    } finally {
      setUpdatingId(null)
    }
  }

  const subtotal = useMemo(() => {
    return items.reduce((total, item) => {
      const price = Number(
        item.product?.price || 0
      )

      return total + price * item.quantity
    }, 0)
  }, [items])

  const shipping = 0
  const tax = 0
  const total = subtotal + shipping + tax

  const handleCheckout = async () => {
    setCheckoutMessage('')

    if (items.length === 0) {
      setCheckoutMessage('Your cart is empty.')
      return
    }

    if (!customer.name.trim()) {
      setCheckoutMessage('Please enter your name.')
      return
    }

    if (!customer.email.trim()) {
      setCheckoutMessage('Please enter your email.')
      return
    }

    if (!customer.phone.trim()) {
      setCheckoutMessage(
        'Please enter your phone number.'
      )
      return
    }

    try {
      setCheckoutLoading(true)

      const response = await fetch(
        apiUrl('/api/orders'),
        {
          method: 'POST',
          headers: getAuthHeaders(true),
          body: JSON.stringify({
            customer: {
              name: customer.name.trim(),
              email: customer.email.trim(),
              phone: customer.phone.trim(),
            },
            notes: notes.trim(),
            items: items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
            })),
            shipping,
            tax,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Could not create order'
        )
      }

      setItems([])

      setCustomer({
        name: '',
        email: '',
        phone: '',
      })

      setNotes('')

      window.dispatchEvent(
        new Event('cart-updated')
      )

      setCheckoutMessage(
        `Order created successfully! Order #${data.data.id}`
      )
    } catch (error) {
      console.error('Checkout failed:', error)

      setCheckoutMessage(
        error instanceof Error
          ? error.message
          : 'Could not create order'
      )
    } finally {
      setCheckoutLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          maxWidth: 1100,
          margin: '0 auto',
          padding: '32px 20px',
        }}
      >
        <h1>Your Cart</h1>
        <p>Loading your cart...</p>
      </div>
    )
  }

  return (
    <div
      style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '24px 16px 60px',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <h1
        style={{
          fontSize: 32,
          marginBottom: 24,
        }}
      >
        Your Cart
      </h1>

      {items.length === 0 ? (
        <div
          style={{
            padding: 32,
            borderRadius: 12,
            background: '#0f1724',
            textAlign: 'center',
          }}
        >
          <h2>Your cart is empty</h2>

          <p>
            Add some products to your cart
            before checking out.
          </p>

          {checkoutMessage && (
            <p
              style={{
                marginTop: 16,
                color: '#10b981',
              }}
            >
              {checkoutMessage}
            </p>
          )}
        </div>
      ) : (
        <div
          className="cart-layout"
          style={{
            display: 'grid',
            gridTemplateColumns:
              'minmax(0, 1fr) 360px',
            gap: 28,
            alignItems: 'start',
          }}
        >
          <section>
            {items.map(item => {
              const product = item.product

              const price = Number(
                product?.price || 0
              )

              const lineTotal =
                price * item.quantity

              const isUpdating =
                updatingId === item.id

              return (
                <div
                  key={item.id}
                  className="cart-item"
                  style={{
                    display: 'grid',
                    gridTemplateColumns:
                      '100px minmax(0, 1fr) auto',
                    gap: 16,
                    padding: 16,
                    marginBottom: 14,
                    borderRadius: 14,
                    background: '#0f1724',
                    alignItems: 'center',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  {product?.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{
                        width: 100,
                        height: 100,
                        objectFit: 'cover',
                        borderRadius: 10,
                        display: 'block',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 10,
                        background: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        textAlign: 'center',
                      }}
                    >
                      No image
                    </div>
                  )}

                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    <h3
                      style={{
                        margin: '0 0 6px',
                        fontSize: 17,
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                      }}
                    >
                      {product?.name ||
                        item.productId}
                    </h3>

                    <p
                      style={{
                        margin: '0 0 12px',
                        opacity: 0.75,
                        fontSize: 14,
                      }}
                    >
                      ${price.toFixed(2)} each
                    </p>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          border:
                            '1px solid #334155',
                          borderRadius: 9,
                          overflow: 'hidden',
                        }}
                      >
                        <button
                          type="button"
                          disabled={
                            isUpdating ||
                            item.quantity <= 1
                          }
                          onClick={() =>
                            updateQuantity(
                              item,
                              item.quantity - 1
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            border: 0,
                            background:
                              '#1e293b',
                            color: '#fff',
                            fontSize: 20,
                            cursor:
                              isUpdating ||
                              item.quantity <= 1
                                ? 'not-allowed'
                                : 'pointer',
                          }}
                        >
                          −
                        </button>

                        <strong
                          style={{
                            minWidth: 38,
                            textAlign: 'center',
                          }}
                        >
                          {item.quantity}
                        </strong>

                        <button
                          type="button"
                          disabled={isUpdating}
                          onClick={() =>
                            updateQuantity(
                              item,
                              item.quantity + 1
                            )
                          }
                          style={{
                            width: 36,
                            height: 36,
                            border: 0,
                            background:
                              '#1e293b',
                            color: '#fff',
                            fontSize: 20,
                            cursor: isUpdating
                              ? 'not-allowed'
                              : 'pointer',
                          }}
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={isUpdating}
                        onClick={() =>
                          removeItem(item)
                        }
                        style={{
                          border: 0,
                          background:
                            'transparent',
                          color: '#f87171',
                          padding: '8px 4px',
                          fontSize: 14,
                          cursor: isUpdating
                            ? 'not-allowed'
                            : 'pointer',
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>

                  <strong
                    style={{
                      fontSize: 17,
                      whiteSpace: 'nowrap',
                      alignSelf: 'start',
                    }}
                  >
                    ${lineTotal.toFixed(2)}
                  </strong>
                </div>
              )
            })}
          </section>

          <aside
            className="cart-summary"
            style={{
              background: '#0f1724',
              borderRadius: 12,
              padding: 20,
              position: 'sticky',
              top: 20,
              boxSizing: 'border-box',
              width: '100%',
            }}
          >
            <h2 style={{ marginTop: 0 }}>
              Order Summary
            </h2>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span>Subtotal</span>
              <strong>
                ${subtotal.toFixed(2)}
              </strong>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 10,
              }}
            >
              <span>Shipping</span>
              <span>
                ${shipping.toFixed(2)}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <span>Tax</span>
              <span>
                ${tax.toFixed(2)}
              </span>
            </div>

            <hr
              style={{
                border: 0,
                borderTop:
                  '1px solid #334155',
                marginBottom: 16,
              }}
            />

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 20,
                marginBottom: 24,
              }}
            >
              <strong>Total</strong>

              <strong>
                ${total.toFixed(2)}
              </strong>
            </div>

            <h3>Customer Information</h3>

            <input
              type="text"
              placeholder="Full name"
              value={customer.name}
              onChange={event =>
                setCustomer({
                  ...customer,
                  name: event.target.value,
                })
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                border:
                  '1px solid #334155',
                background: '#020617',
                color: '#fff',
              }}
            />

            <input
              type="email"
              placeholder="Email address"
              value={customer.email}
              onChange={event =>
                setCustomer({
                  ...customer,
                  email: event.target.value,
                })
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                border:
                  '1px solid #334155',
                background: '#020617',
                color: '#fff',
              }}
            />

            <input
              type="tel"
              placeholder="Phone number"
              value={customer.phone}
              onChange={event =>
                setCustomer({
                  ...customer,
                  phone: event.target.value,
                })
              }
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginBottom: 10,
                borderRadius: 8,
                border:
                  '1px solid #334155',
                background: '#020617',
                color: '#fff',
              }}
            />

            <textarea
              placeholder="Order notes (optional)"
              value={notes}
              onChange={event =>
                setNotes(event.target.value)
              }
              rows={4}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: 12,
                marginBottom: 14,
                borderRadius: 8,
                border:
                  '1px solid #334155',
                background: '#020617',
                color: '#fff',
                resize: 'vertical',
              }}
            />

            <button
              type="button"
              disabled={checkoutLoading}
              onClick={handleCheckout}
              style={{
                width: '100%',
                padding: '13px 16px',
                border: 0,
                borderRadius: 8,
                background: '#10b981',
                color: '#fff',
                fontSize: 16,
                fontWeight: 700,
                cursor: checkoutLoading
                  ? 'not-allowed'
                  : 'pointer',
                opacity: checkoutLoading
                  ? 0.7
                  : 1,
              }}
            >
              {checkoutLoading
                ? 'Placing Order...'
                : 'Place Order'}
            </button>

            {checkoutMessage && (
              <p
                style={{
                  marginTop: 14,
                  lineHeight: 1.5,
                  color:
                    checkoutMessage.includes(
                      'successfully'
                    )
                      ? '#10b981'
                      : '#f87171',
                }}
              >
                {checkoutMessage}
              </p>
            )}
          </aside>
        </div>
      )}

      <style>{`
        @media (max-width: 700px) {
          .cart-layout {
            display: flex !important;
            flex-direction: column !important;
            gap: 18px !important;
          }

          .cart-layout > section {
            width: 100%;
          }

          .cart-item {
            grid-template-columns: 78px minmax(0, 1fr) !important;
            gap: 12px !important;
            padding: 12px !important;
            align-items: start !important;
          }

          .cart-item img,
          .cart-item > div:first-child {
            width: 78px !important;
            height: 78px !important;
          }

          .cart-item > strong {
            grid-column: 2;
            grid-row: 1;
            justify-self: end;
            font-size: 16px !important;
          }

          .cart-item-info {
            grid-column: 2;
          }

          .cart-item-actions {
            width: 100%;
          }

          .cart-summary {
            position: static !important;
            width: 100% !important;
          }
        }

        @media (max-width: 420px) {
          .cart-item {
            grid-template-columns: 68px minmax(0, 1fr) !important;
            gap: 10px !important;
            padding: 10px !important;
          }

          .cart-item img,
          .cart-item > div:first-child {
            width: 68px !important;
            height: 68px !important;
          }

          .cart-item h3 {
            font-size: 15px !important;
          }

          .cart-item button {
            touch-action: manipulation;
          }
        }
      `}</style>
    </div>
  )
}

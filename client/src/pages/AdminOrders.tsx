import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { apiUrl } from '../api'

type OrderItem = {
  id: string
  productId: string
  name: string | null
  price: number
  quantity: number
  lineTotal: number
}

type Customer = {
  name?: string
  email?: string
  phone?: string
  notes?: string
}

type Order = {
  id: string
  userId: string | null
  subtotal: number
  shipping: number
  tax: number
  total: number
  paymentStatus: string
  orderStatus: string
  customer: Customer | null
  createdAt: string
  items?: OrderItem[]
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedOrder, setSelectedOrder] =
    useState<Order | null>(null)

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError('')

      const token =
        localStorage.getItem('auth_token')

      const response = await fetch(apiUrl('/api/orders'), {
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Could not load orders'
        )
      }

      setOrders(data.data || [])
    } catch (err) {
      console.error('Load orders failed:', err)

      setError(
        err instanceof Error
          ? err.message
          : 'Could not load orders'
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [])

  const viewOrder = async (orderId: string) => {
    try {
      const token =
        localStorage.getItem('auth_token')

      const response = await fetch(
        apiUrl(`/api/orders/${orderId}`),
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        }
      )

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || 'Could not load order'
        )
      }

      setSelectedOrder(data.data)
    } catch (err) {
      console.error(
        'Load order details failed:',
        err
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Could not load order'
      )
    }
  }

  const formatMoney = (value: number) => {
    return `$${Number(value || 0).toFixed(2)}`
  }

  const formatDate = (value: string) => {
    return new Date(value).toLocaleString()
  }

  return (
    <AdminLayout>
      <div
        style={{
          minHeight: '100vh',
          color: '#f5f5f5',
        }}
      >
        {loading ? (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
            }}
          >
            <h1>Orders</h1>
            <p style={{ color: '#9ca3af' }}>
              Loading orders...
            </p>
          </div>
        ) : (
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
            }}
          >
            {/* HEADER */}

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 28,
                gap: 16,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#8b5cf6',
                    fontWeight: 700,
                    letterSpacing: '1.5px',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Store Management
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 32,
                    fontWeight: 800,
                  }}
                >
                  Orders
                </h1>

                <p
                  style={{
                    marginTop: 8,
                    color: '#9ca3af',
                  }}
                >
                  Manage customer orders and
                  order details.
                </p>
              </div>

              <button
                type="button"
                onClick={loadOrders}
                disabled={loading}
                style={{
                  padding: '11px 18px',
                  border: '1px solid #35353d',
                  borderRadius: 8,
                  background: '#17171d',
                  color: '#fff',
                  cursor: 'pointer',
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {/* ERROR */}

            {error && (
              <div
                style={{
                  padding: 14,
                  marginBottom: 20,
                  borderRadius: 10,
                  background: '#451a1a',
                  border:
                    '1px solid #7f1d1d',
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            {/* ORDER STATS */}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(3, minmax(0, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div style={statCardStyle}>
                <span style={statLabelStyle}>
                  Total Orders
                </span>

                <strong style={statValueStyle}>
                  {orders.length}
                </strong>
              </div>

              <div style={statCardStyle}>
                <span style={statLabelStyle}>
                  Pending
                </span>

                <strong style={statValueStyle}>
                  {
                    orders.filter(
                      (order) =>
                        order.orderStatus ===
                        'pending'
                    ).length
                  }
                </strong>
              </div>

              <div style={statCardStyle}>
                <span style={statLabelStyle}>
                  Revenue
                </span>

                <strong style={statValueStyle}>
                  {formatMoney(
                    orders.reduce(
                      (total, order) =>
                        total +
                        Number(order.total || 0),
                      0
                    )
                  )}
                </strong>
              </div>
            </div>

            {/* ORDERS */}

            {orders.length === 0 ? (
              <div
                style={{
                  padding: 50,
                  textAlign: 'center',
                  background: '#141419',
                  borderRadius: 14,
                  border:
                    '1px solid #292930',
                }}
              >
                <div
                  style={{
                    fontSize: 40,
                    marginBottom: 12,
                  }}
                >
                  📦
                </div>

                <h2
                  style={{
                    margin: 0,
                  }}
                >
                  No orders yet
                </h2>

                <p
                  style={{
                    color: '#888',
                  }}
                >
                  Customer orders will appear
                  here.
                </p>
              </div>
            ) : (
              <div
                style={{
                  overflowX: 'auto',
                  background: '#141419',
                  border:
                    '1px solid #292930',
                  borderRadius: 14,
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse:
                      'collapse',
                    minWidth: 900,
                  }}
                >
                  <thead>
                    <tr>
                      <th style={thStyle}>
                        Order
                      </th>

                      <th style={thStyle}>
                        Customer
                      </th>

                      <th style={thStyle}>
                        Total
                      </th>

                      <th style={thStyle}>
                        Payment
                      </th>

                      <th style={thStyle}>
                        Status
                      </th>

                      <th style={thStyle}>
                        Date
                      </th>

                      <th style={thStyle}>
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td style={tdStyle}>
                          <strong>
                            #
                            {order.id.slice(
                              0,
                              8
                            )}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {order.customer
                              ?.name ||
                              'Guest'}
                          </strong>

                          <div
                            style={{
                              fontSize: 13,
                              color:
                                '#888',
                              marginTop: 4,
                            }}
                          >
                            {order.customer
                              ?.email ||
                              'No email'}
                          </div>

                          {order.customer
                            ?.phone && (
                            <div
                              style={{
                                fontSize: 12,
                                color:
                                  '#666',
                                marginTop: 3,
                              }}
                            >
                              {
                                order
                                  .customer
                                  .phone
                              }
                            </div>
                          )}
                        </td>

                        <td style={tdStyle}>
                          <strong>
                            {formatMoney(
                              order.total
                            )}
                          </strong>
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              order.paymentStatus
                            }
                          />
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            value={
                              order.orderStatus
                            }
                          />
                        </td>

                        <td style={tdStyle}>
                          {formatDate(
                            order.createdAt
                          )}
                        </td>

                        <td style={tdStyle}>
                          <button
                            type="button"
                            onClick={() =>
                              viewOrder(
                                order.id
                              )
                            }
                            style={{
                              padding:
                                '8px 14px',
                              border:
                                '1px solid #35353d',
                              borderRadius: 8,
                              background:
                                '#1b1b22',
                              color:
                                '#fff',
                              cursor:
                                'pointer',
                            }}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ORDER MODAL */}

            {selectedOrder && (
              <div
                style={{
                  position: 'fixed',
                  inset: 0,
                  background:
                    'rgba(0, 0, 0, 0.78)',
                  display: 'flex',
                  alignItems:
                    'center',
                  justifyContent:
                    'center',
                  padding: 20,
                  zIndex: 1000,
                }}
                onClick={() =>
                  setSelectedOrder(null)
                }
              >
                <div
                  style={{
                    width: '100%',
                    maxWidth: 720,
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    background:
                      '#0f0f14',
                    border:
                      '1px solid #292930',
                    borderRadius: 16,
                    padding: 26,
                    boxShadow:
                      '0 25px 80px rgba(0,0,0,.5)',
                  }}
                  onClick={(event) =>
                    event.stopPropagation()
                  }
                >
                  {/* MODAL HEADER */}

                  <div
                    style={{
                      display:
                        'flex',
                      justifyContent:
                        'space-between',
                      alignItems:
                        'center',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          color:
                            '#8b5cf6',
                          fontWeight: 700,
                          textTransform:
                            'uppercase',
                          letterSpacing:
                            '1px',
                        }}
                      >
                        Order Details
                      </div>

                      <h2
                        style={{
                          margin:
                            '5px 0 0',
                        }}
                      >
                        #
                        {
                          selectedOrder.id
                        }
                      </h2>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setSelectedOrder(
                          null
                        )
                      }
                      style={{
                        border: 0,
                        background:
                          '#24242c',
                        color: '#fff',
                        borderRadius:
                          8,
                        padding:
                          '8px 12px',
                        cursor:
                          'pointer',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  <hr
                    style={{
                      border: 0,
                      borderTop:
                        '1px solid #292930',
                      margin:
                        '20px 0',
                    }}
                  />

                  {/* CUSTOMER */}

                  <div
                    style={{
                      background:
                        '#141419',
                      border:
                        '1px solid #292930',
                      borderRadius:
                        12,
                      padding: 18,
                    }}
                  >
                    <h3
                      style={{
                        marginTop: 0,
                      }}
                    >
                      Customer
                    </h3>

                    <p>
                      <strong>
                        Name:
                      </strong>{' '}
                      {selectedOrder
                        .customer
                        ?.name ||
                        'Guest'}
                    </p>

                    <p>
                      <strong>
                        Email:
                      </strong>{' '}
                      {selectedOrder
                        .customer
                        ?.email ||
                        '—'}
                    </p>

                    <p>
                      <strong>
                        Phone:
                      </strong>{' '}
                      {selectedOrder
                        .customer
                        ?.phone ||
                        '—'}
                    </p>

                    {selectedOrder
                      .customer
                      ?.notes && (
                      <p>
                        <strong>
                          Notes:
                        </strong>{' '}
                        {
                          selectedOrder
                            .customer
                            .notes
                        }
                      </p>
                    )}
                  </div>

                  {/* PRODUCTS */}

                  <h3
                    style={{
                      marginTop: 28,
                    }}
                  >
                    Products
                  </h3>

                  <div
                    style={{
                      background:
                        '#141419',
                      border:
                        '1px solid #292930',
                      borderRadius:
                        12,
                      overflow:
                        'hidden',
                    }}
                  >
                    {(
                      selectedOrder.items ||
                      []
                    ).map((item) => (
                      <div
                        key={
                          item.id
                        }
                        style={{
                          display:
                            'flex',
                          justifyContent:
                            'space-between',
                          gap: 16,
                          padding:
                            '15px 18px',
                          borderBottom:
                            '1px solid #292930',
                        }}
                      >
                        <div>
                          <strong>
                            {item.name ||
                              item.productId}
                          </strong>

                          <div
                            style={{
                              fontSize: 13,
                              color:
                                '#888',
                              marginTop: 5,
                            }}
                          >
                            {
                              item.quantity
                            }{' '}
                            ×{' '}
                            {formatMoney(
                              item.price
                            )}
                          </div>
                        </div>

                        <strong>
                          {formatMoney(
                            Number(
                              item.price
                            ) *
                              Number(
                                item.quantity
                              )
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>

                  {/* SUMMARY */}

                  <div
                    style={{
                      marginTop: 24,
                      background:
                        '#141419',
                      border:
                        '1px solid #292930',
                      borderRadius:
                        12,
                      padding: 18,
                    }}
                  >
                    <SummaryRow
                      label="Subtotal"
                      value={formatMoney(
                        selectedOrder.subtotal
                      )}
                    />

                    <SummaryRow
                      label="Shipping"
                      value={formatMoney(
                        selectedOrder.shipping
                      )}
                    />

                    <SummaryRow
                      label="Tax"
                      value={formatMoney(
                        selectedOrder.tax
                      )}
                    />

                    <div
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        marginTop: 14,
                        paddingTop: 14,
                        borderTop:
                          '1px solid #35353d',
                        fontSize: 21,
                      }}
                    >
                      <strong>
                        Total
                      </strong>

                      <strong
                        style={{
                          color:
                            '#c4b5fd',
                        }}
                      >
                        {formatMoney(
                          selectedOrder.total
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

function StatusBadge({
  value,
}: {
  value: string
}) {
  const normalized =
    value?.toLowerCase() || 'unknown'

  let background = '#1e293b'
  let color = '#cbd5e1'

  if (
    normalized === 'paid' ||
    normalized === 'completed' ||
    normalized === 'delivered'
  ) {
    background = '#052e16'
    color = '#86efac'
  }

  if (
    normalized === 'pending' ||
    normalized === 'processing'
  ) {
    background = '#422006'
    color = '#fdba74'
  }

  if (
    normalized === 'cancelled' ||
    normalized === 'failed'
  ) {
    background = '#450a0a'
    color = '#fca5a5'
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '5px 10px',
        borderRadius: 999,
        background,
        color,
        fontSize: 12,
        textTransform:
          'capitalize',
        fontWeight: 600,
      }}
    >
      {value || 'Unknown'}
    </span>
  )
}

function SummaryRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent:
          'space-between',
        marginBottom: 10,
        color: '#c4c4cc',
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )
}

const statCardStyle: React.CSSProperties = {
  background: '#141419',
  border: '1px solid #292930',
  borderRadius: 12,
  padding: 20,
}

const statLabelStyle: React.CSSProperties = {
  display: 'block',
  color: '#888',
  fontSize: 13,
  marginBottom: 8,
}

const statValueStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 800,
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '15px 16px',
  borderBottom: '1px solid #292930',
  color: '#888',
  fontSize: 12,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
}

const tdStyle: React.CSSProperties = {
  padding: '16px',
  borderBottom: '1px solid #202027',
}
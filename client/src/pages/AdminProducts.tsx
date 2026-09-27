
import React, { useEffect, useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import { apiUrl } from '../api'

type Product = {
  id: string
  name: string
  slug: string
  description?: string
  categoryId?: string | null
  price: number
  compareAtPrice?: number | null
  image?: string
  images?: string[]
  stockQuantity?: number
  sku?: string
  rating?: number
  reviewCount?: number
  featured?: boolean
  active?: boolean
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  categoryId: '',
  price: '',
  compareAtPrice: '',
  sku: '',
  stockQuantity: '0',
  featured: false,
  active: true,
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [generatingDescription, setGeneratingDescription] =
    useState(false)

  const [form, setForm] = useState(emptyForm)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [editing, setEditing] = useState<Product | null>(null)

  function getToken() {
    return (
      localStorage.getItem('auth_token') ||
      localStorage.getItem('admin_token') ||
      ''
    )
  }

  function authHeaders(): Record<string, string> {
    const token = getToken()

    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}
  }

  async function loadProducts() {
    setLoading(true)

    try {
      const res = await fetch(
        apiUrl('/api/admin/products'),
        {
          headers: authHeaders(),
        }
      )

      const data = await res.json()

      if (res.status === 401) {
        alert('You are not logged in. Please login again.')
        return
      }

      if (res.status === 403) {
        alert('You do not have administrator access.')
        return
      }

      if (data.success) {
        setProducts(data.data || [])
      } else {
        alert(data.message || 'Unable to load products')
      }
    } catch (error) {
      console.error(error)
      alert('Unable to connect to the server')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  function updateForm(
    field: keyof typeof emptyForm,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const selectedFile = event.target.files?.[0] || null

    setFile(selectedFile)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    if (selectedFile) {
      setPreviewUrl(URL.createObjectURL(selectedFile))
    } else {
      setPreviewUrl(null)
    }
  }

  function resetForm() {
    setForm(emptyForm)
    setFile(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(null)
  }

  function generateSlug() {
    const slug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')

    updateForm('slug', slug)
  }

  async function generateDescription() {
    if (!form.name.trim()) {
      alert('Enter the product name first.')
      return
    }

    if (!getToken()) {
      alert('Please login first.')
      return
    }

    setGeneratingDescription(true)

    try {
      const res = await fetch(
        apiUrl('/api/admin/products/generate-description'),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders(),
          },
          body: JSON.stringify({
            name: form.name,
            categoryId: form.categoryId,
            price: form.price,
            sku: form.sku,
          }),
        }
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(
          data.message ||
            'Unable to generate description'
        )
        return
      }

      updateForm(
        'description',
        data.description || ''
      )
    } catch (error) {
      console.error(
        'Generate description error:',
        error
      )

      alert(
        'Unable to generate product description'
      )
    } finally {
      setGeneratingDescription(false)
    }
  }

  async function handleCreate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!getToken()) {
      alert('Please login first.')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('name', form.name)
      formData.append('slug', form.slug)
      formData.append('description', form.description)
      formData.append('categoryId', form.categoryId)
      formData.append('price', form.price)
      formData.append('compareAtPrice', form.compareAtPrice)
      formData.append('sku', form.sku)
      formData.append('stockQuantity', form.stockQuantity)
      formData.append('featured', String(form.featured))
      formData.append('active', String(form.active))

      if (file) {
        formData.append('images', file)
      }

      const res = await fetch(
        apiUrl('/api/admin/products'),
        {
          method: 'POST',
          headers: authHeaders(),
          body: formData,
        }
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(
          data.message ||
            'Unable to create product'
        )
        return
      }

      alert('Product created successfully')

      resetForm()
      await loadProducts()
    } catch (error) {
      console.error(error)
      alert('Unable to create product')
    } finally {
      setSaving(false)
    }
  }

  function startEdit(product: Product) {
    setEditing(product)

    setForm({
      name: product.name || '',
      slug: product.slug || '',
      description: product.description || '',
      categoryId: product.categoryId || '',
      price: String(product.price ?? ''),
      compareAtPrice:
        product.compareAtPrice != null
          ? String(product.compareAtPrice)
          : '',
      sku: product.sku || '',
      stockQuantity: String(
        product.stockQuantity ?? 0
      ),
      featured: Boolean(product.featured),
      active: product.active !== false,
    })

    setFile(null)

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    setPreviewUrl(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  async function handleUpdate(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    if (!editing) {
      return
    }

    if (!getToken()) {
      alert('Please login first.')
      return
    }

    setSaving(true)

    try {
      const formData = new FormData()

      formData.append('name', form.name)
      formData.append('slug', form.slug)
      formData.append('description', form.description)
      formData.append('categoryId', form.categoryId)
      formData.append('price', form.price)
      formData.append(
        'compareAtPrice',
        form.compareAtPrice
      )
      formData.append('sku', form.sku)
      formData.append(
        'stockQuantity',
        form.stockQuantity
      )
      formData.append(
        'featured',
        String(form.featured)
      )
      formData.append(
        'active',
        String(form.active)
      )

      if (file) {
        formData.append('images', file)
      }

      const res = await fetch(
        apiUrl(`/api/admin/products/${editing.id}`),
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: formData,
        }
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(
          data.message ||
            'Unable to update product'
        )
        return
      }

      alert('Product updated successfully')

      setEditing(null)
      resetForm()

      await loadProducts()
    } catch (error) {
      console.error(error)
      alert('Unable to update product')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this product?'
    )

    if (!confirmed) {
      return
    }

    if (!getToken()) {
      alert('Please login first.')
      return
    }

    try {
      const res = await fetch(
        apiUrl(`/api/admin/products/${id}`),
        {
          method: 'DELETE',
          headers: authHeaders(),
        }
      )

      const data = await res.json()

      if (!res.ok || !data.success) {
        alert(
          data.message ||
            'Unable to delete product'
        )
        return
      }

      if (editing?.id === id) {
        setEditing(null)
        resetForm()
      }

      await loadProducts()
    } catch (error) {
      console.error(error)
      alert('Unable to delete product')
    }
  }

  function cancelEdit() {
    setEditing(null)
    resetForm()
  }

  return (
    <AdminLayout>
      <div
        style={{
          minHeight: '100vh',
          padding: '0',
          background: '#0b0b0f',
          color: '#f5f5f5',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 32,
              gap: 16,
            }}
          >
            <div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 800,
                }}
              >
                Product Management
              </h1>

              <p
                style={{
                  marginTop: 8,
                  color: '#9ca3af',
                }}
              >
                Create, edit and manage your store products.
              </p>
            </div>

            <button
              type="button"
              onClick={loadProducts}
              disabled={loading}
              style={{
                padding: '11px 18px',
                borderRadius: 8,
                border: '1px solid #333',
                background: '#17171d',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          <section
            style={{
              background: '#141419',
              border: '1px solid #292930',
              borderRadius: 14,
              padding: 24,
              marginBottom: 40,
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                }}
              >
                {editing
                  ? `Edit Product: ${editing.name}`
                  : 'Create New Product'}
              </h2>

              <p
                style={{
                  marginTop: 6,
                  color: '#888',
                  fontSize: 14,
                }}
              >
                Add the information customers will see in your store.
              </p>
            </div>

            <form
              onSubmit={
                editing ? handleUpdate : handleCreate
              }
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'minmax(0, 2fr) minmax(280px, 1fr)',
                  gap: 32,
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 20,
                  }}
                >
                  <div>
                    <h3 style={{ marginBottom: 14 }}>
                      Basic Information
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gap: 14,
                      }}
                    >
                      <label>
                        <span style={labelStyle}>
                          Product name
                        </span>

                        <input
                          value={form.name}
                          onChange={(e) =>
                            updateForm(
                              'name',
                              e.target.value
                            )
                          }
                          required
                          placeholder="Example: Moonlight"
                          style={inputStyle}
                        />
                      </label>

                      <label>
                        <span style={labelStyle}>
                          Slug
                        </span>

                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                          }}
                        >
                          <input
                            value={form.slug}
                            onChange={(e) =>
                              updateForm(
                                'slug',
                                e.target.value
                              )
                            }
                            required
                            placeholder="moonlight"
                            style={inputStyle}
                          />

                          <button
                            type="button"
                            onClick={generateSlug}
                            style={secondaryButtonStyle}
                          >
                            Generate
                          </button>
                        </div>
                      </label>

                      <label>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent:
                              'space-between',
                            alignItems: 'center',
                            gap: 12,
                            marginBottom: 7,
                          }}
                        >
                          <span
                            style={{
                              ...labelStyle,
                              marginBottom: 0,
                            }}
                          >
                            Description
                          </span>

                          <button
                            type="button"
                            onClick={
                              generateDescription
                            }
                            disabled={
                              generatingDescription ||
                              !form.name.trim()
                            }
                            style={{
                              padding: '8px 12px',
                              borderRadius: 7,
                              border:
                                '1px solid rgba(167, 139, 250, 0.4)',
                              background:
                                generatingDescription
                                  ? '#25202f'
                                  : '#1d1530',
                              color: '#c4b5fd',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor:
                                generatingDescription ||
                                !form.name.trim()
                                  ? 'not-allowed'
                                  : 'pointer',
                              opacity:
                                !form.name.trim()
                                  ? 0.5
                                  : 1,
                            }}
                          >
                            {generatingDescription
                              ? '✨ Generating...'
                              : '✨ Generate Description'}
                          </button>
                        </div>

                        <textarea
                          value={form.description}
                          onChange={(e) =>
                            updateForm(
                              'description',
                              e.target.value
                            )
                          }
                          rows={6}
                          placeholder="Enter a description or generate one automatically..."
                          style={{
                            ...inputStyle,
                            resize: 'vertical',
                          }}
                        />

                        <p
                          style={{
                            marginTop: 7,
                            marginBottom: 0,
                            color: '#666',
                            fontSize: 12,
                          }}
                        >
                          Enter the product name, then click
                          "Generate Description" to create a
                          description automatically.
                        </p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: 14 }}>
                      Pricing & Inventory
                    </h3>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          'repeat(2, minmax(0, 1fr))',
                        gap: 14,
                      }}
                    >
                      <label>
                        <span style={labelStyle}>
                          Price
                        </span>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.price}
                          onChange={(e) =>
                            updateForm(
                              'price',
                              e.target.value
                            )
                          }
                          required
                          placeholder="0.00"
                          style={inputStyle}
                        />
                      </label>

                      <label>
                        <span style={labelStyle}>
                          Compare-at price
                        </span>

                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={form.compareAtPrice}
                          onChange={(e) =>
                            updateForm(
                              'compareAtPrice',
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                          style={inputStyle}
                        />
                      </label>

                      <label>
                        <span style={labelStyle}>
                          SKU
                        </span>

                        <input
                          value={form.sku}
                          onChange={(e) =>
                            updateForm(
                              'sku',
                              e.target.value
                            )
                          }
                          required
                          placeholder="EX-PROD-001"
                          style={inputStyle}
                        />
                      </label>

                      <label>
                        <span style={labelStyle}>
                          Stock quantity
                        </span>

                        <input
                          type="number"
                          min="0"
                          value={form.stockQuantity}
                          onChange={(e) =>
                            updateForm(
                              'stockQuantity',
                              e.target.value
                            )
                          }
                          style={inputStyle}
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: 14 }}>
                      Organization
                    </h3>

                    <label>
                      <span style={labelStyle}>
                        Category ID
                      </span>

                      <input
                        value={form.categoryId}
                        onChange={(e) =>
                          updateForm(
                            'categoryId',
                            e.target.value
                          )
                        }
                        placeholder="Category ID"
                        style={inputStyle}
                      />
                    </label>
                  </div>

                  <div>
                    <h3 style={{ marginBottom: 14 }}>
                      Product Status
                    </h3>

                    <div
                      style={{
                        display: 'flex',
                        gap: 24,
                        flexWrap: 'wrap',
                      }}
                    >
                      <label
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.active}
                          onChange={(e) =>
                            updateForm(
                              'active',
                              e.target.checked
                            )
                          }
                        />

                        <span>
                          Active product
                        </span>
                      </label>

                      <label
                        style={{
                          display: 'flex',
                          gap: 10,
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(e) =>
                            updateForm(
                              'featured',
                              e.target.checked
                            )
                          }
                        />

                        <span>
                          Featured product
                        </span>
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 style={{ marginBottom: 14 }}>
                    Product Image
                  </h3>

                  <div
                    style={{
                      border: '1px dashed #444',
                      borderRadius: 12,
                      padding: 20,
                      background: '#0f0f14',
                    }}
                  >
                    {(previewUrl ||
                      editing?.image) && (
                      <img
                        src={
                          previewUrl ||
                          editing?.image ||
                          '/images/products/placeholder.jpg'
                        }
                        alt="Product preview"
                        style={{
                          width: '100%',
                          height: 280,
                          objectFit: 'cover',
                          borderRadius: 10,
                          marginBottom: 16,
                        }}
                        onError={(e) => {
                          e.currentTarget.src =
                            '/images/products/placeholder.jpg'
                        }}
                      />
                    )}

                    {!previewUrl && !editing?.image && (
                      <div
                        style={{
                          height: 280,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 10,
                          background: '#18181f',
                          color: '#777',
                          marginBottom: 16,
                        }}
                      >
                        No image selected
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={handleImageChange}
                      style={{
                        width: '100%',
                      }}
                    />

                    <p
                      style={{
                        color: '#777',
                        fontSize: 12,
                        marginTop: 10,
                      }}
                    >
                      PNG, JPG, WEBP or GIF
                    </p>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: 10,
                  marginTop: 28,
                  paddingTop: 20,
                  borderTop: '1px solid #292930',
                }}
              >
                {editing && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    style={secondaryButtonStyle}
                  >
                    Cancel
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 0,
                    background: '#7c3aed',
                    color: '#fff',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {saving
                    ? 'Saving...'
                    : editing
                      ? 'Save Changes'
                      : 'Create Product'}
                </button>
              </div>
            </form>
          </section>

          <section>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 24,
                  }}
                >
                  Existing Products
                </h2>

                <p
                  style={{
                    color: '#777',
                    marginTop: 6,
                  }}
                >
                  {products.length} product
                  {products.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {products.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                  background: '#141419',
                  borderRadius: 12,
                  border: '1px solid #292930',
                  color: '#888',
                }}
              >
                No products found.
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 20,
                }}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    style={{
                      background: '#141419',
                      border: '1px solid #292930',
                      borderRadius: 12,
                      overflow: 'hidden',
                    }}
                  >
                    <img
                      src={
                        product.image ||
                        '/images/products/placeholder.jpg'
                      }
                      alt={product.name}
                      style={{
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                      }}
                      onError={(e) => {
                        e.currentTarget.src =
                          '/images/products/placeholder.jpg'
                      }}
                    />

                    <div style={{ padding: 18 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent:
                            'space-between',
                          gap: 10,
                        }}
                      >
                        <h3
                          style={{
                            margin: 0,
                            fontSize: 18,
                          }}
                        >
                          {product.name}
                        </h3>

                        {product.featured && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: '4px 7px',
                              borderRadius: 6,
                              background: '#7c3aed',
                              color: '#fff',
                            }}
                          >
                            Featured
                          </span>
                        )}
                      </div>

                      <p
                        style={{
                          color: '#888',
                          fontSize: 13,
                          margin: '8px 0',
                        }}
                      >
                        {product.sku || 'No SKU'}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 10,
                        }}
                      >
                        <strong
                          style={{
                            fontSize: 20,
                          }}
                        >
                          $
                          {Number(
                            product.price || 0
                          ).toFixed(2)}
                        </strong>

                        {product.compareAtPrice &&
                          product.compareAtPrice >
                            product.price && (
                            <span
                              style={{
                                color: '#777',
                                textDecoration:
                                  'line-through',
                                fontSize: 14,
                              }}
                            >
                              $
                              {Number(
                                product.compareAtPrice
                              ).toFixed(2)}
                            </span>
                          )}
                      </div>

                      <p
                        style={{
                          fontSize: 13,
                          color:
                            (product.stockQuantity ||
                              0) > 0
                              ? '#9ca3af'
                              : '#ef4444',
                        }}
                      >
                        Stock:{' '}
                        {product.stockQuantity || 0}
                      </p>

                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginTop: 16,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            startEdit(product)
                          }
                          style={{
                            ...secondaryButtonStyle,
                            flex: 1,
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDelete(product.id)
                          }
                          style={{
                            flex: 1,
                            padding: '10px 14px',
                            borderRadius: 8,
                            border:
                              '1px solid #7f1d1d',
                            background: '#2a1010',
                            color: '#fca5a5',
                            cursor: 'pointer',
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </AdminLayout>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 7,
  fontSize: 13,
  fontWeight: 600,
  color: '#d1d5db',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 12px',
  borderRadius: 8,
  border: '1px solid #35353d',
  background: '#0f0f14',
  color: '#fff',
  outline: 'none',
}

const secondaryButtonStyle: React.CSSProperties = {
  padding: '10px 16px',
  borderRadius: 8,
  border: '1px solid #35353d',
  background: '#1b1b22',
  color: '#fff',
  cursor: 'pointer',
}

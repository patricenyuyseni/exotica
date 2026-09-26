import { Router } from 'express'
import { Resend } from 'resend'
import db from '../db/index.js'
import fsdb from '../utils/fsdb.js'
import { v4 as uuidv4 } from 'uuid'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/\</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/*
  CREATE ORDER
*/

router.post('/', async (req, res) => {
  const {
    userId = 'guest',
    items = [],
    shipping = 0,
    tax = 0,
    customer = {},
    notes = '',
  } = req.body

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No items in order',
    })
  }

  const customerName = String(
    customer?.name || ''
  ).trim()

  const customerEmail = String(
    customer?.email || ''
  ).trim()

  const customerPhone = String(
    customer?.phone || ''
  ).trim()

  if (!customerName) {
    return res.status(400).json({
      success: false,
      message: 'Customer name is required',
    })
  }

  if (!customerEmail) {
    return res.status(400).json({
      success: false,
      message: 'Customer email is required',
    })
  }

  if (!customerPhone) {
    return res.status(400).json({
      success: false,
      message: 'Customer phone is required',
    })
  }

  const emailPattern =
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailPattern.test(customerEmail)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid customer email',
    })
  }

  const databaseUserId =
    String(userId) !== 'guest'
      ? String(userId)
      : null

  const shippingAmount = Number(shipping || 0)
  const taxAmount = Number(tax || 0)

  if (
    !Number.isFinite(shippingAmount) ||
    shippingAmount < 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid shipping amount',
    })
  }

  if (
    !Number.isFinite(taxAmount) ||
    taxAmount < 0
  ) {
    return res.status(400).json({
      success: false,
      message: 'Invalid tax amount',
    })
  }

  const client = await db.pool.connect()

  let orderId = ''

  try {
    await client.query('BEGIN')

    const verifiedItems: Array<{
      productId: string
      name: string
      price: number
      quantity: number
      lineTotal: number
    }> = []

    let subtotal = 0

    for (const item of items) {
      const productId = String(
        item.productId || ''
      )

      const quantity = Number(
        item.quantity || 0
      )

      if (!productId) {
        throw new Error(
          'Product ID is missing'
        )
      }

      if (
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        throw new Error(
          `Invalid quantity for product ${productId}`
        )
      }

      const productResult =
        await client.query(
          `
            SELECT
              id,
              name,
              price,
              stock_quantity
            FROM products
            WHERE id = $1
            FOR UPDATE
          `,
          [productId]
        )

      if (productResult.rowCount === 0) {
        throw new Error(
          `Product ${productId} not found`
        )
      }

      const product = productResult.rows[0]

      const stock = Number(
        product.stock_quantity
      )

      const price = Number(product.price)

      if (stock < quantity) {
        throw new Error(
          `Insufficient stock for ${product.name}`
        )
      }

      const lineTotal = Number(
        (price * quantity).toFixed(2)
      )

      subtotal += lineTotal

      verifiedItems.push({
        productId: String(product.id),
        name: String(product.name),
        price,
        quantity,
        lineTotal,
      })

      await client.query(
        `
          UPDATE products
          SET
            stock_quantity = stock_quantity - $1,
            updated_at = NOW()
          WHERE id = $2
        `,
        [quantity, productId]
      )
    }

    subtotal = Number(
      subtotal.toFixed(2)
    )

    const total = Number(
      (
        subtotal +
        shippingAmount +
        taxAmount
      ).toFixed(2)
    )

    orderId = uuidv4()

    const customerInformation = {
      name: customerName,
      email: customerEmail,
      phone: customerPhone,
      notes: String(notes || ''),
    }

    await client.query(
      `
        INSERT INTO orders
          (
            id,
            user_id,
            subtotal,
            shipping,
            tax,
            total,
            payment_status,
            order_status,
            shipping_address,
            created_at,
            updated_at
          )
        VALUES
          (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'pending',
            'processing',
            $7,
            NOW(),
            NOW()
          )
      `,
      [
        orderId,
        databaseUserId,
        subtotal,
        shippingAmount,
        taxAmount,
        total,
        JSON.stringify(
          customerInformation
        ),
      ]
    )

    for (const item of verifiedItems) {
      await client.query(
        `
          INSERT INTO order_items
            (
              order_id,
              product_id,
              price,
              quantity,
              created_at
            )
          VALUES
            (
              $1,
              $2,
              $3,
              $4,
              NOW()
            )
        `,
        [
          orderId,
          item.productId,
          item.price,
          item.quantity,
        ]
      )
    }

    if (String(userId) === 'guest') {
      const carts = fsdb.readJSON(
        'carts.json'
      )

      const purchasedProductIds =
        new Set(
          verifiedItems.map(
            item => item.productId
          )
        )

      const remainingCarts =
        carts.filter(
          (cartItem: any) =>
            !(
              cartItem.userId === 'guest' &&
              purchasedProductIds.has(
                String(
                  cartItem.productId
                )
              )
            )
        )

      fsdb.writeJSON(
        'carts.json',
        remainingCarts
      )
    } else {
      await client.query(
        `
          DELETE FROM cart_items
          WHERE user_id = $1
        `,
        [databaseUserId]
      )
    }

    await client.query('COMMIT')

    if (
      resend &&
      process.env.ORDER_EMAIL
    ) {
      const itemRows =
        verifiedItems
          .map(
            item => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #ddd;">
                  ${escapeHtml(item.name)}
                </td>

                <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">
                  ${item.quantity}
                </td>

                <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">
                  $${item.price.toFixed(2)}
                </td>

                <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">
                  $${item.lineTotal.toFixed(2)}
                </td>
              </tr>
            `
          )
          .join('')

      try {
        await resend.emails.send({
          from:
            'Exotica Orders <onboarding@resend.dev>',

          to: [process.env.ORDER_EMAIL],

          replyTo: customerEmail,

          subject:
            `New Order #${orderId}`,

          html: `
            <div style="font-family:Arial,sans-serif;max-width:700px;margin:auto;">

              <h1>New Order</h1>

              <p>
                <strong>Order ID:</strong>
                ${escapeHtml(orderId)}
              </p>

              <h2>Customer</h2>

              <p>
                <strong>Name:</strong>
                ${escapeHtml(customerName)}
              </p>

              <p>
                <strong>Email:</strong>
                ${escapeHtml(customerEmail)}
              </p>

              <p>
                <strong>Phone:</strong>
                ${escapeHtml(customerPhone)}
              </p>

              ${
                notes
                  ? `
                    <p>
                      <strong>Notes:</strong>
                      ${escapeHtml(notes)}
                    </p>
                  `
                  : ''
              }

              <h2>Order Items</h2>

              <table
                style="width:100%;border-collapse:collapse;"
              >
                <thead>
                  <tr>
                    <th style="padding:8px;text-align:left;border-bottom:2px solid #222;">
                      Product
                    </th>

                    <th style="padding:8px;text-align:center;border-bottom:2px solid #222;">
                      Qty
                    </th>

                    <th style="padding:8px;text-align:right;border-bottom:2px solid #222;">
                      Price
                    </th>

                    <th style="padding:8px;text-align:right;border-bottom:2px solid #222;">
                      Total
                    </th>
                  </tr>
                </thead>

                <tbody>
                  ${itemRows}
                </tbody>
              </table>

              <div style="margin-top:20px;">

                <p>
                  <strong>Subtotal:</strong>
                  $${subtotal.toFixed(2)}
                </p>

                <p>
                  <strong>Shipping:</strong>
                  $${shippingAmount.toFixed(2)}
                </p>

                <p>
                  <strong>Tax:</strong>
                  $${taxAmount.toFixed(2)}
                </p>

                <h2>
                  Total:
                  $${total.toFixed(2)}
                </h2>

              </div>

              <p>
                You can reply directly to this email
                to contact the customer.
              </p>

            </div>
          `,
        })

        console.log(
          `Order email sent for ${orderId}`
        )
      } catch (emailError) {
        console.error(
          'Order created but email failed:',
          emailError
        )
      }
    } else {
      console.warn(
        'Order created but email is not configured'
      )
    }

    return res.status(201).json({
      success: true,

      data: {
        id: orderId,
        userId: databaseUserId,
        customer: customerInformation,
        items: verifiedItems,
        subtotal,
        shipping: shippingAmount,
        tax: taxAmount,
        total,
        paymentStatus: 'pending',
        orderStatus: 'processing',
        createdAt:
          new Date().toISOString(),
      },
    })
  } catch (error) {
    await client.query('ROLLBACK')

    const message =
      error instanceof Error
        ? error.message
        : String(error)

    console.error(
      'Create order failed:',
      error
    )

    return res.status(400).json({
      success: false,
      message,
    })
  } finally {
    client.release()
  }
})

/*
  GET ALL ORDERS

  ADMIN ONLY
*/

router.get(
  '/',
  requireAdmin,
  async (_req, res) => {
    try {
      const result = await db.query(
        `
          SELECT
            o.id,
            o.user_id AS "userId",
            o.subtotal,
            o.shipping,
            o.tax,
            o.total,
            o.payment_status AS "paymentStatus",
            o.order_status AS "orderStatus",
            o.shipping_address AS customer,
            o.created_at AS "createdAt"
          FROM orders o
          ORDER BY o.created_at DESC
        `
      )

      return res.json({
        success: true,
        data: result.rows,
      })
    } catch (error) {
      console.error(
        'Get orders failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Could not load orders',
      })
    }
  }
)

/*
  GET ONE ORDER

  ADMIN ONLY
*/

router.get(
  '/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const orderResult =
        await db.query(
          `
            SELECT
              o.id,
              o.user_id AS "userId",
              o.subtotal,
              o.shipping,
              o.tax,
              o.total,
              o.payment_status AS "paymentStatus",
              o.order_status AS "orderStatus",
              o.shipping_address AS customer,
              o.created_at AS "createdAt"
            FROM orders o
            WHERE o.id = $1
          `,
          [req.params.id]
        )

      if (orderResult.rowCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Order not found',
        })
      }

      const itemsResult =
        await db.query(
          `
            SELECT
              oi.id,
              oi.product_id AS "productId",
              p.name,
              oi.price,
              oi.quantity,
              (oi.price * oi.quantity) AS "lineTotal"
            FROM order_items oi
            LEFT JOIN products p
              ON p.id = oi.product_id
            WHERE oi.order_id = $1
            ORDER BY oi.created_at ASC
          `,
          [req.params.id]
        )

      return res.json({
        success: true,

        data: {
          ...orderResult.rows[0],
          items: itemsResult.rows,
        },
      })
    } catch (error) {
      console.error(
        'Get order failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Could not load order',
      })
    }
  }
)

export default router
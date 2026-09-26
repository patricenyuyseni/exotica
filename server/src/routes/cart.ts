import { Router } from 'express'
import fsdb from '../utils/fsdb.js'
import db from '../db/index.js'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

const router = Router()

/*
  CART SYSTEM

  Logged-in users:
  - JWT provides the user ID
  - Cart is stored in PostgreSQL
  - A user can only access their own cart

  Guests:
  - No Authorization header
  - Cart is stored in carts.json
*/

/*
  Get authenticated user ID from JWT.
*/
function getUserIdFromRequest(req: any): string | null {
  const auth = req.headers.authorization

  if (!auth) {
    return null
  }

  const token = auth.replace(/^Bearer\s+/i, '')

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || 'dev'
    ) as any

    if (!payload?.id) {
      return null
    }

    return String(payload.id)
  } catch {
    return null
  }
}

/*
  GET CART
*/
router.get('/', async (req, res) => {
  try {
    const auth = req.headers.authorization

    /*
      LOGGED-IN USER
    */
    if (auth) {
      const userId = getUserIdFromRequest(req)

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
        })
      }

      const result = await db.query(
        `
          SELECT
            ci.id,
            ci.product_id AS "productId",
            ci.quantity
          FROM cart_items ci
          WHERE ci.user_id = $1
          ORDER BY ci.created_at DESC
        `,
        [userId]
      )

      return res.json({
        success: true,
        data: result.rows,
      })
    }

    /*
      GUEST USER
    */
    const carts = fsdb.readJSON('carts.json')

    const items = carts.filter(
      (item: any) => item.userId === 'guest'
    )

    return res.json({
      success: true,
      data: items,
    })
  } catch (error) {
    console.error('Get cart failed:', error)

    return res.status(500).json({
      success: false,
      message: 'Could not load cart',
    })
  }
})

/*
  ADD TO CART
*/
router.post('/', async (req, res) => {
  const {
    productId,
    quantity = 1,
  } = req.body

  if (!productId) {
    return res.status(400).json({
      success: false,
      message: 'productId required',
    })
  }

  const qty = Number(quantity)

  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid quantity',
    })
  }

  try {
    /*
      Check product and stock.
    */
    const productResult = await db.query(
      `
        SELECT
          id,
          name,
          price,
          stock_quantity
        FROM products
        WHERE id = $1
      `,
      [String(productId)]
    )

    if ((productResult.rowCount ?? 0) === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      })
    }

    const product = productResult.rows[0]
    const stock = Number(product.stock_quantity)

    if (stock < qty) {
      return res.status(400).json({
        success: false,
        message: `Only ${stock} item(s) available`,
      })
    }

    /*
      CHECK AUTHORIZATION HEADER
    */
    const auth = req.headers.authorization

    console.log(
      'CART POST AUTH:',
      auth ? 'TOKEN RECEIVED' : 'NO TOKEN'
    )

    /*
      ==========================
      GUEST CART
      ==========================
    */
    if (!auth) {
      const carts = fsdb.readJSON('carts.json')

      const existingIndex = carts.findIndex(
        (item: any) =>
          item.userId === 'guest' &&
          String(item.productId) === String(productId)
      )

      if (existingIndex !== -1) {
        const newQuantity =
          Number(carts[existingIndex].quantity) + qty

        if (newQuantity > stock) {
          return res.status(400).json({
            success: false,
            message: `Only ${stock} item(s) available`,
          })
        }

        carts[existingIndex].quantity =
          newQuantity

        fsdb.writeJSON(
          'carts.json',
          carts
        )

        return res.json({
          success: true,
          data: carts[existingIndex],
        })
      }

      const item = {
        id: uuidv4(),
        userId: 'guest',
        productId: String(productId),
        quantity: qty,
      }

      carts.push(item)

      fsdb.writeJSON(
        'carts.json',
        carts
      )

      return res.json({
        success: true,
        data: item,
      })
    }

    /*
      ==========================
      LOGGED-IN CART
      ==========================
    */
    const userId =
      getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    console.log(
      'CART USER ID:',
      userId
    )

    /*
      Find existing item belonging
      ONLY to this user.
    */
    const existingCartItem =
      await db.query(
        `
          SELECT
            id,
            quantity
          FROM cart_items
          WHERE user_id = $1
            AND product_id = $2
          LIMIT 1
        `,
        [
          userId,
          String(productId),
        ]
      )

    /*
      FIX:
      pg's rowCount can be null.
      Using ?? 0 makes the comparison
      safe for TypeScript.
    */
    if ((existingCartItem.rowCount ?? 0) > 0) {
      const currentQuantity =
        Number(
          existingCartItem.rows[0].quantity
        )

      const newQuantity =
        currentQuantity + qty

      if (newQuantity > stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${stock} item(s) available`,
        })
      }

      const updated =
        await db.query(
          `
            UPDATE cart_items
            SET
              quantity = $1,
              updated_at = NOW()
            WHERE id = $2
              AND user_id = $3
            RETURNING
              id,
              product_id AS "productId",
              quantity
          `,
          [
            newQuantity,
            existingCartItem.rows[0].id,
            userId,
          ]
        )

      return res.json({
        success: true,
        data: updated.rows[0],
      })
    }

    /*
      Create a new cart item.
    */
    const inserted =
      await db.query(
        `
          INSERT INTO cart_items
            (user_id, product_id, quantity)
          VALUES
            ($1, $2, $3)
          RETURNING
            id,
            product_id AS "productId",
            quantity
        `,
        [
          userId,
          String(productId),
          qty,
        ]
      )

    console.log(
      'CART INSERTED:',
      inserted.rows[0]
    )

    return res.json({
      success: true,
      data: inserted.rows[0],
    })
  } catch (error) {
    console.error(
      'Add to cart failed:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Could not add product to cart',
    })
  }
})

/*
  UPDATE CART ITEM
*/
router.patch('/:id', async (req, res) => {
  const { id } = req.params
  const { quantity } = req.body

  const qty = Number(quantity)

  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Invalid quantity',
    })
  }

  try {
    const auth = req.headers.authorization

    /*
      GUEST
    */
    if (!auth) {
      const carts = fsdb.readJSON('carts.json')

      const index = carts.findIndex(
        (item: any) =>
          item.id === id &&
          item.userId === 'guest'
      )

      if (index === -1) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found',
        })
      }

      carts[index].quantity = qty

      fsdb.writeJSON(
        'carts.json',
        carts
      )

      return res.json({
        success: true,
        data: carts[index],
      })
    }

    /*
      LOGGED-IN USER
    */
    const userId =
      getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    const result = await db.query(
      `
        UPDATE cart_items
        SET
          quantity = $1,
          updated_at = NOW()
        WHERE id = $2
          AND user_id = $3
        RETURNING
          id,
          product_id AS "productId",
          quantity
      `,
      [
        qty,
        id,
        userId,
      ]
    )

    if ((result.rowCount ?? 0) === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found',
      })
    }

    return res.json({
      success: true,
      data: result.rows[0],
    })
  } catch (error) {
    console.error(
      'Cart update failed:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Could not update cart',
    })
  }
})

/*
  REMOVE CART ITEM
*/
router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const auth = req.headers.authorization

    /*
      GUEST
    */
    if (!auth) {
      let carts = fsdb.readJSON('carts.json')

      carts = carts.filter(
        (item: any) =>
          !(
            item.id === id &&
            item.userId === 'guest'
          )
      )

      fsdb.writeJSON(
        'carts.json',
        carts
      )

      return res.json({
        success: true,
      })
    }

    /*
      LOGGED-IN USER
    */
    const userId =
      getUserIdFromRequest(req)

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      })
    }

    await db.query(
      `
        DELETE FROM cart_items
        WHERE id = $1
          AND user_id = $2
      `,
      [
        id,
        userId,
      ]
    )

    return res.json({
      success: true,
    })
  } catch (error) {
    console.error(
      'Cart delete failed:',
      error
    )

    return res.status(500).json({
      success: false,
      message: 'Could not remove cart item',
    })
  }
})

export default router
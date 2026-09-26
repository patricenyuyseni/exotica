import dotenv from 'dotenv'
import path from 'path'
import pkg from 'pg'
import fsdb from '../utils/fsdb.js'

dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
})

const { Pool } = pkg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

async function ensureSchema() {
  if (!process.env.DATABASE_URL) return

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id text PRIMARY KEY,
      data jsonb,
      price numeric,
      stock_quantity integer
    )
  `)

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY,
      user_id text,
      items jsonb,
      subtotal numeric,
      shipping numeric,
      tax numeric,
      total numeric,
      payment_status text,
      order_status text,
      created_at timestamptz
    )
  `)

  const res = await pool.query(
    'SELECT count(*)::int AS c FROM products'
  )

  const count = res.rows?.[0]?.c || 0

  if (Number(count) === 0) {
    try {
      const products = fsdb.readJSON('products.json')

      for (const p of products) {
        await pool.query(
          `INSERT INTO products
            (id, data, price, stock_quantity)
           VALUES
            ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING`,
          [
            String(p.id),
            p,
            p.price || 0,
            p.stockQuantity || 0,
          ]
        )
      }
    } catch (e) {
      console.warn('DB seed products failed', e)
    }
  }
}

export default {
  query: (text: string, params?: any[]) =>
    pool.query(text, params),
  pool,
  ensureSchema,
}
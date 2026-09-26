import { Router } from 'express'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import db from '../db/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = Router()

function findProductsFile() {
  const candidates = [
    path.join(process.cwd(), 'data', 'products.json'),
    path.join(process.cwd(), 'server', 'data', 'products.json'),
    path.join(process.cwd(), '..', 'server', 'data', 'products.json'),
    path.join(__dirname, '..', '..', 'data', 'products.json'),
    path.join(__dirname, '..', 'data', 'products.json'),
  ]

  for (const c of candidates) {
    if (fs.existsSync(c)) return c
  }

  return candidates[0]
}

/*
|--------------------------------------------------------------------------
| FORMAT DATABASE PRODUCT
|--------------------------------------------------------------------------
*/

function formatProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    categoryId: row.category_id,
    price: Number(row.price || 0),

    compareAtPrice:
      row.compare_at_price !== null
        ? Number(row.compare_at_price)
        : null,

    image:
      row.image ||
      '/images/products/placeholder.jpg',

    images: Array.isArray(row.images)
      ? row.images
      : [],

    stockQuantity:
      Number(row.stock_quantity || 0),

    sku: row.sku || '',

    rating:
      Number(row.rating || 0),

    reviewCount:
      Number(row.review_count || 0),

    featured:
      Boolean(row.featured),

    active:
      Boolean(row.active),

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  }
}

/*
|--------------------------------------------------------------------------
| GET ALL PRODUCTS
|--------------------------------------------------------------------------
*/

router.get('/', async (req, res) => {
  try {
    if (process.env.DATABASE_URL) {
      const {
        q,
        category,
        price_min,
        price_max,
        rating_min,
        in_stock,
        featured,
        sort,
        page = '1',
        limit = '12',
      } = req.query as Record<string, string>

      const where: string[] = []
      const params: any[] = []

      /*
      |--------------------------------------------------------------------------
      | Only show active products in the public shop
      |--------------------------------------------------------------------------
      */

      where.push('active = TRUE')

      /*
      |--------------------------------------------------------------------------
      | Search
      |--------------------------------------------------------------------------
      */

      if (q) {
        params.push(`%${q.toLowerCase()}%`)

        where.push(`
          (
            LOWER(name) LIKE $${params.length}
            OR LOWER(description) LIKE $${params.length}
            OR LOWER(sku) LIKE $${params.length}
          )
        `)
      }

      /*
      |--------------------------------------------------------------------------
      | Category
      |--------------------------------------------------------------------------
      */

      if (category) {
        params.push(category.toLowerCase())

        where.push(`
          LOWER(COALESCE(category_id::text, ''))
          = $${params.length}
        `)
      }

      /*
      |--------------------------------------------------------------------------
      | Price
      |--------------------------------------------------------------------------
      */

      if (price_min) {
        params.push(Number(price_min))

        where.push(
          `price >= $${params.length}`
        )
      }

      if (price_max) {
        params.push(Number(price_max))

        where.push(
          `price <= $${params.length}`
        )
      }

      /*
      |--------------------------------------------------------------------------
      | Rating
      |--------------------------------------------------------------------------
      */

      if (rating_min) {
        params.push(Number(rating_min))

        where.push(
          `rating >= $${params.length}`
        )
      }

      /*
      |--------------------------------------------------------------------------
      | Stock
      |--------------------------------------------------------------------------
      */

      if (in_stock === 'true') {
        where.push(
          'stock_quantity > 0'
        )
      }

      /*
      |--------------------------------------------------------------------------
      | Featured
      |--------------------------------------------------------------------------
      */

      if (featured === 'true') {
        where.push(
          'featured = TRUE'
        )
      }

      const whereSql =
        where.length > 0
          ? `WHERE ${where.join(' AND ')}`
          : ''

      /*
      |--------------------------------------------------------------------------
      | Pagination
      |--------------------------------------------------------------------------
      */

      const pg = Math.max(
        1,
        parseInt(page || '1')
      )

      const lim = Math.max(
        1,
        parseInt(limit || '12')
      )

      const offset =
        (pg - 1) * lim

      /*
      |--------------------------------------------------------------------------
      | Sorting
      |--------------------------------------------------------------------------
      */

      let orderSql =
        'ORDER BY created_at DESC'

      if (
        sort === 'price-low'
      ) {
        orderSql =
          'ORDER BY price ASC'
      } else if (
        sort === 'price-high'
      ) {
        orderSql =
          'ORDER BY price DESC'
      } else if (
        sort === 'newest'
      ) {
        orderSql =
          'ORDER BY created_at DESC'
      } else if (
        sort === 'rating'
      ) {
        orderSql =
          'ORDER BY rating DESC'
      } else if (
        sort === 'featured'
      ) {
        orderSql =
          'ORDER BY featured DESC, created_at DESC'
      }

      /*
      |--------------------------------------------------------------------------
      | Get products
      |--------------------------------------------------------------------------
      */

      const dataParams = [
        ...params,
        lim,
        offset,
      ]

      const dataSql = `
        SELECT
          id,
          name,
          slug,
          description,
          category_id,
          price,
          compare_at_price,
          image,
          images,
          stock_quantity,
          sku,
          rating,
          review_count,
          featured,
          active,
          created_at,
          updated_at
        FROM products
        ${whereSql}
        ${orderSql}
        LIMIT $${params.length + 1}
        OFFSET $${params.length + 2}
      `

      const result =
        await db.query(
          dataSql,
          dataParams
        )

      /*
      |--------------------------------------------------------------------------
      | Count
      |--------------------------------------------------------------------------
      */

      const countResult =
        await db.query(
          `
          SELECT
            COUNT(*)::int AS total
          FROM products
          ${whereSql}
          `,
          params
        )

      const total =
        Number(
          countResult.rows[0]?.total || 0
        )

      const products =
        result.rows.map(
          formatProduct
        )

      return res.json({
        success: true,
        data: products,
        meta: {
          total,
          page: pg,
          limit: lim,
        },
      })
    }
  } catch (error) {
    console.warn(
      'Products SQL failed',
      error
    )
  }

  /*
  |--------------------------------------------------------------------------
  | FILE FALLBACK
  |--------------------------------------------------------------------------
  */

  try {
    const p =
      findProductsFile()

    const raw =
      fs.readFileSync(
        p,
        'utf-8'
      )

    let products =
      JSON.parse(raw)

    const {
      q,
      category,
      price_min,
      price_max,
      rating_min,
      in_stock,
      featured,
      sort,
      page = '1',
      limit = '12',
    } = req.query as Record<
      string,
      string
    >

    /*
    |--------------------------------------------------------------------------
    | Filters
    |--------------------------------------------------------------------------
    */

    if (q) {
      const qq =
        q.toLowerCase()

      products =
        products.filter(
          (p: any) =>
            (
              p.name +
              ' ' +
              (p.description || '') +
              ' ' +
              (p.sku || '')
            )
              .toLowerCase()
              .includes(qq)
        )
    }

    if (category) {
      const cat =
        category.toLowerCase()

      products =
        products.filter(
          (p: any) =>
            (
              p.categoryId || ''
            )
              .toLowerCase() ===
            cat
        )
    }

    if (price_min) {
      products =
        products.filter(
          (p: any) =>
            Number(p.price) >=
            Number(price_min)
        )
    }

    if (price_max) {
      products =
        products.filter(
          (p: any) =>
            Number(p.price) <=
            Number(price_max)
        )
    }

    if (rating_min) {
      products =
        products.filter(
          (p: any) =>
            Number(p.rating) >=
            Number(rating_min)
        )
    }

    if (
      in_stock === 'true'
    ) {
      products =
        products.filter(
          (p: any) =>
            Number(
              p.stockQuantity
            ) > 0
        )
    }

    if (
      featured === 'true'
    ) {
      products =
        products.filter(
          (p: any) =>
            p.featured === true
        )
    }

    /*
    |--------------------------------------------------------------------------
    | Sorting
    |--------------------------------------------------------------------------
    */

    if (sort) {
      if (
        sort === 'price-low'
      ) {
        products.sort(
          (a: any, b: any) =>
            a.price - b.price
        )
      } else if (
        sort === 'price-high'
      ) {
        products.sort(
          (a: any, b: any) =>
            b.price - a.price
        )
      } else if (
        sort === 'newest'
      ) {
        products.sort(
          (a: any, b: any) =>
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
        )
      } else if (
        sort === 'rating'
      ) {
        products.sort(
          (a: any, b: any) =>
            b.rating - a.rating
        )
      } else if (
        sort === 'featured'
      ) {
        products.sort(
          (a: any, b: any) =>
            (b.featured ? 1 : 0) -
            (a.featured ? 1 : 0)
        )
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Pagination
    |--------------------------------------------------------------------------
    */

    const pg = Math.max(
      1,
      parseInt(page || '1')
    )

    const lim = Math.max(
      1,
      parseInt(limit || '12')
    )

    const total =
      products.length

    const start =
      (pg - 1) * lim

    const paginated =
      products.slice(
        start,
        start + lim
      )

    return res.json({
      success: true,
      data: paginated,
      meta: {
        total,
        page: pg,
        limit: lim,
      },
    })
  } catch (error) {
    console.error(
      'Products file fallback failed:',
      error
    )

    return res.status(500).json({
      success: false,
      message:
        'Unable to load products',
    })
  }
})

/*
|--------------------------------------------------------------------------
| GET SINGLE PRODUCT
|--------------------------------------------------------------------------
*/

router.get(
  '/:slug',
  async (req, res) => {
    try {
      if (process.env.DATABASE_URL) {
        const slug =
          req.params.slug

        const result =
          await db.query(
            `
            SELECT
              id,
              name,
              slug,
              description,
              category_id,
              price,
              compare_at_price,
              image,
              images,
              stock_quantity,
              sku,
              rating,
              review_count,
              featured,
              active,
              created_at,
              updated_at
            FROM products
            WHERE slug = $1
              AND active = TRUE
            LIMIT 1
            `,
            [slug]
          )

        if (
          result.rowCount === 0
        ) {
          return res.status(404).json({
            success: false,
            message:
              'Product not found',
          })
        }

        return res.json({
          success: true,
          data:
            formatProduct(
              result.rows[0]
            ),
        })
      }
    } catch (error) {
      console.warn(
        'Product SQL failed',
        error
      )
    }

    /*
    |--------------------------------------------------------------------------
    | File fallback
    |--------------------------------------------------------------------------
    */

    try {
      const p =
        findProductsFile()

      const raw =
        fs.readFileSync(
          p,
          'utf-8'
        )

      const products =
        JSON.parse(raw)

      const product =
        products.find(
          (x: any) =>
            x.slug ===
            req.params.slug
        )

      if (!product) {
        return res.status(404).json({
          success: false,
          message:
            'Product not found',
        })
      }

      return res.json({
        success: true,
        data: product,
      })
    } catch (error) {
      console.error(
        'Product file fallback failed:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          'Unable to load product',
      })
    }
  }
)

export default router
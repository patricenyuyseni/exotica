
import { Router, Request } from 'express'
import fs from 'fs'
import multer from 'multer'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import OpenAI from 'openai'
import { requireAdmin } from '../middleware/auth.js'
import db from '../db/index.js'

const router = Router()

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const OPENAI_MODEL =
  process.env.OPENAI_MODEL || 'gpt-5.6-luna'

/* =========================================================
   IMAGE UPLOAD CONFIGURATION
========================================================= */

const uploadDir = path.resolve(
  process.cwd(),
  'client/public/images/products'
)

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  })
}

const storage = multer.diskStorage({
  destination: (
    _req: Request,
    _file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) => {
    cb(null, uploadDir)
  },

  filename: (
    _req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) => {
    const extension = path.extname(
      file.originalname
    )

    cb(
      null,
      `${uuidv4()}${extension}`
    )
  },
})

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (
    _req: Request,
    file: Express.Multer.File,
    cb: (
      error: Error | null,
      acceptFile?: boolean
    ) => void
  ) => {
    const allowedTypes = [
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
    ]

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(
        new Error(
          'Only PNG, JPEG, WEBP and GIF images are allowed'
        )
      )
    }
  },
})

/* =========================================================
   GENERATE PRODUCT DESCRIPTION WITH AI
========================================================= */

router.post(
  '/generate-description',
  requireAdmin,
  async (req, res) => {
    try {
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({
          success: false,
          message:
            'OPENAI_API_KEY is not configured on the server',
        })
      }

      const {
        name,
        categoryId,
        price,
        sku,
      } = req.body

      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message:
            'Product name is required',
        })
      }

      let categoryName = ''

      if (categoryId?.trim()) {
        try {
          const categoryResult =
            await db.query(
              `
              SELECT name
              FROM categories
              WHERE id = $1
              LIMIT 1
              `,
              [categoryId.trim()]
            )

          if (categoryResult.rowCount) {
            categoryName =
              categoryResult.rows[0].name || ''
          }
        } catch (error) {
          console.warn(
            'Could not load category name:',
            error
          )
        }
      }

      const response =
        await openai.responses.create({
          model: OPENAI_MODEL,

          input: [
            {
              role: 'system',

              content: `
You write professional product descriptions for an online store called Exotica.

Write clear, attractive and concise product descriptions.

Rules:
- Write 2 short paragraphs.
- Use approximately 50-90 words.
- Make the description sound premium and natural.
- Focus on the product itself, its presentation, character and shopping experience.
- Do not invent ingredients, specifications, certifications, origins, effects, medical benefits, laboratory results or product features that were not provided.
- Do not make medical or therapeutic claims.
- Do not claim that a product treats, cures or prevents any condition.
- Do not mention that AI generated the description.
- Do not include the price.
- Do not use emojis unless they are part of the product name.
- Return only the description text.
              `.trim(),
            },

            {
              role: 'user',

              content: `
Product name: ${name.trim()}
Category: ${categoryName || 'Not specified'}
Price: ${price || 'Not specified'}
SKU: ${sku || 'Not specified'}

Create the product description.
              `.trim(),
            },
          ],
        })

      const description =
        response.output_text?.trim()

      if (!description) {
        return res.status(500).json({
          success: false,
          message:
            'AI did not return a product description',
        })
      }

      return res.json({
        success: true,
        description,
      })
    } catch (error: any) {
      console.error(
        'Generate product description error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          'Unable to generate product description',
      })
    }
  }
)

/* =========================================================
   GET ALL PRODUCTS
========================================================= */

router.get(
  '/',
  requireAdmin,
  async (_req, res) => {
    try {
      const result = await db.query(`
        SELECT
          id,
          name,
          slug,
          description,
          category_id AS "categoryId",
          price,
          compare_at_price AS "compareAtPrice",
          image,
          images,
          stock_quantity AS "stockQuantity",
          sku,
          rating,
          review_count AS "reviewCount",
          featured,
          active,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM products
        ORDER BY created_at DESC
      `)

      return res.json({
        success: true,
        data: result.rows,
      })
    } catch (error) {
      console.error(
        'Get admin products error:',
        error
      )

      return res.status(500).json({
        success: false,
        message: 'Failed to load products',
      })
    }
  }
)

/* =========================================================
   CREATE PRODUCT
========================================================= */

router.post(
  '/',
  requireAdmin,
  upload.array('images', 6),
  async (req: Request, res) => {
    try {
      const {
        name,
        slug,
        description,
        categoryId,
        price,
        compareAtPrice,
        sku,
        stockQuantity,
        featured,
        active,
      } = req.body

      if (!name?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Product name is required',
        })
      }

      if (!slug?.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Product slug is required',
        })
      }

      if (
        price === undefined ||
        price === null ||
        price === ''
      ) {
        return res.status(400).json({
          success: false,
          message: 'Product price is required',
        })
      }

      const parsedPrice = Number(price)

      if (
        Number.isNaN(parsedPrice) ||
        parsedPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product price',
        })
      }

      const parsedStock = Number(
        stockQuantity || 0
      )

      if (
        Number.isNaN(parsedStock) ||
        parsedStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid stock quantity',
        })
      }

      let parsedCompareAtPrice: number | null =
        null

      if (
        compareAtPrice !== undefined &&
        compareAtPrice !== null &&
        compareAtPrice !== ''
      ) {
        parsedCompareAtPrice =
          Number(compareAtPrice)

        if (
          Number.isNaN(
            parsedCompareAtPrice
          ) ||
          parsedCompareAtPrice < 0
        ) {
          return res.status(400).json({
            success: false,
            message:
              'Invalid compare-at price',
          })
        }
      }

      const files =
        (req.files as Express.Multer.File[]) ||
        []

      const imagePaths = files.map(
        (file) =>
          `${process.env.PUBLIC_API_URL || ''}/images/products/${file.filename}`
      )

      const primaryImage =
        imagePaths[0] || ''

      const result = await db.query(
        `
        INSERT INTO products (
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
          featured,
          active
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12
        )
        RETURNING
          id,
          name,
          slug,
          description,
          category_id AS "categoryId",
          price,
          compare_at_price AS "compareAtPrice",
          image,
          images,
          stock_quantity AS "stockQuantity",
          sku,
          rating,
          review_count AS "reviewCount",
          featured,
          active,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        `,
        [
          name.trim(),
          slug.trim(),
          description?.trim() || '',
          categoryId?.trim() || null,
          parsedPrice,
          parsedCompareAtPrice,
          primaryImage,
          imagePaths,
          parsedStock,
          sku?.trim() || null,
          featured === 'true' ||
            featured === true,
          active !== 'false' &&
            active !== false,
        ]
      )

      return res.status(201).json({
        success: true,
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error(
        'Create admin product error:',
        error
      )

      if (
        error?.code === '23505'
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A product with this slug or SKU already exists',
        })
      }

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          'Failed to create product',
      })
    }
  }
)

/* =========================================================
   UPDATE PRODUCT
========================================================= */

router.patch(
  '/:id',
  requireAdmin,
  upload.array('images', 6),
  async (req: Request, res) => {
    try {
      const { id } = req.params

      const existingResult =
        await db.query(
          `
          SELECT *
          FROM products
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        )

      if (!existingResult.rowCount) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        })
      }

      const existing =
        existingResult.rows[0]

      const {
        name,
        slug,
        description,
        categoryId,
        price,
        compareAtPrice,
        sku,
        stockQuantity,
        featured,
        active,
      } = req.body

      const files =
        (req.files as Express.Multer.File[]) ||
        []

      const newImagePaths = files.map(
        (file) =>
          `${process.env.PUBLIC_API_URL || ''}/images/products/${file.filename}`
      )

      let image =
        existing.image || ''

      let images =
        existing.images || []

      if (newImagePaths.length > 0) {
        image = newImagePaths[0]
        images = newImagePaths
      }

      const finalName =
        name !== undefined
          ? name.trim()
          : existing.name

      const finalSlug =
        slug !== undefined
          ? slug.trim()
          : existing.slug

      const finalDescription =
        description !== undefined
          ? description.trim()
          : existing.description

      const finalCategoryId =
        categoryId !== undefined
          ? categoryId.trim() || null
          : existing.category_id

      const finalPrice =
        price !== undefined &&
        price !== ''
          ? Number(price)
          : existing.price

      const finalCompareAtPrice =
        compareAtPrice !== undefined
          ? compareAtPrice === ''
            ? null
            : Number(compareAtPrice)
          : existing.compare_at_price

      const finalSku =
        sku !== undefined
          ? sku.trim() || null
          : existing.sku

      const finalStock =
        stockQuantity !== undefined &&
        stockQuantity !== ''
          ? Number(stockQuantity)
          : existing.stock_quantity

      const finalFeatured =
        featured !== undefined
          ? featured === 'true' ||
            featured === true
          : existing.featured

      const finalActive =
        active !== undefined
          ? active === 'true' ||
            active === true
          : existing.active

      if (
        Number.isNaN(finalPrice) ||
        finalPrice < 0
      ) {
        return res.status(400).json({
          success: false,
          message: 'Invalid product price',
        })
      }

      if (
        finalCompareAtPrice !== null &&
        (Number.isNaN(
          finalCompareAtPrice
        ) ||
          finalCompareAtPrice < 0)
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid compare-at price',
        })
      }

      if (
        Number.isNaN(finalStock) ||
        finalStock < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid stock quantity',
        })
      }

      const result = await db.query(
        `
        UPDATE products
        SET
          name = $1,
          slug = $2,
          description = $3,
          category_id = $4,
          price = $5,
          compare_at_price = $6,
          image = $7,
          images = $8,
          stock_quantity = $9,
          sku = $10,
          featured = $11,
          active = $12,
          updated_at = NOW()
        WHERE id = $13
        RETURNING
          id,
          name,
          slug,
          description,
          category_id AS "categoryId",
          price,
          compare_at_price AS "compareAtPrice",
          image,
          images,
          stock_quantity AS "stockQuantity",
          sku,
          rating,
          review_count AS "reviewCount",
          featured,
          active,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        `,
        [
          finalName,
          finalSlug,
          finalDescription,
          finalCategoryId,
          finalPrice,
          finalCompareAtPrice,
          image,
          images,
          finalStock,
          finalSku,
          finalFeatured,
          finalActive,
          id,
        ]
      )

      return res.json({
        success: true,
        data: result.rows[0],
      })
    } catch (error: any) {
      console.error(
        'Update admin product error:',
        error
      )

      if (
        error?.code === '23505'
      ) {
        return res.status(409).json({
          success: false,
          message:
            'A product with this slug or SKU already exists',
        })
      }

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          'Failed to update product',
      })
    }
  }
)

/* =========================================================
   DELETE PRODUCT
========================================================= */

router.delete(
  '/:id',
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params

      const result =
        await db.query(
          `
          SELECT image, images
          FROM products
          WHERE id = $1
          LIMIT 1
          `,
          [id]
        )

      if (!result.rowCount) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        })
      }

      const product =
        result.rows[0]

      const imagePaths = new Set<string>()

      if (product.image) {
        imagePaths.add(
          product.image
        )
      }

      if (
        Array.isArray(product.images)
      ) {
        for (const image of product.images) {
          if (image) {
            imagePaths.add(image)
          }
        }
      }

      for (const imagePath of imagePaths) {
        try {
          const relativePath =
            imagePath.startsWith('/')
              ? imagePath.slice(1)
              : imagePath

          const fullPath =
            path.resolve(
              process.cwd(),
              'client/public',
              relativePath
            )

          if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath)
          }
        } catch (error) {
          console.warn(
            'Could not delete product image:',
            error
          )
        }
      }

      await db.query(
        `
        DELETE FROM products
        WHERE id = $1
        `,
        [id]
      )

      return res.json({
        success: true,
        message:
          'Product deleted successfully',
      })
    } catch (error: any) {
      console.error(
        'Delete admin product error:',
        error
      )

      return res.status(500).json({
        success: false,
        message:
          error?.message ||
          'Failed to delete product',
      })
    }
  }
)

export default router

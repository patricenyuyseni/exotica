import dotenv from 'dotenv'
import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import productsRouter from './routes/products.js'
import cartRouter from './routes/cart.js'
import ordersRouter from './routes/orders.js'
import authRouter from './routes/auth.js'
import adminProductsRouter from './routes/adminProducts.js'
import db from './db/index.js'
import path from 'path'

dotenv.config({
  path: path.resolve(process.cwd(), '../.env'),
})

const app = express()

app.use(helmet())
app.use(cors({ origin: process.env.CLIENT_URL || '*' }))
app.use(morgan('dev'))
app.use(express.json())

app.use('/api/products', productsRouter)
app.use('/api/cart', cartRouter)
app.use('/api/orders', ordersRouter)
app.use('/api/auth', authRouter)
app.use('/api/admin/products', adminProductsRouter)

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' })
})

/*
 * Serve uploaded product images.
 *
 * Multer saves uploaded images to:
 * client/public/images/products
 *
 * This makes them available at:
 * /images/products/<filename>
 */
const productImagesDir = path.join(
  process.cwd(),
  'client',
  'public',
  'images',
  'products'
)

app.use(
  '/images/products',
  express.static(productImagesDir)
)

/*
 * Serve the React production build.
 */
const clientDist = path.join(
  process.cwd(),
  'client',
  'dist'
)

app.use(
  '/',
  express.static(clientDist)
)

const PORT = Number(process.env.PORT) || 4000

if (process.env.NODE_ENV !== 'test') {
  ;(async () => {
    try {
      await db.ensureSchema()
    } catch (e) {
      console.warn(
        'ensureSchema failed',
        e
      )
    }

    app.listen(PORT, () => {
      console.log(
        `Server running on port ${PORT}`
      )
    })
  })()
}

export default app
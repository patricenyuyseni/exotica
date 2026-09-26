import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'

const router = Router()

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Name, email and password are required',
    })
  }

  try {
    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 LIMIT 1',
      [email]
    )

    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already exists',
      })
    }

    const hash = await bcrypt.hash(password, 10)
    const id = uuidv4()

    const result = await db.query(
      `INSERT INTO users
        (id, name, email, password_hash, role)
       VALUES
        ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [id, name, email, hash, 'customer']
    )

    const user = result.rows[0]

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || 'dev',
      {
        expiresIn: '30d',
      }
    )

    return res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)

    return res.status(500).json({
      success: false,
      message: 'Registration failed',
    })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    })
  }

  try {
    const result = await db.query(
      `SELECT
        id,
        name,
        email,
        password_hash,
        role
       FROM users
       WHERE email = $1
       LIMIT 1`,
      [email]
    )

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const user = result.rows[0]

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    )

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET || 'dev',
      {
        expiresIn: '30d',
      }
    )

    return res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error('Login error:', error)

    return res.status(500).json({
      success: false,
      message: 'Login failed',
    })
  }
})

export default router
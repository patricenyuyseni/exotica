
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { v4 as uuidv4 } from 'uuid'
import db from '../db/index.js'

const router = Router()

const emailRegex =
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const nameRegex =
  /^[A-Za-zÀ-ÖØ-öø-ÿ]+(?:[ '-][A-Za-zÀ-ÖØ-öø-ÿ]+)*$/

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    throw new Error('JWT_SECRET is not configured')
  }

  return secret
}

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post('/register', async (req, res) => {
  const rawName =
    typeof req.body?.name === 'string'
      ? req.body.name
      : ''

  const rawEmail =
    typeof req.body?.email === 'string'
      ? req.body.email
      : ''

  const password =
    typeof req.body?.password === 'string'
      ? req.body.password
      : ''

  const name = rawName.trim()
  const email = rawEmail.trim().toLowerCase()

  /*
   * Name validation
   */

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your name.',
    })
  }

  if (name.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Your name must be at least 2 characters long.',
    })
  }

  if (name.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'Your name must be 50 characters or less.',
    })
  }

  if (!nameRegex.test(name)) {
    return res.status(400).json({
      success: false,
      message:
        'Your name can only contain letters, spaces, hyphens, and apostrophes.',
    })
  }

  /*
   * Email validation
   */

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your email address.',
    })
  }

  if (email.length > 254) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    })
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    })
  }

  /*
   * Password validation
   */

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a password.',
    })
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      message:
        'Your password must be at least 8 characters long.',
    })
  }

  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message:
        'Your password must contain an uppercase letter, a lowercase letter, a number, and a special character.',
    })
  }

  try {
    /*
     * Check whether email already exists
     */

    const existing = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1',
      [email]
    )

    if (existing.rowCount && existing.rowCount > 0) {
      return res.status(409).json({
        success: false,
        message:
          'An account with this email already exists. Please log in instead.',
      })
    }

    /*
     * Hash password
     */

    const hash = await bcrypt.hash(password, 12)
    const id = uuidv4()

    /*
     * Create customer account
     */

    const result = await db.query(
      `INSERT INTO users
        (id, name, email, password_hash, role)
       VALUES
        ($1, $2, $3, $4, $5)
       RETURNING id, name, email, role`,
      [id, name, email, hash, 'customer']
    )

    const user = result.rows[0]

    /*
     * Create JWT
     */

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      getJwtSecret(),
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
      message:
        'We could not create your account. Please try again.',
    })
  }
})

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post('/login', async (req, res) => {
  const rawEmail =
    typeof req.body?.email === 'string'
      ? req.body.email
      : ''

  const password =
    typeof req.body?.password === 'string'
      ? req.body.password
      : ''

  const email = rawEmail.trim().toLowerCase()

  /*
   * Email validation
   */

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your email address.',
    })
  }

  if (!emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address.',
    })
  }

  /*
   * Password validation
   */

  if (!password) {
    return res.status(400).json({
      success: false,
      message: 'Please enter your password.',
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
       WHERE LOWER(email) = $1
       LIMIT 1`,
      [email]
    )

    /*
     * Use the same message for unknown email
     * and incorrect password.
     */

    if (result.rowCount === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
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
        message: 'Invalid email or password.',
      })
    }

    /*
     * Create JWT
     */

    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
      },
      getJwtSecret(),
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
      message:
        'We could not log you in. Please try again.',
    })
  }
})

export default router

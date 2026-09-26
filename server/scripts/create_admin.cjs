const fs = require('fs')
const path = require('path')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { v4: uuidv4 } = require('uuid')

const EMAIL = process.env.ADMIN_EMAIL || 'admin@exotica.test'
const PASSWORD = process.env.ADMIN_PASSWORD || 'ChangeMe123!'
const JWT_SECRET = process.env.JWT_SECRET || 'dev'

const dataDir = path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
const usersFile = path.join(dataDir, 'users.json')
let users = []
if (fs.existsSync(usersFile)) {
  try { users = JSON.parse(fs.readFileSync(usersFile, 'utf8')) } catch (e) { users = [] }
}

let user = users.find(u => u.email === EMAIL)
if (!user) {
  const id = uuidv4()
  const hash = bcrypt.hashSync(PASSWORD, 10)
  user = { id, name: 'Admin', email: EMAIL, passwordHash: hash, role: 'admin', createdAt: new Date().toISOString() }
  users.push(user)
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
  console.log('Created admin user:', EMAIL)
} else {
  // update password
  user.passwordHash = bcrypt.hashSync(PASSWORD, 10)
  fs.writeFileSync(usersFile, JSON.stringify(users, null, 2))
  console.log('Updated admin password for:', EMAIL)
}

const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '30d' })
console.log('\nAdmin JWT (copy to Authorization: Bearer <token>):\n')
console.log(token)

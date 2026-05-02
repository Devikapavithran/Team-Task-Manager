const router = require('express').Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { pool } = require('../db')
const { auth } = require('../middleware/auth')

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_in_prod'
const sign = (id) => jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' })

router.post('/signup', async (req, res) => {
  const { name, email, password, role } = req.body
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' })
  try {
    const hash = await bcrypt.hash(password, 10)
    const safeRole = ['admin', 'member', 'reviewer'].includes(role) ? role : 'member'
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role,avatar_color',
      [name, email, hash, safeRole]
    )
    res.json({ token: sign(rows[0].id), user: rows[0] })
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'Email already registered' })
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email=$1', [email])
    if (!rows[0]) return res.status(401).json({ error: 'Invalid credentials' })
    const ok = await bcrypt.compare(password, rows[0].password_hash)
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const { password_hash, ...user } = rows[0]
    res.json({ token: sign(user.id), user })
  } catch (e) {
    console.error(e)
    res.status(500).json({ error: 'Server error' })
  }
})

router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user })
})

router.put('/me', auth, async (req, res) => {
  const { name, avatar_color } = req.body
  try {
    const { rows } = await pool.query(
      'UPDATE users SET name=COALESCE($1,name), avatar_color=COALESCE($2,avatar_color), updated_at=NOW() WHERE id=$3 RETURNING id,name,email,role,avatar_color',
      [name, avatar_color, req.user.id]
    )
    res.json({ user: rows[0] })
  } catch (e) {
    res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router

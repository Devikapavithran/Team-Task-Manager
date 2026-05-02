const jwt = require('jsonwebtoken')
const { pool } = require('../db')

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'No token provided' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_change_in_prod')
    const { rows } = await pool.query('SELECT id, name, email, role, avatar_color FROM users WHERE id=$1', [decoded.id])
    if (!rows[0]) return res.status(401).json({ error: 'User not found' })
    req.user = rows[0]
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin access required' })
  next()
}

const requireReviewer = (req, res, next) => {
  if (!['admin', 'reviewer'].includes(req.user.role)) return res.status(403).json({ error: 'Reviewer access required' })
  next()
}

module.exports = { auth, requireAdmin, requireReviewer }

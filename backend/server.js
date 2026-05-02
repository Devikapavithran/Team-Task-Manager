require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const { initDB } = require('./db')

const app = express()

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}))
app.use(express.json({ limit: '10mb' }))

// Health check FIRST - before anything else so Railway can always reach it
app.get('/api/health', (req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }))

// Routes
app.use('/api/auth', require('./routes/auth'))
app.use('/api/projects', require('./routes/projects'))
app.use('/api/tasks', require('./routes/tasks'))
app.use('/api', require('./routes/misc'))

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')))
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'))
  })
}

const PORT = process.env.PORT || 5000

// Start server immediately - don't wait for DB
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 TaskFlow server running on port ${PORT}`)
})

// Init DB after server is already listening
initDB()
  .then(() => console.log('✅ Database ready'))
  .catch(e => console.error('⚠️ DB init error (will retry on requests):', e.message))

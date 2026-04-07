const express = require('express')
const cors = require('cors')
require('dotenv').config()

const testRoutes = require('./routes/test')
const authRoutes = require('./routes/authRoutes')
const courseRoutes = require('./routes/courseRoutes')
const enrollRoutes = require('./routes/enrollRoutes')
const unitRoutes = require('./routes/unitRoutes')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 5001

// ── Middleware ──────────────────────────────────────────────
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

// ── Routes ─────────────────────────────────────────────────
app.use('/api', testRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api', enrollRoutes)
app.use('/api', unitRoutes)

// ── Health check ───────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

// ── Database Initialization & Start ──────────────────────────
const mysql = require('mysql2/promise')

async function ensureDatabaseExists() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    })
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'lms_db'}\``)
    await connection.end()
    console.log('Database ensure check passed.')
  } catch (err) {
    console.log('Skipping DB creation (MySQL not reachable or configured)')
  }
}

ensureDatabaseExists().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running → http://0.0.0.0:${PORT}`)
  })
})

const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const pool = require('../config/db')

const SALT_ROUNDS = 10

/**
 * POST /api/auth/signup
 * Body: { name, email, password, role, admin_key? }
 */
const signup = async (req, res) => {
  try {
    const { name, email, password, role, admin_key } = req.body

    // ── Validate required fields ──────────────────────────
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'All fields are required' })
    }

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    // ── Teacher admin-key gate ────────────────────────────
    if (role === 'teacher') {
      if (!admin_key || admin_key !== process.env.ADMIN_KEY) {
        return res.status(403).json({ error: 'Invalid admin key' })
      }
    }

    // ── Check if email already exists ─────────────────────
    const [existing] = await pool.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email]
    )

    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already registered' })
    }

    // ── Hash password & insert ────────────────────────────
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role]
    )

    return res.status(201).json({
      message: 'Account created successfully',
      user_id: result.insertId,
    })
  } catch (err) {
    console.error('Signup error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    // ── Find user ─────────────────────────────────────────
    const [rows] = await pool.query(
      'SELECT user_id, name, email, password, role FROM users WHERE email = ?',
      [email]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = rows[0]

    // ── Compare password ──────────────────────────────────
    const match = await bcrypt.compare(password, user.password)

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // ── Sign JWT ──────────────────────────────────────────
    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    return res.json({
      message: 'Login successful',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { signup, login }

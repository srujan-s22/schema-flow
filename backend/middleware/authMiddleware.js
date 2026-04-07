const jwt = require('jsonwebtoken')

/**
 * Verify the JWT from the Authorization header.
 * Attaches decoded payload to req.user.
 */
const verifyToken = (req, res, next) => {
  const header = req.headers.authorization

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied — no token provided' })
  }

  const token = header.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded // { user_id, role, iat, exp }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Require the authenticated user to have role = 'teacher'.
 * Must be used AFTER verifyToken.
 */
const requireTeacher = (req, res, next) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Access denied — teachers only' })
  }
  next()
}

/**
 * Require the authenticated user to have role = 'student'.
 * Must be used AFTER verifyToken.
 */
const requireStudent = (req, res, next) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Access denied — students only' })
  }
  next()
}

module.exports = { verifyToken, requireTeacher, requireStudent }

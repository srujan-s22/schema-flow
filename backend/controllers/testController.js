/**
 * GET /api/test
 * Simple health-check endpoint.
 */
const getTest = (_req, res) => {
  res.json({ message: 'API working' })
}

module.exports = { getTest }

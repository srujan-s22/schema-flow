const express = require('express')
const router = express.Router()
const { enrollInCourse, getMyCourses } = require('../controllers/enrollController')
const { verifyToken, requireStudent } = require('../middleware/authMiddleware')

// Apply base authentication middleware
router.use(verifyToken)

// GET /api/my-courses (Must be student)
router.get('/my-courses', requireStudent, getMyCourses)

// POST /api/enroll (Must be student)
router.post('/enroll', requireStudent, enrollInCourse)

module.exports = router

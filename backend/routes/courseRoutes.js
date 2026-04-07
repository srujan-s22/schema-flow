const express = require('express')
const router = express.Router()
const { createCourse, getCourses, getCourseStudents, removeStudent } = require('../controllers/courseController')
const { verifyToken, requireTeacher } = require('../middleware/authMiddleware')

// Both routes require authentication
router.use(verifyToken)

// GET /api/courses
router.get('/', getCourses)

// POST /api/courses (Requires teacher role)
router.post('/', requireTeacher, createCourse)

// GET /api/courses/:course_id/students (Teacher fetches enrolled students)
router.get('/:course_id/students', requireTeacher, getCourseStudents)

// DELETE /api/courses/:course_id/students/:student_id (Teacher removes a student)
router.delete('/:course_id/students/:student_id', requireTeacher, removeStudent)

module.exports = router

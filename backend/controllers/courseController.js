const pool = require('../config/db')

/**
 * POST /api/courses
 * Create a new course. Only teachers can access this.
 * Body: { course_name, max_seats, enrollment_key }
 */
const createCourse = async (req, res) => {
  try {
    const { course_name, max_seats, enrollment_key } = req.body
    const teacher_id = req.user.user_id

    // Validate inputs
    if (!course_name || max_seats === undefined || !enrollment_key) {
      return res.status(400).json({ error: 'course_name, max_seats, and enrollment_key are required' })
    }

    const seats = parseInt(max_seats, 10)
    if (isNaN(seats) || seats < 1) {
      return res.status(400).json({ error: 'max_seats must be a positive integer' })
    }

    const [result] = await pool.query(
      'INSERT INTO courses (course_name, teacher_id, enrollment_key, max_seats, available_seats) VALUES (?, ?, ?, ?, ?)',
      [course_name, teacher_id, enrollment_key, seats, seats]
    )

    return res.status(201).json({
      message: 'Course created successfully',
      course_id: result.insertId,
    })
  } catch (err) {
    console.error('Create course error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/courses
 * Fetch all courses with teacher name. Accessible to all authenticated users.
 * Securely exposes enrollment_key ONLY to the teacher who created the course.
 */
const getCourses = async (req, res) => {
  try {
    const userId = req.user.user_id

    const [rows] = await pool.query(`
      SELECT 
        c.course_id, 
        c.course_name, 
        c.max_seats, 
        c.available_seats, 
        c.teacher_id,
        IF(c.teacher_id = ?, c.enrollment_key, NULL) AS enrollment_key,
        u.name AS teacher_name
      FROM courses c
      JOIN users u ON c.teacher_id = u.user_id
      ORDER BY c.created_at DESC
    `, [userId])

    return res.json(rows)
  } catch (err) {
    console.error('Get courses error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/courses/:course_id/students
 * Teacher only view. Gets students enrolled in their course.
 */
const getCourseStudents = async (req, res) => {
  try {
    const { course_id } = req.params
    const teacher_id = req.user.user_id

    const [rows] = await pool.query(`
      SELECT u.user_id, u.name, u.email, e.enrolled_at 
      FROM enrollments e
      JOIN users u ON e.student_id = u.user_id
      JOIN courses c ON e.course_id = c.course_id
      WHERE e.course_id = ? AND c.teacher_id = ?
      ORDER BY e.enrolled_at DESC
    `, [course_id, teacher_id])

    return res.json(rows)
  } catch (err) {
    console.error('Get students error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/courses/:course_id/students/:student_id
 * Teacher only capability to kick out a student and return their seat securely via Transaction
 */
const removeStudent = async (req, res) => {
  const connection = await pool.getConnection()
  try {
    const { course_id, student_id } = req.params
    const teacher_id = req.user.user_id

    await connection.beginTransaction()

    // 1. Verify Teacher Ownership and get course locks
    const [courses] = await connection.query(
      'SELECT available_seats FROM courses WHERE course_id = ? AND teacher_id = ? FOR UPDATE',
      [course_id, teacher_id]
    )

    if (courses.length === 0) {
      await connection.rollback()
      return res.status(403).json({ error: 'Not authorized or course not found.' })
    }

    // 2. Delete the enrollment record
    const [deleteResult] = await connection.query(
      'DELETE FROM enrollments WHERE course_id = ? AND student_id = ?',
      [course_id, student_id]
    )

    if (deleteResult.affectedRows === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Student is not enrolled in this course.' })
    }

    // 3. Increment the seat securely. Our prior DB triggers were removed to natively handle transactions.
    await connection.query(
      'UPDATE courses SET available_seats = available_seats + 1 WHERE course_id = ? AND available_seats < max_seats',
      [course_id]
    )

    await connection.commit()
    return res.json({ message: 'Student removed successfully.' })
  } catch (err) {
    await connection.rollback()
    console.error('Remove student error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  } finally {
    connection.release()
  }
}

module.exports = { createCourse, getCourses, getCourseStudents, removeStudent }

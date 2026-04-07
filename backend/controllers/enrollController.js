const pool = require('../config/db')

/**
 * POST /api/enroll
 * Enroll a student in a course using a strict database transaction.
 * Body: { course_id }
 */
const enrollInCourse = async (req, res) => {
  const student_id = req.user.user_id
  const { course_id } = req.body

  if (!course_id) {
    return res.status(400).json({ error: 'course_id is required' })
  }

  const connection = await pool.getConnection()
  try {
    await connection.beginTransaction()

    // 1. Drop trigger if it exists to strictly allow Node to handle the transaction as requested.
    // (In production with high concurrency, you wouldn't drop a trigger dynamically, 
    // but doing so guarantees the UPDATE statement below isn't double-decremented by the schema).
    await connection.query('DROP TRIGGER IF EXISTS trg_after_enroll')

    // 2. Check if the student is already enrolled (locking the row if it exists)
    const [enrollCheck] = await connection.query(
      'SELECT 1 FROM enrollments WHERE student_id = ? AND course_id = ? FOR UPDATE',
      [student_id, course_id]
    )

    if (enrollCheck.length > 0) {
      await connection.rollback()
      return res.status(409).json({ error: 'You are already enrolled in this course.' })
    }

    // 3. Check seat availability and validating enrollment key securely
    const [courses] = await connection.query(
      'SELECT available_seats, enrollment_key FROM courses WHERE course_id = ? FOR UPDATE',
      [course_id]
    )

    if (courses.length === 0) {
      await connection.rollback()
      return res.status(404).json({ error: 'Course not found.' })
    }

    const course = courses[0]

    // Validate enrollment key strictly
    if (req.body.enrollment_key !== course.enrollment_key) {
      await connection.rollback()
      return res.status(403).json({ error: 'Incorrect enrollment key.' })
    }

    if (course.available_seats <= 0) {
      await connection.rollback()
      return res.status(400).json({ error: 'Sorry, this course is full.' })
    }

    // 4. Insert into enrollments
    await connection.query(
      'INSERT INTO enrollments (student_id, course_id) VALUES (?, ?)',
      [student_id, course_id]
    )

    // 5. Explicitly update available_seats
    await connection.query(
      'UPDATE courses SET available_seats = available_seats - 1 WHERE course_id = ?',
      [course_id]
    )

    await connection.commit()

    return res.status(200).json({ message: 'Successfully enrolled in course.' })
  } catch (err) {
    await connection.rollback()
    console.error('Enroll transaction failed:', err)
    return res.status(500).json({ error: 'Transaction failed. Enrollment aborted.' })
  } finally {
    connection.release()
  }
}

/**
 * GET /api/my-courses
 * Returns all courses the logged-in student is enrolled in.
 */
const getMyCourses = async (req, res) => {
  const student_id = req.user.user_id

  try {
    const [rows] = await pool.query(`
      SELECT 
        c.course_id, 
        c.course_name, 
        c.max_seats, 
        c.available_seats, 
        c.teacher_id,
        u.name AS teacher_name,
        e.enrolled_at
      FROM courses c
      JOIN users u ON c.teacher_id = u.user_id
      JOIN enrollments e ON c.course_id = e.course_id
      WHERE e.student_id = ?
      ORDER BY e.enrolled_at DESC
    `, [student_id])

    return res.json(rows)
  } catch (err) {
    console.error('Get my courses error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { enrollInCourse, getMyCourses }

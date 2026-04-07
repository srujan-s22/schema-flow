const pool = require('../config/db')

/**
 * POST /api/units
 * Require: Teacher. Add a unit to a course.
 * Body: { course_id, unit_name }
 */
const createUnit = async (req, res) => {
  const { course_id, unit_name } = req.body
  const teacher_id = req.user.user_id // From JWT

  if (!course_id || !unit_name) {
    return res.status(400).json({ error: 'course_id and unit_name are required' })
  }

  try {
    // Ensure the teacher actually owns this course
    const [courses] = await pool.query(
      'SELECT course_id FROM courses WHERE course_id = ? AND teacher_id = ?',
      [course_id, teacher_id]
    )

    if (courses.length === 0) {
      return res.status(403).json({ error: 'You do not have permission to add units to this course' })
    }

    const [result] = await pool.query(
      'INSERT INTO units (course_id, unit_name) VALUES (?, ?)',
      [course_id, unit_name]
    )

    return res.status(201).json({
      message: 'Unit created successfully',
      unit_id: result.insertId,
    })
  } catch (err) {
    console.error('Create unit error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * POST /api/notes/upload
 * Require: Teacher. Upload a PDF for a specific unit.
 * Body (FormData): { unit_id }, file: [PDF]
 */
const uploadNote = async (req, res) => {
  const { unit_id } = req.body
  const teacher_id = req.user.user_id // From JWT

  if (!unit_id) {
    return res.status(400).json({ error: 'unit_id is required' })
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  // Ensure it's a PDF (basic check)
  if (req.file.mimetype !== 'application/pdf') {
    return res.status(400).json({ error: 'Only PDF files are allowed' })
  }

  try {
    // Ensure the teacher owns the course that this unit belongs to
    const [units] = await pool.query(
      `SELECT c.teacher_id 
       FROM units u 
       JOIN courses c ON u.course_id = c.course_id 
       WHERE u.unit_id = ?`,
      [unit_id]
    )

    if (units.length === 0 || units[0].teacher_id !== teacher_id) {
      return res.status(403).json({ error: 'You do not have permission to add notes to this unit' })
    }

    // Save path relative to server root URL
    const file_url = `/uploads/notes/${req.file.filename}`

    const [result] = await pool.query(
      'INSERT INTO notes (unit_id, file_url, uploaded_by) VALUES (?, ?, ?)',
      [unit_id, file_url, teacher_id]
    )

    return res.status(201).json({
      message: 'Note uploaded successfully',
      note_id: result.insertId,
      file_url,
    })
  } catch (err) {
    console.error('Upload note error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * GET /api/notes/:course_id
 * Require: Auth. Returns course details and heavily nested list of units + their notes.
 */
const getCourseContent = async (req, res) => {
  const { course_id } = req.params

  try {
    // Fetch Course info
    const [courses] = await pool.query(
      'SELECT course_id, course_name, teacher_id FROM courses WHERE course_id = ?',
      [course_id]
    )

    if (courses.length === 0) {
      return res.status(404).json({ error: 'Course not found' })
    }
    const course = courses[0]

    // Fetch Units
    const [units] = await pool.query(
      'SELECT unit_id, unit_name FROM units WHERE course_id = ? ORDER BY created_at ASC',
      [course_id]
    )

    // Fetch Notes
    const [notes] = await pool.query(
      `SELECT n.note_id, n.unit_id, n.file_url, n.created_at, u.name AS uploaded_by_name
       FROM notes n
       JOIN units un ON n.unit_id = un.unit_id
       JOIN users u ON n.uploaded_by = u.user_id
       WHERE un.course_id = ?
       ORDER BY n.created_at ASC`,
      [course_id]
    )

    // Construct nested object: course -> units[] -> notes[]
    const courseContent = {
      ...course,
      units: units.map(unit => ({
        ...unit,
        notes: notes.filter(n => n.unit_id === unit.unit_id)
      }))
    }

    return res.json(courseContent)
  } catch (err) {
    console.error('Get course content error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

/**
 * DELETE /api/notes/:note_id
 * Require: Auth. Teacher deleting a specific PDF note they uploaded (or own the course of)
 */
const deleteNote = async (req, res) => {
  const fs = require('fs')
  const path = require('path')

  const { note_id } = req.params
  const teacher_id = req.user.user_id 

  try {
    // 1. Locate the note and its ownership parameters
    const [notes] = await pool.query(`
      SELECT n.note_id, n.file_url, n.uploaded_by, c.teacher_id as course_owner
      FROM notes n
      JOIN units u ON n.unit_id = u.unit_id
      JOIN courses c ON u.course_id = c.course_id
      WHERE n.note_id = ?
    `, [note_id])

    if (notes.length === 0) {
      return res.status(404).json({ error: 'Note not found' })
    }

    const note = notes[0]

    // 2. Validate user owns the note or the containing course
    if (note.uploaded_by !== teacher_id && note.course_owner !== teacher_id) {
      return res.status(403).json({ error: 'You do not have permission to delete this note' })
    }

    // 3. Physically Unlink from Disk
    if (note.file_url) {
      // note.file_url is usually loosely mounted: '/uploads/notes/...pdf'
      // The Node app runs in `project-root/backend` so we step into root directly
      const physicalPath = path.join(__dirname, '..', note.file_url)
      try {
        if (fs.existsSync(physicalPath)) {
          fs.unlinkSync(physicalPath)
        }
      } catch (fsErr) {
        console.warn(`Could not physically delete file at ${physicalPath}:`, fsErr)
      }
    }

    // 4. Safely wipe from the Database
    await pool.query('DELETE FROM notes WHERE note_id = ?', [note_id])

    return res.json({ message: 'Note deleted successfully' })

  } catch (err) {
    console.error('Delete note error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = { createUnit, uploadNote, getCourseContent, deleteNote }

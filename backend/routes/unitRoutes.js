const express = require('express')
const router = express.Router()
const multer = require('multer')
const path = require('path')
const { createUnit, uploadNote, getCourseContent, deleteNote } = require('../controllers/unitController')
const { verifyToken, requireTeacher } = require('../middleware/authMiddleware')

// Setup Multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/notes/') // Directory must exist
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
})

// All routes require auth
router.use(verifyToken)

// GET /api/notes/:course_id (Must be authenticated to view)
router.get('/notes/:course_id', getCourseContent)

// POST /api/units (Teacher only)
router.post('/units', requireTeacher, createUnit)

// POST /api/notes/upload (Teacher only, handles multipart/form-data)
router.post('/notes/upload', requireTeacher, upload.single('file'), uploadNote)

// DELETE /api/notes/:note_id (Teacher only)
router.delete('/notes/:note_id', requireTeacher, deleteNote)

module.exports = router

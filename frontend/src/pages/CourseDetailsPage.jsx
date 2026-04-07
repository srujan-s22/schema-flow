import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SidebarLayout from '../layouts/SidebarLayout'
import { getStoredUser, authGet, authPost, authPostMultipart, authDelete } from '../services/api'

export default function CourseDetailsPage() {
  const { courseId } = useParams()
  const navigate = useNavigate()
  const user = getStoredUser()

  const [course, setCourse] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Teacher Forms State
  const [newUnitName, setNewUnitName] = useState('')
  const [unitFormError, setUnitFormError] = useState('')
  const [unitFormSuccess, setUnitFormSuccess] = useState('')

  const [uploadingUnitId, setUploadingUnitId] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  // Note Removal State
  const [noteToRemove, setNoteToRemove] = useState(null)
  const [isRemovingNote, setIsRemovingNote] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [removeSuccess, setRemoveSuccess] = useState('')

  const isTeacher = user?.role === 'teacher'
  const navItems = isTeacher
    ? [{ label: 'Admin Dashboard', path: '/admin' }]
    : [{ label: 'Dashboard', path: '/dashboard' }]

  useEffect(() => {
    fetchCourseDetails()
  }, [courseId])

  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      const data = await authGet(`/notes/${courseId}`)
      setCourse(data)
    } catch (err) {
      setError(err.message || 'Failed to load course details. Ensure you are enrolled.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateUnit = async (e) => {
    e.preventDefault()
    setUnitFormError('')
    setUnitFormSuccess('')
    if (!newUnitName.trim()) return

    try {
      await authPost('/units', { course_id: courseId, unit_name: newUnitName })
      setUnitFormSuccess('Unit added successfully!')
      setNewUnitName('')
      fetchCourseDetails() // refresh content
    } catch (err) {
      setUnitFormError(err.message)
    }
  }

  const handleUploadFile = async (e, unitId) => {
    e.preventDefault()
    if (!selectedFile) return
    setUploadingUnitId(unitId)

    const formData = new FormData()
    formData.append('unit_id', unitId)
    formData.append('file', selectedFile)

    try {
      await authPostMultipart('/notes/upload', formData)
      setSelectedFile(null)
      fetchCourseDetails() // refresh notes
    } catch (err) {
      alert(`Upload failed: ${err.message}`)
    } finally {
      setUploadingUnitId(null)
    }
  }

  // --- Note Deletion Handlers ---
  const openRemoveModal = (noteId, filename) => {
    setNoteToRemove({ id: noteId, filename })
    setRemoveError('')
    setRemoveSuccess('')
  }

  const closeRemoveModal = () => {
    setNoteToRemove(null)
    setRemoveError('')
    setIsRemovingNote(false)
  }

  const confirmRemoveNote = async () => {
    if (!noteToRemove) return
    setIsRemovingNote(true)
    setRemoveError('')

    try {
      await authDelete(`/notes/${noteToRemove.id}`)
      setRemoveSuccess(`Note has been successfully deleted.`)
      fetchCourseDetails() // refresh lists dynamically

      // Close modal gracefully after success
      setTimeout(() => {
        closeRemoveModal()
        setTimeout(() => setRemoveSuccess(''), 4000)
      }, 500)

    } catch (err) {
      setRemoveError(err.message || 'Failed to delete note')
      setIsRemovingNote(false)
    }
  }

  const getDownloadUrl = (path) => {
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001'
    return `${apiBase}${path}`
  }

  return (
    <SidebarLayout navItems={navItems} brandLabel="SchemaFlow">
      <div className="relative">
        <button
          onClick={() => navigate(-1)}
          className="text-[13px] font-semibold text-[var(--color-slate-500)] hover:text-[var(--color-slate-900)] mb-8 inline-flex items-center gap-2 transition-colors uppercase tracking-wider bg-[var(--color-surface)] px-4 py-2 rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md cursor-pointer"
        >
          ← Return to Dashboard
        </button>

        {error ? (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-[13px] font-semibold text-red-500 shadow-sm">
            {error}
          </div>
        ) : loading || !course ? (
          <div className="flex flex-col items-center justify-center p-20 animate-pulse">
            <div className="w-16 h-16 rounded-full bg-[var(--color-slate-200)] mb-6"></div>
            <p className="text-[14px] font-semibold tracking-widest uppercase text-[var(--color-slate-400)]">Loading course databanks...</p>
          </div>
        ) : (
          <div className="relative z-10">
            {/* Header Area */}
            <div className="mb-10 relative">
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--color-slate-900)] tracking-tight mb-3 relative z-10 leading-tight">
                {course.course_name}
              </h1>
              <div className="flex items-center gap-3 relative z-10 mt-4">
                <span className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-slate-500)] px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider shadow-sm">
                  {course.units.length} Unit{course.units.length !== 1 && 's'} structured
                </span>
                <span className="bg-[var(--color-slate-900)] dark:bg-[var(--color-slate-100)] text-[var(--color-surface)] px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider shadow-sm">
                  Active
                </span>
              </div>
            </div>

            {removeSuccess && (
              <div className="mb-8 rounded-xl bg-green-500/10 border border-green-500/20 px-5 py-4 text-[13px] font-semibold text-green-500 shadow-sm transition-opacity">
                {removeSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
              {/* Left Column (Main Content) */}
              <div className="lg:col-span-8 space-y-8">
                {course.units.length === 0 ? (
                  <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
                    <p className="text-[15px] font-medium text-[var(--color-slate-400)]">
                      No curriculum nodes have been established yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {course.units.map((unit, index) => (
                      <section key={unit.unit_id} className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-sm transition-all group hover:shadow-md hover:border-[var(--color-slate-300)]">
                        {/* Unit Header */}
                        <div className="bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] px-6 py-4 flex items-center justify-between">
                          <h4 className="text-[16px] mt-1 font-bold text-[var(--color-slate-900)] flex items-center gap-4">
                            <span className="bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-slate-700)] w-8 h-8 rounded-lg flex items-center justify-center text-[13px] shadow-sm font-semibold">{index + 1}</span>
                            {unit.unit_name}
                          </h4>
                          <span className="text-[11px] font-semibold text-[var(--color-slate-400)] uppercase tracking-wider">{unit.notes.length} Files</span>
                        </div>

                        {/* Notes List */}
                        <div className="p-6 relative overflow-hidden">
                          {unit.notes.length === 0 ? (
                            <p className="text-[14px] text-[var(--color-slate-400)] font-medium italic mb-2 relative z-10">No instructional files linked.</p>
                          ) : (
                            <ul className="space-y-3 mb-6 relative z-10">
                              {unit.notes.map(note => {
                                const filename = note.file_url.split('/').pop()
                                return (
                                  <li key={note.note_id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] hover:border-[var(--color-slate-400)] transition-all hover:shadow-sm group/item">
                                    <div className="h-10 w-10 flex-shrink-0 bg-red-500/10 border border-red-500/20 text-red-600 rounded-lg flex items-center justify-center font-bold text-[10px] shadow-sm">
                                      PDF
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[14px] font-semibold text-[var(--color-slate-900)] truncate tracking-tight">
                                        {filename}
                                      </p>
                                      <p className="text-[12px] font-medium text-[var(--color-slate-500)] mt-0.5">
                                        Mapped by <span className="font-semibold text-[var(--color-slate-700)]">{note.uploaded_by_name}</span> • {new Date(note.created_at).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 transition-opacity">
                                      <a
                                        href={getDownloadUrl(note.file_url)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-slate-700)] hover:bg-[var(--color-slate-800)] hover:text-white dark:hover:bg-[var(--color-slate-200)] dark:hover:text-[var(--color-slate-900)] hover:border-transparent transition-all shadow-sm"
                                      >
                                        Access
                                      </a>
                                      {/* Delete Button for Teachers Only */}
                                      {isTeacher && course.teacher_id === user.user_id && (
                                        <button
                                          onClick={() => openRemoveModal(note.note_id, filename)}
                                          className="px-4 py-2 rounded-lg text-[12px] font-semibold bg-red-500/10 border border-red-500/20 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm cursor-pointer"
                                        >
                                          Remove
                                        </button>
                                      )}
                                    </div>
                                  </li>
                                )
                              })}
                            </ul>
                          )}

                          {/* Teacher: Upload Note */}
                          {isTeacher && course.teacher_id === user.user_id && (
                            <form onSubmit={(e) => handleUploadFile(e, unit.unit_id)} className="flex flex-col sm:flex-row sm:items-center gap-4 pt-5 mt-4 border-t border-[var(--color-border)] relative z-10">
                              <label className="flex-1 overflow-hidden">
                                <span className="sr-only">Choose PDF</span>
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => setSelectedFile(e.target.files[0])}
                                  className="block w-full text-sm text-[var(--color-slate-500)] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border file:border-[var(--color-border)] file:text-[12px] file:font-semibold file:bg-[var(--color-surface)] file:text-[var(--color-slate-700)] file:shadow-sm hover:file:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                                />
                              </label>
                              <button
                                type="submit"
                                disabled={uploadingUnitId === unit.unit_id || !selectedFile}
                                className="rounded-xl bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-hover)] px-5 py-2.5 text-[13px] font-semibold text-[var(--color-btn-text)] shadow-sm hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none cursor-pointer"
                              >
                                {uploadingUnitId === unit.unit_id ? 'Transmitting...' : 'Upload PDF'}
                              </button>
                            </form>
                          )}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column (Teacher Controls) */}
              <div className="lg:col-span-4 sticky top-6">
                {isTeacher && course.teacher_id === user.user_id && (
                  <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm relative overflow-hidden">
                    <h3 className="text-lg font-bold text-[var(--color-slate-900)] mb-6 flex items-center gap-3 relative z-10">
                      <div className="w-1.5 h-5 bg-[var(--color-slate-800)] dark:bg-[var(--color-slate-200)] rounded-full"></div>
                      Add New Unit
                    </h3>
                    <form onSubmit={handleCreateUnit} className="flex flex-col gap-5 relative z-10">
                      <div>
                        <input
                          type="text"
                          required
                          value={newUnitName}
                          onChange={(e) => setNewUnitName(e.target.value)}
                          placeholder="e.g. Phase 1: Architecture"
                          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[13px] font-medium text-[var(--color-slate-900)] outline-none focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] transition-all"
                        />
                        {unitFormError && <p className="mt-3 text-[12px] font-semibold text-red-500 bg-red-500/10 px-3 py-2 rounded-lg">{unitFormError}</p>}
                        {unitFormSuccess && <p className="mt-3 text-[12px] font-semibold text-green-500 bg-green-500/10 px-3 py-2 rounded-lg">{unitFormSuccess}</p>}
                      </div>
                      <button
                        type="submit"
                        className="rounded-xl bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-hover)] text-[var(--color-btn-text)] px-5 py-3.5 text-[14px] font-semibold shadow-sm transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.98]"
                      >
                        Generate Unit Block
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* ── Confirmation Modal for Deleting Notes ── */}
            {noteToRemove && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 pointer-events-auto">
                <div
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100 opacity-100"
                  style={{ animation: 'modalEntry 0.2s ease-out' }}
                >
                  <div className="p-8">
                    <h3 className="text-lg font-bold text-[var(--color-slate-900)] mb-1">
                      Remove File
                    </h3>
                    <p className="text-[14px] font-medium text-[var(--color-slate-500)] mb-6 leading-relaxed">
                      Are you sure you want to permanently erase <strong className="text-[var(--color-slate-800)] dark:text-[var(--color-slate-200)] break-all">{noteToRemove.filename}</strong>? This purges the file from the primary deployment node. This action cannot be reversed.
                    </p>

                    {removeError && (
                      <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-[12px] font-semibold text-red-500">
                        {removeError}
                      </div>
                    )}

                    <div className="flex gap-3 justify-end items-center mt-2">
                      <button
                        onClick={closeRemoveModal}
                        disabled={isRemovingNote}
                        className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--color-slate-600)] hover:bg-[var(--color-surface-alt)] transition-all cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmRemoveNote}
                        disabled={isRemovingNote}
                        className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[130px]"
                      >
                        {isRemovingNote ? 'Removing...' : 'Confirm Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </SidebarLayout>
  )
}

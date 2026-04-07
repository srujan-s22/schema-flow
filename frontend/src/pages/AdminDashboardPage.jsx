import { useState, useEffect } from 'react'
import SidebarLayout from '../layouts/SidebarLayout'
import { getStoredUser, authGet, authDelete } from '../services/api'
import CourseCard from '../components/CourseCard'

const teacherNav = [
  { label: 'Admin Dashboard', path: '/admin' },
]

function TeacherCourseManager({ course }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal extraction state
  const [studentToRemove, setStudentToRemove] = useState(null)
  const [isRemoving, setIsRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')
  const [removeSuccess, setRemoveSuccess] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [course.course_id])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const data = await authGet(`/courses/${course.course_id}/students`)
      setStudents(data)
    } catch (err) {
      console.error(`API Error fetching students for course ID ${course.course_id}:`, err)
      setError(err.message || 'Failed to load students.')
    } finally {
      setLoading(false)
    }
  }

  const openRemoveModal = (studentId, studentName) => {
    setStudentToRemove({ id: studentId, name: studentName })
    setRemoveError('')
    setRemoveSuccess('')
  }

  const closeRemoveModal = () => {
    setStudentToRemove(null)
    setRemoveError('')
    setIsRemoving(false)
  }

  const confirmRemoveStudent = async () => {
    if (!studentToRemove) return
    setIsRemoving(true)
    setRemoveError('')

    try {
      await authDelete(`/courses/${course.course_id}/students/${studentToRemove.id}`)
      setRemoveSuccess(`${studentToRemove.name} has been successfully removed.`)
      fetchStudents() // Refresh list dynamically

      // Close modal gracefully after success
      setTimeout(() => {
        closeRemoveModal()
        setTimeout(() => setRemoveSuccess(''), 4000)
      }, 500)

    } catch (err) {
      setRemoveError(err.message || 'Failed to remove student')
      setIsRemoving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 border border-[var(--color-border)] rounded-[1.5rem] p-6 bg-[var(--color-surface)] shadow-sm relative overflow-hidden group">

      <div className="z-10 relative">
        <CourseCard course={course} isTeacher={true} />
      </div>

      {removeSuccess && (
        <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-3 text-[13px] text-green-600 font-semibold z-10 relative">
          {removeSuccess}
        </div>
      )}

      <div className="bg-[var(--color-surface-alt)] rounded-xl p-5 border border-[var(--color-border)] z-10 relative h-full flex flex-col">
        <div className="flex justify-between items-center mb-5 border-b border-[var(--color-border)] pb-3">
          <h3 className="text-[14px] font-bold text-[var(--color-slate-900)] flex items-center gap-2">
            Enrolled Students
            <span className="bg-[var(--color-slate-800)] dark:bg-[var(--color-slate-200)] text-[var(--color-surface)] text-[11px] px-2.5 py-0.5 rounded-md font-semibold shadow-sm">
              {students.length}
            </span>
          </h3>
          <div className="text-[11px] font-mono bg-[var(--color-surface)] px-3 py-1.5 rounded-md border border-[var(--color-border)] text-[var(--color-slate-500)] shadow-sm">
            Key: <span className="font-bold text-[var(--color-slate-800)] dark:text-[var(--color-slate-200)]">{course.enrollment_key}</span>
          </div>
        </div>

        {loading ? (
          <p className="text-[13px] font-medium text-[var(--color-slate-400)] text-center py-4 animate-pulse">Synchronizing roster...</p>
        ) : error ? (
          <p className="text-[12px] font-semibold text-red-500 text-center py-4">{error}</p>
        ) : students.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-6">
            <p className="text-[13px] font-medium text-[var(--color-slate-400)] text-center">No students enrolled yet.</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {students.map(student => (
              <div key={student.user_id} className="flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-[var(--color-surface)] p-4 rounded-xl border border-[var(--color-border)] shadow-sm hover:border-[var(--color-slate-300)] transition-colors">
                <div className="flex flex-col">
                  <span className="text-[13px] font-semibold text-[var(--color-slate-900)]">{student.name}</span>
                  <span className="text-[12px] font-medium text-[var(--color-slate-500)]">{student.email}</span>
                </div>
                <button
                  onClick={() => openRemoveModal(student.user_id, student.name)}
                  className="text-[12px] font-semibold text-red-600 hover:text-white bg-red-500/5 border border-red-500/20 hover:bg-red-500 transition-all px-4 py-2 rounded-lg cursor-pointer self-start sm:self-auto"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Confirmation Modal ── */}
      {studentToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 pointer-events-auto">
          <div
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden transform transition-all scale-100 opacity-100"
            style={{ animation: 'modalEntry 0.2s ease-out' }}
          >
            <div className="p-8">
              <h3 className="text-lg font-bold text-[var(--color-slate-900)] mb-2">
                Remove Student
              </h3>
              <p className="text-[14px] font-medium text-[var(--color-slate-500)] mb-6 leading-relaxed">
                Are you sure you want to remove <strong className="text-[var(--color-slate-800)] dark:text-[var(--color-slate-200)]">{studentToRemove.name}</strong>? This releases their seat permanently.
              </p>

              {removeError && (
                <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-[12px] font-semibold text-red-500">
                  {removeError}
                </div>
              )}

              <div className="flex gap-3 justify-end items-center mt-2">
                <button
                  onClick={closeRemoveModal}
                  disabled={isRemoving}
                  className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-[var(--color-slate-600)] hover:bg-[var(--color-surface-alt)] transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveStudent}
                  disabled={isRemoving}
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-[13px] font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center min-w-[130px]"
                >
                  {isRemoving ? 'Processing...' : 'Confirm Expulsion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboardPage() {
  const user = getStoredUser()
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form state
  const [courseName, setCourseName] = useState('')
  const [maxSeats, setMaxSeats] = useState('')
  const [enrollmentKey, setEnrollmentKey] = useState('')
  const [creating, setCreating] = useState(false)
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    fetchCourses()
  }, [user?.user_id])

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const data = await authGet('/courses')
      const myCourses = data.filter(c => c.teacher_id === user?.user_id)
      setCourses(myCourses)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setCreating(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/courses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          course_name: courseName,
          max_seats: parseInt(maxSeats, 10),
          enrollment_key: enrollmentKey || 'LMS2026'
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create course')

      setFormSuccess('Course officially launched!')
      setCourseName('')
      setMaxSeats('')
      setEnrollmentKey('')
      fetchCourses()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setCreating(false)
    }
  }

  return (
    <SidebarLayout navItems={teacherNav} brandLabel="SchemaFlow">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-slate-900)] tracking-tight mb-2">
          Administrator Command
        </h1>
        <p className="text-[14px] font-medium text-[var(--color-slate-400)] mb-10">
          Welcome{user ? `, ${user.name}` : ''} — construct and oversee your intellectual properties here.
        </p>

        {error && (
          <div className="mb-8 rounded-xl bg-red-500/10 border border-red-500/20 px-5 py-4 text-[13px] font-semibold text-red-500 shadow-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Create Course Form */}
          <div className="lg:col-span-4">
            <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-sm sticky top-6 relative overflow-hidden">

              <h2 className="text-lg font-bold text-[var(--color-slate-900)] mb-6 relative z-10 flex items-center gap-3">
                <div className="w-1.5 h-5 bg-[var(--color-slate-800)] dark:bg-[var(--color-slate-200)] rounded-full"></div>
                Initialize Course
              </h2>

              <form onSubmit={handleCreateCourse} className="relative z-10">
                {formError && (
                  <div className="mb-5 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-[12px] font-semibold text-red-500">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="mb-5 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-[12px] font-semibold text-green-500">
                    {formSuccess}
                  </div>
                )}

                <div className="mb-5">
                  <label className="block text-[12px] font-semibold text-[var(--color-slate-700)] uppercase tracking-wider mb-2 ml-1">
                    Course Title
                  </label>
                  <input
                    type="text"
                    required
                    value={courseName}
                    onChange={(e) => setCourseName(e.target.value)}
                    placeholder="e.g. Advanced Meta-Structures"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[13px] font-medium text-[var(--color-slate-900)] outline-none focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] transition-all"
                  />
                </div>

                <div className="mb-5">
                  <label className="block text-[12px] font-semibold text-[var(--color-slate-700)] uppercase tracking-wider mb-2 ml-1">
                    Max Slots
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={maxSeats}
                    onChange={(e) => setMaxSeats(e.target.value)}
                    placeholder="e.g. 50"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[13px] font-medium text-[var(--color-slate-900)] outline-none focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] transition-all"
                  />
                </div>

                <div className="mb-8">
                  <label className="block text-[12px] font-semibold text-[var(--color-slate-700)] uppercase tracking-wider mb-2 flex justify-between ml-1">
                    <span>Enrollment Key</span>
                    <span className="text-[var(--color-slate-400)] text-[10px]">*Required</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={enrollmentKey}
                    onChange={(e) => setEnrollmentKey(e.target.value)}
                    placeholder="e.g. SECRETPASS123"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[13px] font-mono tracking-wide text-[var(--color-slate-900)] outline-none focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creating}
                  className="btn-primary mt-3 w-full rounded-xl px-5 py-3.5 text-[14px] cursor-pointer"
                >
                  {creating ? 'Creating...' : 'Create Course'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Instructor's Courses (TeacherCourseManager Wrappers) */}
          <div className="lg:col-span-8">
            <h2 className="text-xl font-bold text-[var(--color-slate-900)] mb-8 flex items-center gap-3 border-b border-[var(--color-border)] pb-4">
              <div className="w-1.5 h-6 bg-[var(--color-slate-300)] rounded-full"></div>
              Your Courses
            </h2>

            {loading ? (
              <p className="text-[14px] font-medium text-[var(--color-slate-400)] animate-pulse">Scanning server instances...</p>
            ) : courses.length === 0 ? (
              <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
                <p className="text-[15px] font-medium text-[var(--color-slate-400)]">
                  You manage zero courses right now. Start building on the left.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-stretch">
                {courses.map((course) => (
                  <TeacherCourseManager key={course.course_id} course={course} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  )
}

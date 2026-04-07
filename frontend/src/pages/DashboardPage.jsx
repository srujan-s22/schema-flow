import { useState, useEffect } from 'react'
import SidebarLayout from '../layouts/SidebarLayout'
import { getStoredUser, authGet, authPost } from '../services/api'
import CourseCard from '../components/CourseCard'

const studentNav = [
  { label: 'Dashboard', path: '/dashboard' },
]

export default function DashboardPage() {
  const user = getStoredUser()
  const [availableCourses, setAvailableCourses] = useState([])
  const [myCourses, setMyCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [enrollingMap, setEnrollingMap] = useState({})

  // Modal State
  const [enrollTarget, setEnrollTarget] = useState(null)
  const [enrollKey, setEnrollKey] = useState('')
  const [enrollError, setEnrollError] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [allCoursesData, myCoursesData] = await Promise.all([
        authGet('/courses'),
        authGet('/my-courses')
      ])

      const enrolledIds = new Set(myCoursesData.map(c => c.course_id))
      const available = allCoursesData.filter(c => !enrolledIds.has(c.course_id))

      setAvailableCourses(available)
      setMyCourses(myCoursesData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const openEnrollModal = (course) => {
    setEnrollTarget(course)
    setEnrollKey('')
    setEnrollError('')
  }

  const closeEnrollModal = () => {
    setEnrollTarget(null)
    setEnrollKey('')
    setEnrollError('')
  }

  const submitEnroll = async (e) => {
    e.preventDefault()
    if (!enrollKey.trim()) {
      setEnrollError('Please enter an enrollment key')
      return
    }

    setEnrollError('')
    setEnrollingMap(prev => ({ ...prev, [enrollTarget.course_id]: true }))

    try {
      await authPost('/enroll', { course_id: enrollTarget.course_id, enrollment_key: enrollKey })
      setSuccess(`Successfully enrolled in ${enrollTarget.course_name}!`)
      closeEnrollModal()
      fetchData() // Refresh lists

      // Clear success message after 5 seconds
      setTimeout(() => setSuccess(''), 5000)
    } catch (err) {
      setEnrollError(err.message)
    } finally {
      // Safely toggle loading if modal remained open (unlikely here on success, but good practice)
      if (enrollTarget) {
        setEnrollingMap(prev => ({ ...prev, [enrollTarget.course_id]: false }))
      }
    }
  }

  return (
    <SidebarLayout navItems={studentNav} brandLabel="SchemaFlow">
      <div className="relative">
        <h1 className="text-2xl font-bold text-[var(--color-slate-900)] mb-1">
          Student Dashboard
        </h1>
        <p className="text-sm text-[var(--color-slate-400)] mb-8">
          Welcome{user ? `, ${user.name}` : ''} — discover and enroll in new courses.
        </p>

        {error && (
          <div className="mb-6 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
            {success}
          </div>
        )}

        {/* ── My Courses Section ── */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-4">
            <div className="w-2 h-8 bg-[var(--color-slate-800)] dark:bg-[var(--color-slate-200)] rounded-full"></div>
            <h2 className="text-2xl font-bold text-[var(--color-slate-900)] tracking-tight">
              My Classrooms
            </h2>
          </div>

          {loading ? (
            <p className="text-[15px] font-medium text-[var(--color-slate-400)] animate-pulse">Loading your curriculum...</p>
          ) : myCourses.length === 0 ? (
            <div className="rounded-[1.5rem] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
              <p className="text-[15px] font-medium text-[var(--color-slate-400)]">
                You haven't enrolled in any courses yet. Look below to start!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {myCourses.map((course) => (
                <div key={course.course_id} className="relative group perspective-1000">
                  <CourseCard course={course} isTeacher={false} isEnrolled={true} />
                  <div className="absolute -top-3 -right-3 bg-[var(--color-slate-900)] dark:bg-[var(--color-slate-100)] text-[var(--color-surface)] shadow-md text-[10px] font-bold px-3 py-1 rounded-md z-10 pointer-events-none transform -rotate-1 group-hover:rotate-0 transition-all duration-300">
                    ENROLLED
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Available Courses Section ── */}
        <section className="mb-16">
          <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-4">
            <div className="w-2 h-8 bg-[var(--color-slate-300)] rounded-full"></div>
            <h2 className="text-2xl font-bold text-[var(--color-slate-900)] tracking-tight">
              Available Courses
            </h2>
          </div>

          {loading ? (
            <p className="text-[15px] font-medium text-[var(--color-slate-400)] animate-pulse">Scanning network for classes...</p>
          ) : availableCourses.length === 0 ? (
            <div className="rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center shadow-sm">
              <p className="text-[15px] font-medium text-[var(--color-slate-400)]">
                There are currently no new courses listed.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {availableCourses.map((course) => (
                <div key={course.course_id} className="relative">
                  <CourseCard
                    course={course}
                    onEnroll={() => openEnrollModal(course)}
                    isTeacher={false}
                  />
                  {enrollingMap[course.course_id] && (
                    <div className="absolute inset-0 bg-[var(--color-surface)] rounded-[1.5rem] flex justify-center items-center z-10 transition-all border outline-dashed outline-2 outline-[var(--color-slate-300)]">
                      <div className="bg-[var(--color-surface)] px-5 py-2.5 rounded-xl shadow-md border border-[var(--color-border)]">
                        <span className="font-semibold text-[13px] text-[var(--color-slate-700)] tracking-wide animate-pulse">PROCESSING...</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Enrollment Modal ── */}
        {enrollTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
            <div
              className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl w-full max-w-sm overflow-hidden transform transition-all scale-100 opacity-100 shadow-xl"
              style={{ animation: 'modalEntry 0.2s ease-out' }}
            >
              <div className="p-6">
                <h3 className="text-lg font-bold text-[var(--color-slate-900)] mb-1">
                  Enroll in Course
                </h3>
                <p className="text-[14px] text-[var(--color-slate-500)] mb-6">
                  You are enrolling in <span className="font-semibold text-[var(--color-slate-800)]">{enrollTarget.course_name}</span>.
                </p>

                <form onSubmit={submitEnroll}>
                  {enrollError && (
                    <div className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 border border-red-500/20">
                      {enrollError}
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-[13px] font-semibold text-[var(--color-slate-700)] mb-1.5 ml-1">
                      Enrollment Key
                    </label>
                    <input
                      type="text"
                      autoFocus
                      required
                      value={enrollKey}
                      onChange={(e) => setEnrollKey(e.target.value)}
                      placeholder="e.g. SECRET123"
                      className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[14px] font-mono text-[var(--color-slate-900)] outline-none focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] transition"
                    />
                  </div>

                  <div className="flex gap-3 justify-end mt-2">
                    <button
                      type="button"
                      onClick={closeEnrollModal}
                      className="px-5 py-2.5 rounded-xl text-[14px] font-semibold text-[var(--color-slate-600)] hover:bg-[var(--color-surface-alt)] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={enrollingMap[enrollTarget.course_id]}
                      className="px-5 py-2.5 rounded-xl bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-hover)] text-[var(--color-btn-text)] text-[14px] font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                    >
                      {enrollingMap[enrollTarget.course_id] ? 'Verifying...' : 'Submit Key'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>
    </SidebarLayout>
  )
}

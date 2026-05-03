import { Link } from 'react-router-dom'

export default function CourseCard({ course, onEnroll, isTeacher, isEnrolled }) {
  // If user is a teacher of this course OR a student who is enrolled, they can enter the course.
  const canEnterCourse = isTeacher || isEnrolled

  const CardContent = (
    <div className="flex-1">
      <h3 className="text-xl font-bold text-[var(--color-slate-900)] leading-tight mb-3">
        {course.course_name}
      </h3>

      <div className="flex flex-col gap-2 mt-5">
        <div className="flex justify-between items-center text-[14px]">
          <span className="font-semibold text-[var(--color-slate-400)] text-xs tracking-wider uppercase">Instructor</span>
          <span className="font-semibold text-[var(--color-slate-700)]">
            {course.teacher_name}
          </span>
        </div>
        <div className="flex justify-between items-center text-[14px]">
          <span className="font-semibold text-[var(--color-slate-400)] text-xs tracking-wider uppercase">Slots Available</span>
          <span className={`font-semibold rounded-md px-2.5 py-1 text-[11px] ${course.available_seats > 0 ? 'bg-green-500/10 text-green-600 border border-green-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'}`}>
            {course.available_seats} / {course.max_seats} SLOTS
          </span>
        </div>
      </div>
    </div>
  )

  const CardWrapper = ({ children }) => {
    const baseClasses = "rounded-[1.5rem] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col h-full transition-all duration-300 relative overflow-hidden group"
    if (canEnterCourse) {
      return (
        <Link to={`/courses/${course.course_id}`} className={`block ${baseClasses} hover:shadow-md hover:border-[var(--color-slate-300)] hover:-translate-y-0.5`}>
          <div className="relative z-10 flex-col flex h-full justify-between">
            {children}
            <div className="btn-primary mt-8 w-full rounded-xl px-4 py-3 text-[14px]">
              {isTeacher ? 'Manage Course' : 'View Course'}
            </div>
          </div>
        </Link>
      )
    }
    return (
      <div className={`${baseClasses} hover:shadow-md hover:border-[var(--color-slate-300)]`}>
        <div className="relative z-10 flex flex-col h-full justify-between">
          {children}
          {!isTeacher && !isEnrolled && (
            <button
              onClick={() => onEnroll && onEnroll(course.course_id)}
              disabled={course.available_seats === 0}
              className={`mt-8 w-full rounded-xl px-4 py-3 text-[14px] cursor-pointer disabled:cursor-not-allowed ${course.available_seats > 0 ? 'btn-primary' : 'bg-[var(--color-slate-200)] text-[var(--color-slate-400)] font-semibold'}`}
            >
              {course.available_seats > 0 ? 'Enroll Now' : 'Class is Full'}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <CardWrapper>
      {CardContent}
    </CardWrapper>
  )
}

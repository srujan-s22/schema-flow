import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { post } from '../services/api'
import { DatabaseIcon } from '../components/Logo'

export default function SignupPage() {
  const navigate = useNavigate()

  // Form state
  const [role, setRole] = useState('student') // 'student' | 'teacher'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [adminKey, setAdminKey] = useState('')

  // Status state
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSignup = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (role === 'teacher' && !adminKey) {
        throw new Error('Secret Admin Key is precisely required for teacher registration.')
      }

      const payload = { role, name, email, password }
      if (role === 'teacher') {
        payload.admin_key = adminKey
      }

      console.log('Signup Payload:', payload)

      await post('/auth/signup', payload)
      navigate('/login') // Redirect to login upon successful registration

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[var(--color-surface-alt)] font-sans text-[var(--color-slate-900)] overflow-hidden">

      {/* Centered Signup Form */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto flex flex-col">

          <div className="mb-8 lg:pl-2">
            <div className="flex items-center gap-3 mb-2 logo-colors">
              <DatabaseIcon className="w-8 h-8 md:w-10 md:h-10" />
              <h2 className="text-3xl font-bold tracking-tight">
                Create an account
              </h2>
            </div>
            <p className="text-[var(--color-slate-500)] text-[15px] font-medium">
              Join as a student or register as a teacher to command classrooms.
            </p>
          </div>

          <div className="bg-[var(--color-surface)] shadow-md shadow-[var(--color-slate-900)]/5 border border-[var(--color-border)] rounded-2xl p-8 sm:p-10 transition-all duration-300 relative">

            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSignup} className="space-y-5">

              {/* Custom Role Selector */}
              <div className="flex gap-4 mb-4">
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${role === 'student' ? 'border-[var(--color-slate-900)] bg-[var(--color-slate-900)]/5 text-[var(--color-slate-900)] dark:border-[var(--color-slate-100)] dark:text-[var(--color-slate-100)] dark:bg-[var(--color-slate-100)]/10' : 'border-[var(--color-border)] text-[var(--color-slate-400)] hover:border-[var(--color-slate-300)]'}`}>
                  <input type="radio" name="role" value="student" className="hidden" onChange={() => { setRole('student'); setAdminKey(''); }} checked={role === 'student'} />
                  <span className="text-[14px] font-bold">🎓 Student</span>
                </label>
                <label className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 transition-all cursor-pointer ${role === 'teacher' ? 'border-[var(--color-slate-900)] bg-[var(--color-slate-900)]/5 text-[var(--color-slate-900)] dark:border-[var(--color-slate-100)] dark:text-[var(--color-slate-100)] dark:bg-[var(--color-slate-100)]/10' : 'border-[var(--color-border)] text-[var(--color-slate-400)] hover:border-[var(--color-slate-300)]'}`}>
                  <input type="radio" name="role" value="teacher" className="hidden" onChange={() => setRole('teacher')} checked={role === 'teacher'} />
                  <span className="text-[14px] font-bold">👨‍🏫 Teacher</span>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[var(--color-slate-700)] ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[14px] text-[var(--color-slate-900)] font-medium outline-none transition-all duration-200 focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] placeholder-[var(--color-slate-400)]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[var(--color-slate-700)] ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@school.edu"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[14px] text-[var(--color-slate-900)] font-medium outline-none transition-all duration-200 focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] placeholder-[var(--color-slate-400)]"
                />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[13px] font-bold text-[var(--color-slate-700)] ml-1">Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[14px] text-[var(--color-slate-900)] font-medium outline-none transition-all duration-200 focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] placeholder-[var(--color-slate-400)] tracking-widest"
                />
              </div>

              {role === 'teacher' && (
                <div className="space-y-1.5 pt-2">
                  <label className="text-[13px] font-bold text-[var(--color-slate-700)] ml-1 flex justify-between">
                    <span>Teacher Authorization Key</span>
                    <span className="text-[11px] font-medium text-[var(--color-slate-400)] tracking-wider uppercase flex items-center">* Required</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={adminKey}
                    onChange={(e) => setAdminKey(e.target.value)}
                    placeholder="Provide the secret key"
                    className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[14px] text-[var(--color-slate-900)] font-mono outline-none transition-all duration-200 focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] placeholder-[var(--color-slate-400)]"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] hover:bg-[var(--color-btn-hover)] px-5 py-3.5 text-[15px] font-semibold transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.98] mt-4"
              >
                {loading ? 'Initializing...' : 'Complete Registration'}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-[var(--color-border)] pt-8">
              <p className="text-sm font-medium text-[var(--color-slate-500)]">
                Already have an account?{' '}
                <Link to="/login" className="font-bold text-[var(--color-accent)] hover:text-[var(--color-teal)] transition-colors underline-offset-4 hover:underline">
                  Sign in &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { post } from '../services/api'
import { DatabaseIcon } from '../components/Logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await post('/auth/login', { email, password })

      // Store token + user info
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      // Redirect based on role
      if (data.user.role === 'teacher') {
        navigate('/admin')
      } else {
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex bg-[var(--color-surface-alt)] font-sans text-[var(--color-slate-900)] overflow-hidden">

      {/* Centered Login Form */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <div className="w-full max-w-[420px] mx-auto flex flex-col">

          <div className="mb-8 lg:pl-2">
            <div className="flex items-center gap-3 mb-2 logo-colors">
              <DatabaseIcon className="w-8 h-8 md:w-10 md:h-10" />
              <h2 className="text-3xl font-bold tracking-tight">
                Welcome back
              </h2>
            </div>
            <p className="text-[var(--color-slate-500)] text-[15px] font-medium">
              Enter your credentials to access your workspace.
            </p>
          </div>

          <div className="bg-[var(--color-surface)] shadow-md shadow-[var(--color-slate-900)]/5 border border-[var(--color-border)] rounded-2xl p-8 sm:p-10 transition-all duration-300 relative">

            {error && (
              <div className="mb-6 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
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

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-[var(--color-slate-700)] ml-1 flex justify-between">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-4 py-3 text-[14px] text-[var(--color-slate-900)] font-medium outline-none transition-all duration-200 focus:border-[var(--color-slate-400)] focus:ring-2 focus:ring-[var(--color-slate-200)] placeholder-[var(--color-slate-400)] tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-[var(--color-btn-primary)] text-[var(--color-btn-text)] hover:bg-[var(--color-btn-hover)] px-5 py-3.5 text-[15px] font-semibold transition-all duration-200 cursor-pointer hover:scale-[1.01] active:scale-[0.98] mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center border-t border-[var(--color-border)] pt-6">
              <p className="text-[14px] font-medium text-[var(--color-slate-500)]">
                Don't have an account?{' '}
                <Link to="/signup" className="font-semibold text-[var(--color-slate-900)] hover:text-[var(--color-slate-600)] transition-colors underline-offset-4 hover:underline">
                  Create one now &rarr;
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

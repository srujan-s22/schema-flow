import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CourseDetailsPage from './pages/CourseDetailsPage'
import DatabaseVisualizePage from './pages/DatabaseVisualizePage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ErrorBoundary from './components/ErrorBoundary'
import { getStoredToken, getStoredUser } from './services/api'

/**
 * Wrapper that redirects unauthenticated users to /login.
 * Optionally checks for a required role.
 */
function ProtectedRoute({ children, requiredRole }) {
  const token = getStoredToken()
  const user = getStoredUser()

  if (!token) {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Wrong role → send them to their own dashboard
    return <Navigate to={user?.role === 'teacher' ? '/admin' : '/dashboard'} replace />
  }

  return children
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Both student and teacher can access course details (validated dynamically inside based on enrollment/ownership) */}
          <Route
            path="/courses/:courseId"
            element={
              <ProtectedRoute>
                <CourseDetailsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute requiredRole="student">
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/database"
            element={
              <ProtectedRoute>
                <DatabaseVisualizePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="teacher">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

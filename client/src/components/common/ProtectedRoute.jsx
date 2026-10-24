import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Loader from './Loader.jsx'

export function ProtectedRoute({ roles, children }) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader text="Verifying session..." />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length > 0) {
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    if (!allowedRoles.includes(user.role)) {
      return <Navigate to="/" replace />
    }
  }

  return children
}

export default ProtectedRoute


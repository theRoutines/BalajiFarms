import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import FormField from '../components/common/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { BRAND_NAME } from '../utils/constants.js'

export function LoginPage() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  function validate() {
    const errors = {}
    if (!email.trim()) {
      errors.email = 'Email address is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!password) {
      errors.password = 'Password is required'
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setFormError('')

    if (!validate()) return

    setIsSubmitting(true)
    try {
      await login({ email, password })
      toast.success('Welcome back!')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.message || 'Invalid email or password'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-forest/15 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <Link to="/" className="inline-block text-3xl">
            🌿
          </Link>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
            Sign In to {BRAND_NAME}
          </h2>
          <p className="mt-2 text-xs text-charcoal/70">
            Access your orders, track deliveries, and manage your account
          </p>
        </div>

        {formError && (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-medium text-rose-800"
          >
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
          <FormField
            label="Email Address"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: '' })
            }}
            error={fieldErrors.email}
          />

          <FormField
            label="Password"
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: '' })
            }}
            error={fieldErrors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-4"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-8 border-t border-forest/10 pt-6 text-center text-xs text-charcoal/70">
          <span>Don&apos;t have an account yet? </span>
          <Link
            to="/register"
            state={{ from: location.state?.from }}
            className="font-semibold text-forest underline hover:text-forest/80"
          >
            Create an account
          </Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage


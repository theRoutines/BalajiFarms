import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Button from '../components/common/Button.jsx'
import FormField from '../components/common/FormField.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { BRAND_NAME } from '../utils/constants.js'

export function RegisterPage() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from?.pathname || '/'

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      navigate(from, { replace: true })
    }
  }, [user, navigate, from])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }))
    }
  }

  function validate() {
    const errors = {}

    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = 'Full name must be at least 2 characters'
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.phone.trim() || !/^\d{10}$/.test(formData.phone.trim())) {
      errors.phone = 'Phone must contain exactly 10 digits'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (
      formData.password.length < 8 ||
      !/[A-Za-z]/.test(formData.password) ||
      !/\d/.test(formData.password)
    ) {
      errors.password = 'Password must be at least 8 characters with a letter and a number'
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
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.trim(),
        password: formData.password,
      })
      toast.success('Account created successfully!')
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err.message || 'Registration failed'
      setFormError(msg)
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-3xl border border-forest/15 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <Link to="/" className="inline-block text-3xl">
            🌿
          </Link>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-forest sm:text-3xl">
            Create an Account
          </h2>
          <p className="mt-2 text-xs text-charcoal/70">
            Join the {BRAND_NAME} family for pure farm deliveries
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

        <form onSubmit={handleSubmit} className="mt-8 space-y-4" noValidate>
          <FormField
            label="Full Name"
            id="name"
            name="name"
            required
            autoComplete="name"
            placeholder="Aarav Sharma"
            value={formData.name}
            onChange={handleChange}
            error={fieldErrors.name}
          />

          <FormField
            label="Email Address"
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="aarav@example.com"
            value={formData.email}
            onChange={handleChange}
            error={fieldErrors.email}
          />

          <FormField
            label="Phone Number (10 Digits)"
            id="phone"
            name="phone"
            type="tel"
            required
            autoComplete="tel"
            placeholder="9876543210"
            maxLength={10}
            value={formData.phone}
            onChange={handleChange}
            error={fieldErrors.phone}
          />

          <FormField
            label="Password (min 8 chars with letter & number)"
            id="password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            error={fieldErrors.password}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-4"
          >
            Create Account
          </Button>
        </form>

        <div className="mt-8 border-t border-forest/10 pt-6 text-center text-xs text-charcoal/70">
          <span>Already registered? </span>
          <Link
            to="/login"
            state={{ from: location.state?.from }}
            className="font-semibold text-forest underline hover:text-forest/80"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage


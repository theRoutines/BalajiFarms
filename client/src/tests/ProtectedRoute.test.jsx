import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import ProtectedRoute from '../components/common/ProtectedRoute.jsx'
import * as AuthContextModule from '../context/AuthContext.jsx'

vi.mock('../context/AuthContext.jsx', () => ({
  useAuth: vi.fn(),
}))

describe('ProtectedRoute', () => {
  it('shows loader while auth is loading', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: true,
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
  })

  it('redirects anonymous users to /login', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isLoading: false,
    })

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route
            path="/protected"
            element={
              <ProtectedRoute>
                <div>Secret Content</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Login Page')).toBeInTheDocument()
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument()
  })

  it('renders children when the right role is provided', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 1, role: 'ADMIN' },
      isLoading: false,
    })

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })

  it('redirects to / when the wrong role is provided', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { id: 2, role: 'CUSTOMER' },
      isLoading: false,
    })

    render(
      <MemoryRouter initialEntries={['/admin-only']}>
        <Routes>
          <Route
            path="/admin-only"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <div>Admin Dashboard</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>Home Page</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Home Page')).toBeInTheDocument()
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument()
  })
})


import { refreshSession, loginUser, logoutUser, registerUser } from '../services/authService.js'
import { clearAuthCookies, setAuthCookies } from '../utils/tokens.js'

export async function register(request, response) {
  const data = await registerUser(request.body)
  response.status(201).json({ success: true, data })
}

export async function login(request, response) {
  const session = await loginUser(request.body)
  setAuthCookies(response, session.accessToken, session.refreshToken)
  response.json({ success: true, data: { user: session.user } })
}

export async function refresh(request, response) {
  const session = await refreshSession(request.cookies?.refreshToken)
  setAuthCookies(response, session.accessToken, session.refreshToken)
  response.json({ success: true, data: { user: session.user } })
}

export async function logout(request, response) {
  await logoutUser(request.cookies?.refreshToken)
  clearAuthCookies(response)
  response.json({ success: true, data: {} })
}

export function me(request, response) {
  const { id, name, email, role } = request.user
  response.json({ success: true, data: { user: { id, name, email, role } } })
}

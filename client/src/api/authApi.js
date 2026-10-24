import axiosClient from './axiosClient.js'

export async function registerUser({ name, email, phone, password }) {
  return axiosClient.post('/auth/register', { name, email, phone, password })
}

export async function loginUser({ email, password }) {
  return axiosClient.post('/auth/login', { email, password })
}

export async function logoutUser() {
  return axiosClient.post('/auth/logout')
}

export async function getCurrentUser() {
  return axiosClient.get('/auth/me')
}


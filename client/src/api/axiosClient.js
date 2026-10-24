import axios from 'axios'

export const axiosClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise = null

function requestTokenRefresh() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => res.data)
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

axiosClient.interceptors.response.use(
  (response) => {
    // Return the unwrapped payload if wrapped in standard { success: true, data }
    if (response.data && Object.prototype.hasOwnProperty.call(response.data, 'data')) {
      return response.data.data
    }
    return response.data
  },
  async (error) => {
    const originalRequest = error.config
    const requestUrl = originalRequest?.url || ''
    const isAuthEndpoint = requestUrl.startsWith('/auth/') || requestUrl.includes('/auth/')

    // On 401 from any non-auth URL, attempt token refresh once
    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true
      try {
        await requestTokenRefresh()
        return axiosClient(originalRequest)
      } catch (refreshErr) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        const message =
          refreshErr.response?.data?.message || refreshErr.message || 'Session expired'
        const convertedErr = new Error(message)
        convertedErr.status = refreshErr.response?.status || 401
        return Promise.reject(convertedErr)
      }
    }

    const message = error.response?.data?.message || error.message || 'An error occurred'
    const appError = new Error(message)
    appError.status = error.response?.status
    if (error.response?.data?.errors) {
      appError.errors = error.response.data.errors
    }
    return Promise.reject(appError)
  },
)

export default axiosClient


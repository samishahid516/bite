import axios from 'axios'
import { API_BASE_URL } from '../constants'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true
})

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

let refreshPromise = null

apiClient.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const { config, response } = error

    const isAuthEndpoint = config?.url?.startsWith('/auth/')
    if (response?.status === 401 && !config?._retried && !isAuthEndpoint) {
      config._retried = true
      try {
        refreshPromise ??= apiClient.post('/auth/refresh').finally(() => {
          refreshPromise = null
        })
        const { data } = await refreshPromise
        localStorage.setItem('accessToken', data.accessToken)
        config.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(config)
      } catch {
        localStorage.removeItem('accessToken')
      }
    }

    const message = response?.data?.message || error.message || 'Request failed'
    return Promise.reject({ ...error, message })
  }
)

// src/services/api/client.ts - Axios API Client with Better Auth Integration
import axios, { AxiosError } from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { authClient } from '@/lib/auth'

interface ApiResponse<T = any> {
  data: T
  message?: string
  success: boolean
}

interface ApiError {
  message: string
  code?: string
  details?: any
}

class ApiClient {
  private axiosInstance: AxiosInstance
  private isRefreshing = false
  private refreshSubscribers: Array<(token: string) => void> = []

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        try {
          // Get current session from better-auth
          const { data: session } = await authClient.getSession()
          
          if (session?.session?.token) {
            config.headers.Authorization = `Bearer ${session.session.token}`
          }
        } catch (error) {
          console.warn('Could not get session for API request:', error)
        }

        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If we're already refreshing, wait for it to complete
            return new Promise((resolve) => {
              this.refreshSubscribers.push((token: string) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`
                }
                resolve(this.axiosInstance(originalRequest))
              })
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            // Try to refresh the session
            const { data: session } = await authClient.getSession()
            
            if (session?.session?.token) {
              // Notify all subscribers
              this.refreshSubscribers.forEach(callback => callback(session.session.token))
              this.refreshSubscribers = []
              
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${session.session.token}`
              }
              
              return this.axiosInstance(originalRequest)
            } else {
              // Session is invalid, redirect to login
              window.location.href = '/login'
              return Promise.reject(error)
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            window.location.href = '/login'
            return Promise.reject(error)
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(this.handleError(error))
      }
    )
  }

  private handleError(error: AxiosError): ApiError {
    const response = error.response
    
    if (response?.data) {
      const errorData = response.data as any
      return {
        message: errorData.message || errorData.error || 'An error occurred',
        code: errorData.code || response.status.toString(),
        details: errorData.details
      }
    }

    if (error.code === 'NETWORK_ERROR') {
      return {
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      }
    }

    if (error.code === 'ECONNABORTED') {
      return {
        message: 'Request timeout. Please try again.',
        code: 'TIMEOUT'
      }
    }

    return {
      message: error.message || 'An unexpected error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    }
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config)
    return response.data
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config)
    return response.data
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config)
    return response.data
  }

  // File upload
  async upload<T = any>(url: string, file: File, options?: {
    onUploadProgress?: (progress: number) => void
    additionalData?: Record<string, any>
  }): Promise<ApiResponse<T>> {
    const formData = new FormData()
    formData.append('file', file)
    
    if (options?.additionalData) {
      Object.keys(options.additionalData).forEach(key => {
        formData.append(key, options.additionalData![key])
      })
    }

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: options?.onUploadProgress ? 
        (progressEvent) => {
          const progress = progressEvent.total ? 
            Math.round((progressEvent.loaded * 100) / progressEvent.total) : 0
          options.onUploadProgress!(progress)
        } : undefined
    }

    const response = await this.axiosInstance.post<ApiResponse<T>>(url, formData, config)
    return response.data
  }

  // Get raw axios instance for custom requests
  get instance(): AxiosInstance {
    return this.axiosInstance
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient()

// Export for use in composables
export default apiClient
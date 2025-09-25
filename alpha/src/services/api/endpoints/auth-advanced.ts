// src/services/api/endpoints/auth-advanced.ts - Advanced Auth Endpoints
import { apiClient } from '../client'
import type {
  TwoFactorSetupData,
  TwoFactorVerification,
  PhoneNumberVerification,
  EmailOTPVerification,
  AdminAction,
  ApiKey,
  CreateApiKeyRequest,
  Device,
  SecurityEvent,
  PasswordBreachCheck,
  CaptchaVerification,
  SubscriptionPlan,
  Subscription,
  PaymentMethod,
  AuthActionResult
} from '@/types/auth.types'

class AuthAdvancedApi {
  // Two-Factor Authentication
  async setupTwoFactor(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post<TwoFactorSetupData>('/auth/2fa/setup')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async verifyTwoFactorSetup(code: string): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/2fa/verify-setup', { code })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async disableTwoFactor(currentPassword: string): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/2fa/disable', { currentPassword })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async verifyTwoFactor(data: TwoFactorVerification): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post('/auth/2fa/verify', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async generateBackupCodes(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post<{ codes: string[] }>('/auth/2fa/backup-codes')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Phone Number Verification
  async addPhoneNumber(phoneNumber: string): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/phone/add', { phoneNumber })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async verifyPhoneNumber(data: PhoneNumberVerification): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/phone/verify', data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async removePhoneNumber(): Promise<AuthActionResult> {
    try {
      await apiClient.delete('/auth/phone')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Email OTP
  async sendEmailOTP(data: EmailOTPVerification): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/email-otp/send', data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async verifyEmailOTP(data: EmailOTPVerification): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post('/auth/email-otp/verify', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Admin Functions
  async performAdminAction(action: AdminAction): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/admin/action', action)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getAllUsers(page: number = 1, limit: number = 20): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get(`/auth/admin/users?page=${page}&limit=${limit}`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getUserDetails(userId: string): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get(`/auth/admin/users/${userId}`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async updateUserRole(userId: string, role: string): Promise<AuthActionResult> {
    try {
      await apiClient.patch(`/auth/admin/users/${userId}/role`, { role })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async banUser(userId: string, reason: string, duration?: number): Promise<AuthActionResult> {
    try {
      await apiClient.post(`/auth/admin/users/${userId}/ban`, { reason, duration })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async unbanUser(userId: string): Promise<AuthActionResult> {
    try {
      await apiClient.post(`/auth/admin/users/${userId}/unban`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // API Key Management
  async createApiKey(data: CreateApiKeyRequest): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post<ApiKey>('/auth/api-keys', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getApiKeys(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get<ApiKey[]>('/auth/api-keys')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async revokeApiKey(keyId: string): Promise<AuthActionResult> {
    try {
      await apiClient.delete(`/auth/api-keys/${keyId}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async updateApiKey(keyId: string, data: { name?: string; permissions?: string[] }): Promise<AuthActionResult> {
    try {
      const response = await apiClient.patch(`/auth/api-keys/${keyId}`, data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Device Management
  async getDevices(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get<Device[]>('/auth/devices')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async revokeDevice(deviceId: string): Promise<AuthActionResult> {
    try {
      await apiClient.delete(`/auth/devices/${deviceId}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async trustDevice(deviceId: string): Promise<AuthActionResult> {
    try {
      await apiClient.post(`/auth/devices/${deviceId}/trust`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Security Events
  async getSecurityEvents(page: number = 1, limit: number = 20): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get<SecurityEvent[]>(`/auth/security-events?page=${page}&limit=${limit}`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Password Security
  async checkPasswordBreach(password: string): Promise<PasswordBreachCheck> {
    try {
      const response = await apiClient.post<PasswordBreachCheck>('/auth/password/check-breach', { password })
      return response.data
    } catch (error) {
      return { isBreached: false }
    }
  }

  // Captcha
  async verifyCaptcha(data: CaptchaVerification): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post('/auth/captcha/verify', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Stripe/Billing Integration
  async getSubscriptionPlans(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get<SubscriptionPlan[]>('/auth/stripe/plans')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async createCheckoutSession(priceId: string, successUrl: string, cancelUrl: string): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post<{ sessionId: string; url: string }>('/auth/stripe/create-checkout', {
        priceId,
        successUrl,
        cancelUrl
      })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async createCustomerPortalSession(returnUrl: string): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post<{ url: string }>('/auth/stripe/customer-portal', { returnUrl })
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getSubscriptions(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get<Subscription[]>('/auth/stripe/subscriptions')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post(`/auth/stripe/subscriptions/${subscriptionId}/cancel`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async reactivateSubscription(subscriptionId: string): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post(`/auth/stripe/subscriptions/${subscriptionId}/reactivate`)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async getPaymentMethods(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get<PaymentMethod[]>('/auth/stripe/payment-methods')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Email Management
  async sendCustomEmail(to: string, subject: string, html: string): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/email/send', { to, subject, html })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async sendBulkEmail(recipients: string[], subject: string, html: string): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/email/send-bulk', { recipients, subject, html })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Session Management
  async getAllSessions(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get('/auth/sessions')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async revokeSession(sessionId: string): Promise<AuthActionResult> {
    try {
      await apiClient.delete(`/auth/sessions/${sessionId}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async revokeAllSessions(): Promise<AuthActionResult> {
    try {
      await apiClient.delete('/auth/sessions/all')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  // Account Export/Import
  async exportAccountData(): Promise<AuthActionResult> {
    try {
      const response = await apiClient.get('/auth/account/export')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  async deleteAccount(password: string): Promise<AuthActionResult> {
    try {
      await apiClient.delete('/auth/account/delete', { data: { password } })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
}

export const authAdvancedApi = new AuthAdvancedApi()
export default authAdvancedApi
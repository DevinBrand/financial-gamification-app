// src/composables/useAuth.ts - Enhanced Vue Integration with All Features
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth'
import { apiClient } from '@/services/api/client'
import type { 
  User, 
  BetterAuthUser, 
  TwoFactorSetupData,
  TwoFactorVerification,
  PhoneNumberVerification,
  EmailOTPVerification,
  SocialProvider,
  Device,
  ApiKey,
  CreateApiKeyRequest,
  SecurityEvent,
  PasswordBreachCheck,
  AuthActionResult,
  CaptchaVerification
} from '@/types/auth.types'
import { transformUser } from '@/types/auth.types'

export function useAuth() {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  const router = useRouter()
  
  // Computed properties
  const isAuthenticated = computed(() => !!user.value)
  const userProfile = computed(() => user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isTwoFactorEnabled = computed(() => user.value?.twoFactorEnabled || false)
  const isEmailVerified = computed(() => user.value?.emailVerified || false)
  const isPhoneVerified = computed(() => user.value?.phoneNumberVerified || false)
  
  // Basic authentication
  async function signIn(email: string, password: string, rememberMe: boolean = false): Promise<AuthActionResult> {
    isLoading.value = true
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe,
      })
      
      if (error) throw new Error(error.message || 'Sign in failed')
      
      if (data?.user) {
        user.value = transformUser(data.user as BetterAuthUser)
        return { success: true, data: user.value }
      }
      
      throw new Error('Invalid response from server')
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function signUp(email: string, password: string, name: string): Promise<AuthActionResult> {
    isLoading.value = true
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name,
      })
      
      if (error) throw new Error(error.message || 'Sign up failed')
      
      if (data?.user) {
        user.value = transformUser(data.user as BetterAuthUser)
        return { success: true, data: user.value }
      }
      
      throw new Error('Invalid response from server')
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function signInWithSocial(provider: SocialProvider, callbackURL: string = '/dashboard'): Promise<void> {
    await authClient.signIn.social({
      provider,
      callbackURL,
    })
  }
  
  async function signOut(): Promise<void> {
    try {
      await authClient.signOut()
      user.value = null
      router.push('/login')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }
  
  // Two-Factor Authentication
  async function setupTwoFactor(): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await apiClient.post<TwoFactorSetupData>('/auth/2fa/setup')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function verifyTwoFactorSetup(code: string): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.post('/auth/2fa/verify-setup', { code })
      user.value.twoFactorEnabled = true
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function disableTwoFactor(currentPassword: string): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.post('/auth/2fa/disable', { currentPassword })
      user.value.twoFactorEnabled = false
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function verifyTwoFactor(data: TwoFactorVerification): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post('/auth/2fa/verify', data)
      if (response.data.user) {
        user.value = transformUser(response.data.user as BetterAuthUser)
      }
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function generateBackupCodes(): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await apiClient.post<{ codes: string[] }>('/auth/2fa/backup-codes')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Phone number verification
  async function addPhoneNumber(phoneNumber: string): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.post('/auth/phone/add', { phoneNumber })
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function verifyPhoneNumber(data: PhoneNumberVerification): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.post('/auth/phone/verify', data)
      user.value.phoneNumber = data.phoneNumber
      user.value.phoneNumberVerified = true
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function removePhoneNumber(): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.delete('/auth/phone')
      user.value.phoneNumber = null
      user.value.phoneNumberVerified = false
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Email OTP
  async function sendEmailOTP(data: EmailOTPVerification): Promise<AuthActionResult> {
    try {
      await apiClient.post('/auth/email-otp/send', data)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function verifyEmailOTP(data: EmailOTPVerification): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post('/auth/email-otp/verify', data)
      if (response.data.user) {
        user.value = transformUser(response.data.user as BetterAuthUser)
      }
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Email verification
  async function sendVerificationEmail(): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.post('/auth/email/verify/send')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function verifyEmail(token: string): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post('/auth/email/verify', { token })
      if (response.data.user) {
        user.value = transformUser(response.data.user as BetterAuthUser)
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Password management
  async function changePassword(currentPassword: string, newPassword: string): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true
      })
      
      if (error) throw new Error(error.message || 'Password change failed')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function forgotPassword(email: string): Promise<AuthActionResult> {
    try {
      const { error } = await authClient.forgetPassword({
        email,
        redirectTo: '/reset-password'
      })
      
      if (error) throw new Error(error.message || 'Password reset request failed')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function resetPassword(token: string, newPassword: string): Promise<AuthActionResult> {
    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword
      })
      
      if (error) throw new Error(error.message || 'Password reset failed')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function checkPasswordBreach(password: string): Promise<PasswordBreachCheck> {
    try {
      const response = await apiClient.post<PasswordBreachCheck>('/auth/password/check-breach', { password })
      return response.data
    } catch (error) {
      return { isBreached: false }
    }
  }
  
  // Profile management
  async function updateProfile(updates: Partial<User>): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const updateData: any = {}
      
      if (updates.firstName && updates.lastName) {
        updateData.name = `${updates.firstName} ${updates.lastName}`
      }
      if (updates.avatar) updateData.image = updates.avatar
      
      const { data, error } = await authClient.updateUser(updateData)
      if (error) throw new Error(error.message || 'Update failed')
      
      if (data) {
        user.value = { ...user.value, ...updates }
        return { success: true, data: user.value }
      }
      
      throw new Error('Invalid response from server')
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Device management
  async function getDevices(): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await apiClient.get<Device[]>('/auth/devices')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function revokeDevice(deviceId: string): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.delete(`/auth/devices/${deviceId}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function getSecurityEvents(): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await apiClient.get<SecurityEvent[]>('/auth/security-events')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // API Key management
  async function createApiKey(data: CreateApiKeyRequest): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await apiClient.post<ApiKey>('/auth/api-keys', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function getApiKeys(): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      const response = await apiClient.get<ApiKey[]>('/auth/api-keys')
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function revokeApiKey(keyId: string): Promise<AuthActionResult> {
    if (!user.value) return { success: false, error: 'Not authenticated' }
    
    try {
      await apiClient.delete(`/auth/api-keys/${keyId}`)
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Captcha verification
  async function verifyCaptcha(data: CaptchaVerification): Promise<AuthActionResult> {
    try {
      const response = await apiClient.post('/auth/captcha/verify', data)
      return { success: true, data: response.data }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Session management
  async function getSession(): Promise<void> {
    try {
      isLoading.value = true
      const { data } = await authClient.getSession()
      user.value = data?.user ? transformUser(data.user as BetterAuthUser) : null
    } catch (error) {
      console.error('Session check failed:', error)
      user.value = null
    } finally {
      isLoading.value = false
    }
  }
  
  async function refreshSession(): Promise<AuthActionResult> {
    try {
      const { data, error } = await authClient.getSession()
      
      if (error) throw new Error(error.message || 'Session refresh failed')
      
      user.value = data?.user ? transformUser(data.user as BetterAuthUser) : null
      return { success: true, data: user.value }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  // Initialize session on mount
  onMounted(() => {
    getSession()
  })
  
  return {
    // State
    user,
    isLoading,
    
    // Computed
    isAuthenticated,
    userProfile,
    isAdmin,
    isTwoFactorEnabled,
    isEmailVerified,
    isPhoneVerified,
    
    // Basic auth
    signIn,
    signUp,
    signInWithSocial,
    signOut,
    
    // Two-factor auth
    setupTwoFactor,
    verifyTwoFactorSetup,
    disableTwoFactor,
    verifyTwoFactor,
    generateBackupCodes,
    
    // Phone verification
    addPhoneNumber,
    verifyPhoneNumber,
    removePhoneNumber,
    
    // Email OTP & verification
    sendEmailOTP,
    verifyEmailOTP,
    sendVerificationEmail,
    verifyEmail,
    
    // Password management
    changePassword,
    forgotPassword,
    resetPassword,
    checkPasswordBreach,
    
    // Profile
    updateProfile,
    
    // Security & devices
    getDevices,
    revokeDevice,
    getSecurityEvents,
    
    // API keys
    createApiKey,
    getApiKeys,
    revokeApiKey,
    
    // Captcha
    verifyCaptcha,
    
    // Session
    getSession,
    refreshSession,
  }
}

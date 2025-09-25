// src/stores/auth.ts - Enhanced Better Auth Store
import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth'
import type { User, BetterAuthUser, SessionData } from '@/types/auth.types'
import { transformUser } from '@/types/auth.types'

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null)
  const session = ref<SessionData['session'] | null>(null)
  const isLoading = ref(false)
  const isInitialized = ref(false)
  const router = useRouter()
  
  // Getters
  const isAuthenticated = computed(() => !!user.value)
  const fullName = computed(() => 
    user.value ? `${user.value.firstName || ''} ${user.value.lastName || ''}`.trim() || user.value.name : ''
  )
  const userRole = computed(() => user.value?.role || 'user')
  const isAdmin = computed(() => userRole.value === 'admin')
  
  // Actions
  async function signIn(email: string, password: string, rememberMe: boolean = false) {
    isLoading.value = true
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
        rememberMe
      })
      
      if (error) throw new Error(error.message || 'Sign in failed')
      
      if (data?.user) {
        user.value = transformUser(data.user as BetterAuthUser)
        // Better Auth doesn't return session in sign-in response, get it separately
        await getSession()
        return { success: true, user: user.value }
      }
      
      throw new Error('Invalid response from server')
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function signUp(email: string, password: string, name: string) {
    isLoading.value = true
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name
      })
      
      if (error) throw new Error(error.message || 'Sign up failed')
      
      if (data?.user) {
        user.value = transformUser(data.user as BetterAuthUser)
        // Better Auth doesn't return session in sign-up response, get it separately
        await getSession()
        return { success: true, user: user.value }
      }
      
      throw new Error('Invalid response from server')
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function signInWithGoogle(callbackURL: string = '/dashboard') {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL
      })
    } catch (error: any) {
      console.error('Google sign-in failed:', error)
      throw error
    }
  }
  
  async function signInWithGitHub(callbackURL: string = '/dashboard') {
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL
      })
    } catch (error: any) {
      console.error('GitHub sign-in failed:', error)
      throw error
    }
  }
  
  async function signOut() {
    try {
      await authClient.signOut()
      user.value = null
      session.value = null
    } catch (error: any) {
      console.error('Sign out failed:', error)
    }
  }
  
  async function updateProfile(updates: Partial<User>) {
    if (!user.value) throw new Error('No user signed in')
    
    isLoading.value = true
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
        return { success: true, user: user.value }
      }
      
      throw new Error('Invalid response from server')
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function changePassword(currentPassword: string, newPassword: string) {
    if (!user.value) throw new Error('No user signed in')
    
    isLoading.value = true
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
    } finally {
      isLoading.value = false
    }
  }
  
  async function forgotPassword(email: string) {
    isLoading.value = true
    try {
      const { error } = await authClient.forgetPassword({
        email,
        redirectTo: '/reset-password'
      })
      
      if (error) throw new Error(error.message || 'Password reset request failed')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function resetPassword(token: string, newPassword: string) {
    isLoading.value = true
    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword
      })
      
      if (error) throw new Error(error.message || 'Password reset failed')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function verifyEmail(token: string) {
    isLoading.value = true
    try {
      const { error } = await authClient.verifyEmail({
        query: { token }
      })
      
      if (error) throw new Error(error.message || 'Email verification failed')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function resendVerificationEmail() {
    if (!user.value?.email) throw new Error('No user email available')
    
    isLoading.value = true
    try {
      const { error } = await authClient.sendVerificationEmail({
        email: user.value.email
      })
      
      if (error) throw new Error(error.message || 'Failed to send verification email')
      
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    } finally {
      isLoading.value = false
    }
  }
  
  async function getSession() {
    if (!isInitialized.value) {
      isLoading.value = true
    }
    
    try {
      const { data } = await authClient.getSession()
      
      if (data?.user) {
        user.value = transformUser(data.user as BetterAuthUser)
        session.value = data.session ? {
          id: data.session.id,
          token: data.session.token,
          expiresAt: data.session.expiresAt,
          ipAddress: data.session.ipAddress || undefined,
          userAgent: data.session.userAgent || undefined,
          createdAt: data.session.createdAt,
          updatedAt: data.session.updatedAt
        } : null
      } else {
        user.value = null
        session.value = null
      }
      
      return { user: user.value, session: session.value }
    } catch (error: any) {
      console.error('Session check failed:', error)
      user.value = null
      session.value = null
      return { user: null, session: null }
    } finally {
      isLoading.value = false
      isInitialized.value = true
    }
  }
  
  // Initialize auth on store creation
  getSession()
  
  // Watch for route changes to update session
  watch(() => router.currentRoute.value, async () => {
    if (isAuthenticated.value) {
      await getSession()
    }
  })
  
  return {
    // State
    user,
    session,
    isLoading,
    isInitialized,
    
    // Getters
    isAuthenticated,
    fullName,
    userRole,
    isAdmin,
    
    // Actions
    signIn,
    signUp,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerificationEmail,
    getSession
  }
})

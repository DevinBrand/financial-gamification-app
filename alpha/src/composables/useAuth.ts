// src/composables/useAuth.ts - Vue Integration
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { authClient } from '@/lib/auth'
import type { User, BetterAuthUser } from '@/types/auth.types'
import { transformUser } from '@/types/auth.types'

export function useAuth() {
  const user = ref<User | null>(null)
  const isLoading = ref(true)
  const router = useRouter()
  
  const isAuthenticated = computed(() => !!user.value)
  const userProfile = computed(() => user.value)
  
  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      })
      
      if (error) throw new Error(error.message || 'Sign in failed')
      
      user.value = data?.user ? transformUser(data.user as BetterAuthUser) : null
      router.push('/dashboard')
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function signUp(email: string, password: string, firstName: string, lastName: string) {
    try {
      const { data, error } = await authClient.signUp.email({
        email,
        password,
        name: `${firstName} ${lastName}`,
      })
      
      if (error) throw new Error(error.message || 'Sign up failed')
      
      user.value = data?.user ? transformUser(data.user as BetterAuthUser) : null
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function signInWithGoogle() {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      })
    } catch (error: any) {
      console.error('Google sign-in failed:', error)
    }
  }
  
  async function signOut() {
    try {
      await authClient.signOut()
      user.value = null
      router.push('/login')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }
  
  async function updateProfile(updates: Partial<User>) {
    try {
      const updateData: any = {
        name: updates.firstName && updates.lastName ? `${updates.firstName} ${updates.lastName}` : updates.name,
        image: updates.avatar,
      }
      
      const { data, error } = await authClient.updateUser(updateData)
      if (error) throw new Error(error.message || 'Update failed')
      
      if (data && user.value) {
        user.value = { ...user.value, ...updates }
      }
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }
  
  async function getSession() {
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
  
  onMounted(() => {
    getSession()
  })
  
  return {
    user,
    isLoading,
    isAuthenticated,
    userProfile,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    updateProfile,
    getSession,
  }
}

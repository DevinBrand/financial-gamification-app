<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
    <div class="card bg-base-100 w-full max-w-md shadow-2xl">
      <div class="card-body text-center">
        <!-- Loading State -->
        <div v-if="isVerifying" class="space-y-4">
          <span class="loading loading-spinner loading-lg text-primary"></span>
          <h2 class="text-2xl font-bold">Verifying Email...</h2>
          <p class="text-base-content/70">Please wait while we verify your email address.</p>
        </div>

        <!-- Success State -->
        <div v-else-if="verificationResult?.success" class="space-y-4">
          <div class="text-success">
            <font-awesome-icon icon="check-circle" class="w-16 h-16" />
          </div>
          <h2 class="text-2xl font-bold text-success">Email Verified!</h2>
          <p class="text-base-content/70">
            Your email address has been successfully verified. You can now access all features.
          </p>
          <button @click="$router.push('/dashboard')" class="btn btn-primary">
            Go to Dashboard
          </button>
        </div>

        <!-- Error State -->
        <div v-else class="space-y-4">
          <div class="text-error">
            <font-awesome-icon icon="exclamation-circle" class="w-16 h-16" />
          </div>
          <h2 class="text-2xl font-bold text-error">Verification Failed</h2>
          <p class="text-base-content/70">
            {{ verificationResult?.error || 'The verification link is invalid or has expired.' }}
          </p>
          <div class="space-y-2">
            <button
              @click="resendVerification"
              class="btn btn-primary w-full"
              :class="{ 'loading': isResending }"
              :disabled="isResending"
            >
              {{ isResending ? 'Sending...' : 'Resend Verification Email' }}
            </button>
            <router-link to="/auth" class="btn btn-ghost w-full">
              Back to Login
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from 'vue-toastification'

const route = useRoute()
const { verifyEmail, sendVerificationEmail } = useAuth()
const toast = useToast()

// State
const isVerifying = ref(true)
const isResending = ref(false)
const verificationResult = ref<{ success: boolean; error?: string } | null>(null)

// Verify email
async function verifyEmailToken() {
  const token = route.query.token as string
  
  if (!token) {
    verificationResult.value = { success: false, error: 'No verification token provided' }
    isVerifying.value = false
    return
  }

  try {
    const result = await verifyEmail(token)
    verificationResult.value = result
  } catch (err: any) {
    verificationResult.value = { success: false, error: err.message }
  } finally {
    isVerifying.value = false
  }
}

// Resend verification email
async function resendVerification() {
  isResending.value = true
  
  try {
    const result = await sendVerificationEmail()
    if (result.success) {
      toast.success('Verification email sent! Check your inbox.')
    } else {
      toast.error(result.error || 'Failed to send verification email')
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to send verification email')
  } finally {
    isResending.value = false
  }
}

// Initialize
onMounted(() => {
  verifyEmailToken()
})
</script>
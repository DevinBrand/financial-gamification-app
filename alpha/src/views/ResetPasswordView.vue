<template>
  <div class="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex items-center justify-center p-4">
    <div class="card bg-base-100 w-full max-w-md shadow-2xl">
      <div class="card-body">
        <div class="text-center mb-6">
          <h2 class="text-3xl font-bold text-primary">Reset Password</h2>
          <p class="text-base-content/70 mt-2">Enter your new password</p>
        </div>

        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- New Password -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">New Password</span>
            </label>
            <div class="relative">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your new password"
                class="input input-bordered w-full pr-12"
                :class="{ 'input-error': errors.password }"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-3"
              >
                <font-awesome-icon
                  :icon="showPassword ? 'eye-slash' : 'eye'"
                  class="w-5 h-5 text-base-content/50"
                />
              </button>
            </div>
            <label v-if="errors.password" class="label">
              <span class="label-text-alt text-error">{{ errors.password }}</span>
            </label>
          </div>

          <!-- Confirm Password -->
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Confirm Password</span>
            </label>
            <input
              v-model="formData.confirmPassword"
              type="password"
              placeholder="Confirm your new password"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.confirmPassword }"
              required
            />
            <label v-if="errors.confirmPassword" class="label">
              <span class="label-text-alt text-error">{{ errors.confirmPassword }}</span>
            </label>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert alert-error">
            <font-awesome-icon icon="exclamation-circle" />
            <span>{{ error }}</span>
          </div>

          <!-- Submit Button -->
          <div class="form-control mt-6">
            <button
              type="submit"
              class="btn btn-primary w-full"
              :class="{ 'loading': isLoading }"
              :disabled="isLoading"
            >
              {{ isLoading ? 'Resetting...' : 'Reset Password' }}
            </button>
          </div>
        </form>

        <!-- Back to Login -->
        <div class="text-center mt-6">
          <router-link to="/auth" class="link link-primary">
            ← Back to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { useToast } from 'vue-toastification'

const route = useRoute()
const router = useRouter()
const { resetPassword } = useAuth()
const toast = useToast()

// Form state
const formData = reactive({
  password: '',
  confirmPassword: ''
})

// UI state
const isLoading = ref(false)
const showPassword = ref(false)
const error = ref('')
const errors = reactive({
  password: '',
  confirmPassword: ''
})

const token = ref('')

// Validation
function validateForm() {
  errors.password = ''
  errors.confirmPassword = ''

  if (!formData.password) {
    errors.password = 'Password is required'
    return false
  }

  if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    return false
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    return false
  }

  return true
}

// Handle form submission
async function handleSubmit() {
  if (!validateForm()) return
  if (!token.value) {
    error.value = 'Invalid reset token'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = await resetPassword(token.value, formData.password)
    
    if (result.success) {
      toast.success('Password reset successfully!')
      router.push('/auth')
    } else {
      error.value = result.error || 'Password reset failed'
    }
  } catch (err: any) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

// Initialize
onMounted(() => {
  token.value = route.query.token as string || ''
  if (!token.value) {
    router.push('/auth')
  }
})
</script>
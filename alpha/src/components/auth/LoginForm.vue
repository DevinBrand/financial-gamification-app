<template>
  <div class="card bg-base-100 w-full max-w-md shadow-2xl">
    <div class="card-body">
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold text-primary">Welcome Back</h2>
        <p class="text-base-content/70 mt-2">Sign in to your account</p>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Email Input -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Email</span>
          </label>
          <input
            v-model="formData.email"
            type="email"
            placeholder="Enter your email"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.email }"
            required
          />
          <label v-if="errors.email" class="label">
            <span class="label-text-alt text-error">{{ errors.email }}</span>
          </label>
        </div>

        <!-- Password Input -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Password</span>
            <button
              type="button"
              @click="showForgotPassword = true"
              class="label-text-alt link link-primary"
            >
              Forgot password?
            </button>
          </label>
          <div class="relative">
            <input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Enter your password"
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

        <!-- Remember Me -->
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input
              v-model="formData.rememberMe"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">Remember me</span>
          </label>
        </div>

        <!-- Error Message -->
        <div v-if="error" class="alert alert-error">
          <font-awesome-icon icon="exclamation-circle" />
          <span>{{ error }}</span>
        </div>

        <!-- Two Factor Code (if required) -->
        <div v-if="requiresTwoFactor" class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Two-Factor Authentication Code</span>
          </label>
          <input
            v-model="formData.twoFactorCode"
            type="text"
            placeholder="Enter your 6-digit code"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.twoFactorCode }"
            maxlength="6"
            required
          />
          <label v-if="errors.twoFactorCode" class="label">
            <span class="label-text-alt text-error">{{ errors.twoFactorCode }}</span>
          </label>
        </div>

        <!-- Submit Button -->
        <div class="form-control mt-6">
          <button
            type="submit"
            class="btn btn-primary w-full"
            :class="{ 'loading': isLoading }"
            :disabled="isLoading"
          >
            {{ isLoading ? 'Signing In...' : 'Sign In' }}
          </button>
        </div>
      </form>

      <!-- Divider -->
      <div class="divider">OR</div>

      <!-- OAuth Buttons -->
      <div class="space-y-3">
        <button
          @click="handleOAuthLogin('google')"
          class="btn btn-outline w-full"
          :disabled="isLoading"
        >
          <font-awesome-icon :icon="['fab', 'google']" class="w-5 h-5" />
          Continue with Google
        </button>
        <button
          @click="handleOAuthLogin('github')"
          class="btn btn-outline w-full"
          :disabled="isLoading"
        >
          <font-awesome-icon :icon="['fab', 'github']" class="w-5 h-5" />
          Continue with GitHub
        </button>
        <button
          @click="handleOAuthLogin('discord')"
          class="btn btn-outline w-full"
          :disabled="isLoading"
        >
          <font-awesome-icon :icon="['fab', 'discord']" class="w-5 h-5" />
          Continue with Discord
        </button>
      </div>

      <!-- Email OTP -->
      <div class="divider">OR</div>
      
      <button
        @click="showEmailOTP = !showEmailOTP"
        class="btn btn-ghost w-full"
        :disabled="isLoading"
      >
        <font-awesome-icon icon="envelope" class="w-5 h-5" />
        Sign in with Email Code
      </button>

      <!-- Email OTP Form -->
      <div v-if="showEmailOTP" class="mt-4 p-4 bg-base-200 rounded-lg">
        <div v-if="!otpSent" class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Email for OTP</span>
            </label>
            <input
              v-model="otpEmail"
              type="email"
              placeholder="Enter your email"
              class="input input-bordered w-full input-sm"
              required
            />
          </div>
          <button
            @click="sendEmailOTPCode"
            class="btn btn-primary btn-sm w-full"
            :class="{ 'loading': isSendingOTP }"
            :disabled="isSendingOTP || !otpEmail"
          >
            {{ isSendingOTP ? 'Sending...' : 'Send Code' }}
          </button>
        </div>

        <div v-else class="space-y-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Enter the 6-digit code sent to your email</span>
            </label>
            <input
              v-model="otpCode"
              type="text"
              placeholder="123456"
              class="input input-bordered w-full input-sm"
              maxlength="6"
              required
            />
          </div>
          <div class="flex gap-2">
            <button
              @click="verifyEmailOTPCode"
              class="btn btn-primary btn-sm flex-1"
              :class="{ 'loading': isVerifyingOTP }"
              :disabled="isVerifyingOTP || !otpCode || otpCode.length !== 6"
            >
              {{ isVerifyingOTP ? 'Verifying...' : 'Verify Code' }}
            </button>
            <button
              @click="resetEmailOTP"
              class="btn btn-ghost btn-sm"
            >
              Back
            </button>
          </div>
        </div>
      </div>

      <!-- Switch to Register -->
      <div class="text-center mt-6">
        <p class="text-base-content/70">
          Don't have an account?
          <button
            @click="$emit('switch-to-register')"
            class="link link-primary font-semibold"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>

    <!-- Forgot Password Modal -->
    <div v-if="showForgotPassword" class="modal modal-open">
      <div class="modal-box">
        <h3 class="font-bold text-lg">Reset Password</h3>
        <div class="py-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text">Email address</span>
            </label>
            <input
              v-model="resetEmail"
              type="email"
              placeholder="Enter your email"
              class="input input-bordered w-full"
            />
          </div>
        </div>
        <div class="modal-action">
          <button
            @click="handleForgotPassword"
            class="btn btn-primary"
            :class="{ 'loading': isSendingReset }"
            :disabled="isSendingReset || !resetEmail"
          >
            {{ isSendingReset ? 'Sending...' : 'Send Reset Link' }}
          </button>
          <button @click="showForgotPassword = false" class="btn">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

const emit = defineEmits<{
  'switch-to-register': []
}>()

const { signIn, signInWithSocial, sendEmailOTP, verifyEmailOTP, forgotPassword } = useAuth()
const router = useRouter()
const toast = useToast()

// Form state
const formData = reactive({
  email: '',
  password: '',
  rememberMe: false,
  twoFactorCode: ''
})

// UI state
const isLoading = ref(false)
const showPassword = ref(false)
const error = ref('')
const errors = reactive({
  email: '',
  password: '',
  twoFactorCode: ''
})
const requiresTwoFactor = ref(false)

// Email OTP state
const showEmailOTP = ref(false)
const otpSent = ref(false)
const otpEmail = ref('')
const otpCode = ref('')
const isSendingOTP = ref(false)
const isVerifyingOTP = ref(false)

// Forgot password state
const showForgotPassword = ref(false)
const resetEmail = ref('')
const isSendingReset = ref(false)

// Validation
function validateForm() {
  errors.email = ''
  errors.password = ''
  errors.twoFactorCode = ''

  if (!formData.email) {
    errors.email = 'Email is required'
    return false
  }

  if (!formData.password) {
    errors.password = 'Password is required'
    return false
  }

  if (requiresTwoFactor.value && !formData.twoFactorCode) {
    errors.twoFactorCode = 'Two-factor code is required'
    return false
  }

  return true
}

// Handle form submission
async function handleSubmit() {
  if (!validateForm()) return

  isLoading.value = true
  error.value = ''

  try {
    const result = await signIn(formData.email, formData.password, formData.rememberMe)
    
    if (result.success) {
      toast.success('Successfully signed in!')
      router.push('/dashboard')
    } else {
      if (result.error?.includes('two-factor') || result.error?.includes('2FA')) {
        requiresTwoFactor.value = true
        error.value = 'Please enter your two-factor authentication code'
      } else {
        error.value = result.error || 'Sign in failed'
      }
    }
  } catch (err: any) {
    error.value = err.message || 'An unexpected error occurred'
  } finally {
    isLoading.value = false
  }
}

// Handle OAuth login
async function handleOAuthLogin(provider: string) {
  try {
    await signInWithSocial(provider as any, '/dashboard')
  } catch (err: any) {
    toast.error(err.message || `Failed to sign in with ${provider}`)
  }
}

// Handle email OTP
async function sendEmailOTPCode() {
  if (!otpEmail.value) return

  isSendingOTP.value = true
  try {
    const result = await sendEmailOTP({ email: otpEmail.value })
    if (result.success) {
      otpSent.value = true
      toast.success('Verification code sent to your email!')
    } else {
      toast.error(result.error || 'Failed to send verification code')
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to send verification code')
  } finally {
    isSendingOTP.value = false
  }
}

async function verifyEmailOTPCode() {
  if (!otpEmail.value || !otpCode.value) return

  isVerifyingOTP.value = true
  try {
    const result = await verifyEmailOTP({ email: otpEmail.value, code: otpCode.value })
    if (result.success) {
      toast.success('Successfully signed in!')
      router.push('/dashboard')
    } else {
      toast.error(result.error || 'Invalid verification code')
    }
  } catch (err: any) {
    toast.error(err.message || 'Verification failed')
  } finally {
    isVerifyingOTP.value = false
  }
}

function resetEmailOTP() {
  otpSent.value = false
  otpEmail.value = ''
  otpCode.value = ''
}

// Handle forgot password
async function handleForgotPassword() {
  if (!resetEmail.value) return

  isSendingReset.value = true
  try {
    const result = await forgotPassword(resetEmail.value)
    if (result.success) {
      toast.success('Password reset link sent to your email!')
      showForgotPassword.value = false
      resetEmail.value = ''
    } else {
      toast.error(result.error || 'Failed to send reset link')
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to send reset link')
  } finally {
    isSendingReset.value = false
  }
}
</script>
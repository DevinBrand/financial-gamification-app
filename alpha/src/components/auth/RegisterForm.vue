<template>
  <div class="card bg-base-100 w-full max-w-2xl shadow-2xl">
    <div class="card-body">
      <div class="text-center mb-6">
        <h2 class="text-3xl font-bold text-primary">Create Account</h2>
        <p class="text-base-content/70 mt-2">Sign up to get started</p>
      </div>

      <!-- Registration Steps -->
      <div class="steps steps-horizontal w-full mb-8">
        <div class="step" :class="{ 'step-primary': currentStep >= 1 }">Account</div>
        <div class="step" :class="{ 'step-primary': currentStep >= 2 }">Subscription</div>
        <div class="step" :class="{ 'step-primary': currentStep >= 3 }">Complete</div>
      </div>

      <!-- Step 1: Account Information -->
      <form v-if="currentStep === 1" @submit.prevent="handleAccountSubmit" class="space-y-4">
        <!-- Name Fields -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">First Name</span>
            </label>
            <input
              v-model="formData.firstName"
              type="text"
              placeholder="First name"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.firstName }"
              required
            />
            <label v-if="errors.firstName" class="label">
              <span class="label-text-alt text-error">{{ errors.firstName }}</span>
            </label>
          </div>

          <div class="form-control">
            <label class="label">
              <span class="label-text font-semibold">Last Name</span>
            </label>
            <input
              v-model="formData.lastName"
              type="text"
              placeholder="Last name"
              class="input input-bordered w-full"
              :class="{ 'input-error': errors.lastName }"
              required
            />
            <label v-if="errors.lastName" class="label">
              <span class="label-text-alt text-error">{{ errors.lastName }}</span>
            </label>
          </div>
        </div>

        <!-- Email -->
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

        <!-- Password -->
        <div class="form-control">
          <label class="label">
            <span class="label-text font-semibold">Password</span>
          </label>
          <div class="relative">
            <input
              v-model="formData.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="Create a password"
              class="input input-bordered w-full pr-12"
              :class="{ 'input-error': errors.password }"
              required
              @input="checkPasswordStrength"
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
          
          <!-- Password Strength Indicator -->
          <div v-if="formData.password" class="mt-2">
            <div class="flex items-center gap-2">
              <progress
                class="progress w-24"
                :class="{
                  'progress-error': passwordStrength.score <= 1,
                  'progress-warning': passwordStrength.score === 2,
                  'progress-success': passwordStrength.score >= 3
                }"
                :value="passwordStrength.score"
                max="4"
              ></progress>
              <span class="text-xs" :class="{
                'text-error': passwordStrength.score <= 1,
                'text-warning': passwordStrength.score === 2,
                'text-success': passwordStrength.score >= 3
              }">
                {{ passwordStrength.label }}
              </span>
            </div>
            <div v-if="passwordBreach.isBreached" class="alert alert-warning mt-2">
              <font-awesome-icon icon="exclamation-triangle" />
              <span class="text-xs">{{ passwordBreach.warning }}</span>
            </div>
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
            placeholder="Confirm your password"
            class="input input-bordered w-full"
            :class="{ 'input-error': errors.confirmPassword }"
            required
          />
          <label v-if="errors.confirmPassword" class="label">
            <span class="label-text-alt text-error">{{ errors.confirmPassword }}</span>
          </label>
        </div>

        <!-- Terms and Privacy -->
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input
              v-model="formData.agreeToTerms"
              type="checkbox"
              class="checkbox checkbox-primary"
              required
            />
            <span class="label-text">
              I agree to the 
              <a href="/terms" class="link link-primary" target="_blank">Terms of Service</a> 
              and 
              <a href="/privacy" class="link link-primary" target="_blank">Privacy Policy</a>
            </span>
          </label>
        </div>

        <!-- Marketing consent -->
        <div class="form-control">
          <label class="cursor-pointer label justify-start gap-3">
            <input
              v-model="formData.marketingConsent"
              type="checkbox"
              class="checkbox checkbox-primary"
            />
            <span class="label-text">Send me product updates and marketing emails</span>
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
            :disabled="isLoading || !formData.agreeToTerms"
          >
            {{ isLoading ? 'Creating Account...' : 'Continue to Subscription' }}
          </button>
        </div>
      </form>

      <!-- Step 2: Subscription Selection -->
      <div v-if="currentStep === 2" class="space-y-6">
        <div v-if="loadingPlans" class="flex justify-center">
          <span class="loading loading-spinner loading-lg"></span>
        </div>

        <div v-else-if="subscriptionPlans.length > 0" class="space-y-4">
          <h3 class="text-xl font-bold text-center">Choose Your Plan</h3>
          
          <!-- Plan Cards -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              v-for="plan in subscriptionPlans"
              :key="plan.id"
              class="card bg-base-100 border-2 cursor-pointer transition-all"
              :class="{
                'border-primary': selectedPlan?.id === plan.id,
                'border-base-300': selectedPlan?.id !== plan.id,
                'shadow-lg': plan.popular
              }"
              @click="selectedPlan = plan"
            >
              <div class="card-body relative">
                <div v-if="plan.popular" class="badge badge-primary absolute -top-2 -right-2">
                  Popular
                </div>
                
                <h4 class="card-title">{{ plan.name }}</h4>
                <div class="text-3xl font-bold text-primary">
                  ${{ plan.price }}
                  <span class="text-base font-normal text-base-content/60">
                    /{{ plan.interval }}
                  </span>
                </div>
                
                <p class="text-sm text-base-content/70">{{ plan.description }}</p>
                
                <ul class="space-y-2 mt-4">
                  <li v-for="feature in plan.features" :key="feature" class="flex items-center gap-2">
                    <font-awesome-icon icon="check" class="text-success w-4 h-4" />
                    <span class="text-sm">{{ feature }}</span>
                  </li>
                </ul>

                <div class="card-actions justify-end mt-4">
                  <input
                    type="radio"
                    :value="plan.id"
                    v-model="selectedPlanId"
                    class="radio radio-primary"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Free Plan Option -->
          <div class="divider">OR</div>
          
          <div
            class="card bg-base-100 border-2 cursor-pointer transition-all"
            :class="{
              'border-primary': selectedPlanId === 'free',
              'border-base-300': selectedPlanId !== 'free'
            }"
            @click="selectedPlanId = 'free'"
          >
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="card-title">Start with Free Plan</h4>
                  <p class="text-base-content/70">You can upgrade anytime</p>
                </div>
                <input
                  type="radio"
                  value="free"
                  v-model="selectedPlanId"
                  class="radio radio-primary"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex justify-between mt-8">
          <button @click="currentStep = 1" class="btn btn-ghost">
            <font-awesome-icon icon="arrow-left" />
            Back
          </button>
          <button
            @click="handleSubscriptionSubmit"
            class="btn btn-primary"
            :class="{ 'loading': isProcessingSubscription }"
            :disabled="isProcessingSubscription || !selectedPlanId"
          >
            {{ isProcessingSubscription ? 'Processing...' : selectedPlanId === 'free' ? 'Create Account' : 'Proceed to Payment' }}
          </button>
        </div>
      </div>

      <!-- Step 3: Completion -->
      <div v-if="currentStep === 3" class="text-center space-y-6">
        <div class="text-success">
          <font-awesome-icon icon="check-circle" class="w-16 h-16" />
        </div>
        <h3 class="text-2xl font-bold">Account Created Successfully!</h3>
        <p class="text-base-content/70">
          {{ selectedPlanId === 'free' 
            ? 'Welcome to our platform! You can upgrade your plan anytime from your dashboard.'
            : 'Your subscription has been set up successfully. Welcome to our platform!'
          }}
        </p>
        
        <div v-if="!isEmailVerified" class="alert alert-warning">
          <font-awesome-icon icon="envelope" />
          <span>Please check your email to verify your account</span>
        </div>

        <div class="space-y-3">
          <button @click="$router.push('/dashboard')" class="btn btn-primary w-full">
            Go to Dashboard
          </button>
          <button
            v-if="!isEmailVerified"
            @click="resendVerificationEmail"
            class="btn btn-ghost w-full"
            :class="{ 'loading': isResendingEmail }"
            :disabled="isResendingEmail"
          >
            {{ isResendingEmail ? 'Sending...' : 'Resend Verification Email' }}
          </button>
        </div>
      </div>

      <!-- OAuth Registration (shown on step 1) -->
      <div v-if="currentStep === 1" class="space-y-4">
        <!-- Divider -->
        <div class="divider">OR</div>

        <!-- OAuth Buttons -->
        <div class="space-y-3">
          <button
            @click="handleOAuthRegister('google')"
            class="btn btn-outline w-full"
            :disabled="isLoading"
          >
            <font-awesome-icon :icon="['fab', 'google']" class="w-5 h-5" />
            Continue with Google
          </button>
          <button
            @click="handleOAuthRegister('github')"
            class="btn btn-outline w-full"
            :disabled="isLoading"
          >
            <font-awesome-icon :icon="['fab', 'github']" class="w-5 h-5" />
            Continue with GitHub
          </button>
          <button
            @click="handleOAuthRegister('discord')"
            class="btn btn-outline w-full"
            :disabled="isLoading"
          >
            <font-awesome-icon :icon="['fab', 'discord']" class="w-5 h-5" />
            Continue with Discord
          </button>
        </div>

        <!-- Switch to Login -->
        <div class="text-center mt-6">
          <p class="text-base-content/70">
            Already have an account?
            <button
              @click="$emit('switch-to-login')"
              class="link link-primary font-semibold"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { apiClient } from '@/services/api/client'
import type { SubscriptionPlan } from '@/types/auth.types'

const emit = defineEmits<{
  'switch-to-login': []
}>()

const { signUp, signInWithSocial, checkPasswordBreach, sendVerificationEmail } = useAuth()
const router = useRouter()
const toast = useToast()

// Form state
const currentStep = ref(1)
const formData = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
  marketingConsent: false
})

// UI state
const isLoading = ref(false)
const showPassword = ref(false)
const error = ref('')
const errors = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

// Password strength
const passwordStrength = ref({ score: 0, label: 'Very Weak' })
const passwordBreach = ref({ isBreached: false, warning: '' })

// Subscription state
const subscriptionPlans = ref<SubscriptionPlan[]>([])
const loadingPlans = ref(false)
const selectedPlan = ref<SubscriptionPlan | null>(null)
const selectedPlanId = ref('')
const isProcessingSubscription = ref(false)

// Completion state
const isEmailVerified = ref(false)
const isResendingEmail = ref(false)

// Password strength checker
function getPasswordStrength(password: string) {
  let score = 0
  let label = 'Very Weak'

  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  switch (score) {
    case 0:
    case 1:
      label = 'Very Weak'
      break
    case 2:
      label = 'Weak'
      break
    case 3:
      label = 'Fair'
      break
    case 4:
      label = 'Good'
      break
    case 5:
      label = 'Strong'
      break
  }

  return { score, label }
}

// Check password strength and breach
async function checkPasswordStrength() {
  if (!formData.password) {
    passwordStrength.value = { score: 0, label: 'Very Weak' }
    passwordBreach.value = { isBreached: false, warning: '' }
    return
  }

  passwordStrength.value = getPasswordStrength(formData.password)

  // Check for breaches (debounced)
  if (formData.password.length >= 8) {
    try {
      const breach = await checkPasswordBreach(formData.password)
      passwordBreach.value = {
        isBreached: breach.isBreached,
        warning: breach.warning || ''
      }
    } catch {
      passwordBreach.value = { isBreached: false, warning: '' }
    }
  }
}

// Validation
function validateStep1() {
  errors.firstName = ''
  errors.lastName = ''
  errors.email = ''
  errors.password = ''
  errors.confirmPassword = ''

  let isValid = true

  if (!formData.firstName) {
    errors.firstName = 'First name is required'
    isValid = false
  }

  if (!formData.lastName) {
    errors.lastName = 'Last name is required'
    isValid = false
  }

  if (!formData.email) {
    errors.email = 'Email is required'
    isValid = false
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    errors.email = 'Please enter a valid email'
    isValid = false
  }

  if (!formData.password) {
    errors.password = 'Password is required'
    isValid = false
  } else if (formData.password.length < 8) {
    errors.password = 'Password must be at least 8 characters'
    isValid = false
  } else if (passwordStrength.value.score < 2) {
    errors.password = 'Password is too weak'
    isValid = false
  }

  if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match'
    isValid = false
  }

  return isValid
}

// Load subscription plans
async function loadSubscriptionPlans() {
  loadingPlans.value = true
  try {
    const response = await apiClient.get<{ success: boolean; data: SubscriptionPlan[] }>('/auth/stripe/plans')
    if (response.data.success) {
      subscriptionPlans.value = response.data.data
    }
  } catch (err: any) {
    console.error('Failed to load subscription plans:', err)
    toast.error('Failed to load subscription plans')
  } finally {
    loadingPlans.value = false
  }
}

// Handle account form submission (Step 1)
async function handleAccountSubmit() {
  if (!validateStep1()) return

  currentStep.value = 2
  if (subscriptionPlans.value.length === 0) {
    await loadSubscriptionPlans()
  }
}

// Handle subscription submission (Step 2)
async function handleSubscriptionSubmit() {
  if (!selectedPlanId.value) return

  isProcessingSubscription.value = true
  error.value = ''

  try {
    // Create account first
    const fullName = `${formData.firstName} ${formData.lastName}`
    const signUpResult = await signUp(formData.email, formData.password, fullName)
    
    if (!signUpResult.success) {
      throw new Error(signUpResult.error || 'Account creation failed')
    }

    // If free plan selected, skip subscription setup
    if (selectedPlanId.value === 'free') {
      currentStep.value = 3
      toast.success('Account created successfully!')
      return
    }

    // For paid plans, redirect to Stripe checkout
    const selectedPlanData = subscriptionPlans.value.find(p => p.id === selectedPlanId.value)
    if (!selectedPlanData) {
      throw new Error('Selected plan not found')
    }

    // Get user's customer ID (this would be from the user object after signup)
    const user = signUpResult.data
    if (!user?.customerId) {
      throw new Error('Customer ID not found')
    }

    // Create checkout session
    const checkoutResponse = await apiClient.post('/auth/stripe/create-checkout', {
      priceId: selectedPlanData.id,
      customerId: user.customerId,
      successUrl: `${window.location.origin}/auth?step=3&success=true`,
      cancelUrl: `${window.location.origin}/auth?step=2`
    })

    if (checkoutResponse.data.success && checkoutResponse.data.data.url) {
      // Redirect to Stripe checkout
      window.location.href = checkoutResponse.data.data.url
    } else {
      throw new Error('Failed to create checkout session')
    }

  } catch (err: any) {
    error.value = err.message || 'Registration failed'
    toast.error(error.value)
  } finally {
    isProcessingSubscription.value = false
  }
}

// Handle OAuth registration
async function handleOAuthRegister(provider: string) {
  try {
    await signInWithSocial(provider as any, '/auth?step=2')
  } catch (err: any) {
    toast.error(err.message || `Failed to register with ${provider}`)
  }
}

// Resend verification email
async function resendVerificationEmail() {
  isResendingEmail.value = true
  try {
    const result = await sendVerificationEmail()
    if (result.success) {
      toast.success('Verification email sent!')
    } else {
      toast.error(result.error || 'Failed to send verification email')
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to send verification email')
  } finally {
    isResendingEmail.value = false
  }
}

// Load plans on mount
onMounted(() => {
  // Check URL params for step (in case coming back from Stripe)
  const urlParams = new URLSearchParams(window.location.search)
  const step = urlParams.get('step')
  const success = urlParams.get('success')
  
  if (step === '3' && success === 'true') {
    currentStep.value = 3
    toast.success('Subscription set up successfully!')
  }
})
</script>
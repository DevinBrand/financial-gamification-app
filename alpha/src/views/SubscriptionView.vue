<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">Subscription Management</h1>
        <p class="text-base-content/70">Manage your subscription and billing</p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center">
        <span class="loading loading-spinner loading-lg"></span>
      </div>

      <!-- Current Subscription -->
      <div v-else-if="currentSubscription" class="space-y-6">
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Current Plan</h2>
            <div class="stats shadow">
              <div class="stat">
                <div class="stat-title">Plan</div>
                <div class="stat-value">{{ currentSubscription.planId }}</div>
                <div class="stat-desc">{{ currentSubscription.status }}</div>
              </div>
              <div class="stat">
                <div class="stat-title">Next Billing</div>
                <div class="stat-value text-lg">{{ formatDate(currentSubscription.currentPeriodEnd) }}</div>
                <div class="stat-desc">Auto-renewal {{ currentSubscription.cancelAtPeriodEnd ? 'disabled' : 'enabled' }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Manage Subscription</h2>
            <div class="space-y-4">
              <button
                @click="handleOpenCustomerPortal"
                class="btn btn-primary"
                :class="{ 'loading': isOpeningPortal }"
                :disabled="isOpeningPortal"
              >
                {{ isOpeningPortal ? 'Opening...' : 'Manage Billing' }}
              </button>
              
              <button
                v-if="!currentSubscription.cancelAtPeriodEnd"
                @click="handleCancelSubscription"
                class="btn btn-error"
                :class="{ 'loading': isCancelling }"
                :disabled="isCancelling"
              >
                {{ isCancelling ? 'Cancelling...' : 'Cancel Subscription' }}
              </button>
              
              <button
                v-else
                @click="handleReactivateSubscription"
                class="btn btn-success"
                :class="{ 'loading': isReactivating }"
                :disabled="isReactivating"
              >
                {{ isReactivating ? 'Reactivating...' : 'Reactivate Subscription' }}
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- No Subscription -->
      <div v-else class="card bg-base-100 shadow">
        <div class="card-body text-center">
          <h2 class="card-title justify-center">No Active Subscription</h2>
          <p class="text-base-content/70">You're currently on the free plan. Upgrade to unlock premium features!</p>
          <div class="card-actions justify-center mt-4">
            <router-link to="/auth?view=register" class="btn btn-primary">Upgrade Now</router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useSubscription } from '@/composables/useSubscription'

const {
  currentSubscription,
  isLoading,
  cancelSubscription,
  reactivateSubscription,
  openCustomerPortal,
  formatDate,
  loadSubscriptions
} = useSubscription()

// Local state
const isOpeningPortal = ref(false)
const isCancelling = ref(false)
const isReactivating = ref(false)

// Actions
async function handleOpenCustomerPortal() {
  isOpeningPortal.value = true
  try {
    await openCustomerPortal()
  } finally {
    isOpeningPortal.value = false
  }
}

async function handleCancelSubscription() {
  if (!currentSubscription.value) return
  
  if (!confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your current billing period.')) {
    return
  }
  
  isCancelling.value = true
  try {
    await cancelSubscription(currentSubscription.value.id)
  } finally {
    isCancelling.value = false
  }
}

async function handleReactivateSubscription() {
  if (!currentSubscription.value) return
  
  isReactivating.value = true
  try {
    await reactivateSubscription(currentSubscription.value.id)
  } finally {
    isReactivating.value = false
  }
}

onMounted(() => {
  loadSubscriptions()
})
</script>
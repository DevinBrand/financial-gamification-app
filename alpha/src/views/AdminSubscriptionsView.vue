<template>
  <div class="min-h-screen bg-base-200">
    <div class="container mx-auto p-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold">Subscription Management</h1>
        <p class="text-base-content/70">Manage user subscriptions and billing</p>
      </div>

      <!-- Permission Check -->
      <div v-if="!hasPermission" class="card bg-base-100 shadow">
        <div class="card-body text-center">
          <div class="text-error text-6xl mb-4">🚫</div>
          <h2 class="card-title justify-center">Access Denied</h2>
          <p class="text-base-content/70">You don't have permission to access this page.</p>
          <div class="card-actions justify-center mt-4">
            <router-link to="/dashboard" class="btn btn-primary">Go to Dashboard</router-link>
          </div>
        </div>
      </div>

      <div v-else class="space-y-6">
        <!-- Stats Cards -->
        <div v-if="stats" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
            </div>
            <div class="stat-title">Total Subscribers</div>
            <div class="stat-value text-primary">{{ stats.totalSubscribers }}</div>
            <div class="stat-desc">{{ stats.activeSubscribers }} active</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
              </svg>
            </div>
            <div class="stat-title">Monthly Revenue</div>
            <div class="stat-value text-success">{{ formatCurrency(stats.monthlyRevenue * 100) }}</div>
            <div class="stat-desc">{{ stats.recentSignups }} new this month</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <div class="stat-title">Churn Rate</div>
            <div class="stat-value text-warning">{{ (stats.churnRate * 100).toFixed(1) }}%</div>
            <div class="stat-desc">{{ stats.canceledThisMonth }} canceled this month</div>
          </div>

          <div class="stat bg-base-100 rounded-lg shadow">
            <div class="stat-figure text-info">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-8 h-8 stroke-current">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
            </div>
            <div class="stat-title">Plans</div>
            <div class="stat-value text-info">{{ Object.keys(stats.planDistribution).length }}</div>
            <div class="stat-desc">Active plans</div>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title mb-4">Filters</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <!-- Status Filter -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Status</span>
                </label>
                <select 
                  v-model="selectedStatus" 
                  @change="applyFilters"
                  class="select select-bordered select-sm"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="trialing">Trialing</option>
                  <option value="canceled">Canceled</option>
                  <option value="past_due">Past Due</option>
                  <option value="incomplete">Incomplete</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>

              <!-- Plan Filter -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Plan</span>
                </label>
                <select 
                  v-model="selectedPlan" 
                  @change="applyFilters"
                  class="select select-bordered select-sm"
                >
                  <option value="">All Plans</option>
                  <option v-for="plan in plans" :key="plan.id" :value="plan.id">
                    {{ plan.name }}
                  </option>
                </select>
              </div>

              <!-- Search -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Search</span>
                </label>
                <input 
                  v-model="searchQuery" 
                  @input="applyFilters"
                  type="text" 
                  placeholder="Email or name..." 
                  class="input input-bordered input-sm"
                />
              </div>

              <!-- Actions -->
              <div class="form-control">
                <label class="label">
                  <span class="label-text">Actions</span>
                </label>
                <div class="flex gap-2">
                  <button @click="resetFilters" class="btn btn-sm btn-outline">
                    Reset
                  </button>
                  <button @click="loadSubscriptions(true)" class="btn btn-sm btn-primary">
                    <svg v-if="isLoading" class="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Subscriptions Table -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <div class="flex justify-between items-center mb-4">
              <h2 class="card-title">Subscriptions</h2>
              <div class="text-sm text-base-content/70">
                Showing {{ subscriptions.length }} of {{ totalSubscriptions }} subscriptions
              </div>
            </div>

            <div v-if="isLoading" class="flex justify-center py-8">
              <span class="loading loading-spinner loading-lg"></span>
            </div>

            <div v-else-if="subscriptions.length === 0" class="text-center py-8">
              <div class="text-base-content/70">No subscriptions found</div>
            </div>

            <div v-else class="overflow-x-auto">
              <table class="table table-zebra">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Next Billing</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="subscription in subscriptions" :key="subscription.id">
                    <td>
                      <div v-if="subscription.user">
                        <div class="font-bold">{{ subscription.user.name }}</div>
                        <div class="text-sm text-base-content/70">{{ subscription.user.email }}</div>
                      </div>
                      <div v-else class="text-base-content/50">Unknown User</div>
                    </td>
                    <td>
                      <div v-if="subscription.plan">
                        <div class="font-medium">{{ subscription.plan.name }}</div>
                        <div class="text-sm text-base-content/70">
                          {{ formatCurrency(subscription.plan.price) }}/{{ subscription.plan.interval }}
                        </div>
                      </div>
                      <div v-else class="text-base-content/50">{{ subscription.planId }}</div>
                    </td>
                    <td>
                      <div class="badge" :class="getStatusColor(subscription.status)">
                        {{ subscription.status }}
                      </div>
                      <div v-if="subscription.cancelAtPeriodEnd" class="text-xs text-warning mt-1">
                        Will cancel
                      </div>
                    </td>
                    <td>
                      <div>{{ formatDate(subscription.createdAt) }}</div>
                    </td>
                    <td>
                      <div>{{ formatDate(subscription.currentPeriodEnd) }}</div>
                      <div class="text-xs text-base-content/70">
                        {{ getDaysFromNow(subscription.currentPeriodEnd) }} days
                      </div>
                    </td>
                    <td>
                      <div class="dropdown dropdown-left">
                        <label tabindex="0" class="btn btn-ghost btn-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-4 h-4 stroke-current">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"></path>
                          </svg>
                        </label>
                        <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a @click="viewSubscriptionDetails(subscription)">View Details</a></li>
                          <li v-if="subscription.status === 'active' && !subscription.cancelAtPeriodEnd">
                            <a @click="handleCancelSubscription(subscription.id)">Cancel Subscription</a>
                          </li>
                          <li v-if="subscription.cancelAtPeriodEnd">
                            <a @click="handleReactivateSubscription(subscription.id)">Reactivate</a>
                          </li>
                          <li><a @click="handleRefundSubscription(subscription.id)">Process Refund</a></li>
                          <li class="divider"></li>
                          <li><a @click="resetUsage(subscription.userId)" class="text-warning">Reset Usage</a></li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex justify-between items-center mt-6">
              <div class="text-sm text-base-content/70">
                Page {{ currentPage }} of {{ totalPages }}
              </div>
              <div class="btn-group">
                <button 
                  @click="previousPage" 
                  :disabled="currentPage === 1"
                  class="btn btn-sm"
                >
                  Previous
                </button>
                <button 
                  v-for="page in visiblePages" 
                  :key="page"
                  @click="goToPage(page)"
                  :class="{ 'btn-active': page === currentPage }"
                  class="btn btn-sm"
                >
                  {{ page }}
                </button>
                <button 
                  @click="nextPage" 
                  :disabled="currentPage === totalPages"
                  class="btn btn-sm"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-100 shadow">
          <div class="card-body">
            <h2 class="card-title">Quick Actions</h2>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <button @click="exportSubscriptions" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export Data
              </button>
              
              <router-link to="/admin/subscriptions/plans" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage Plans
              </button>
              
              <button @click="generateReport" class="btn btn-outline">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
                Generate Report
              </button>
              
              <button @click="loadStats" class="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
                Refresh Stats
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAdminSubscriptions } from '@/composables/useAdminSubscriptions'
import { useToast } from 'vue-toastification'
import type { UserSubscription } from '@/types/subscription.types'

const toast = useToast()

const {
  subscriptions,
  plans,
  stats,
  totalSubscriptions,
  isLoading,
  hasPermission,
  currentPage,
  totalPages,
  loadSubscriptions,
  loadPlans,
  loadStats,
  cancelSubscription,
  reactivateSubscription,
  refundSubscription,
  resetUserUsage,
  updateFilters,
  resetFilters,
  nextPage,
  previousPage,
  goToPage,
  formatCurrency,
  formatDate,
  getStatusColor
} = useAdminSubscriptions()

// Local state for filters
const selectedStatus = ref('')
const selectedPlan = ref('')
const searchQuery = ref('')

// Computed properties
const visiblePages = computed(() => {
  const pages = []
  const start = Math.max(1, currentPage.value - 2)
  const end = Math.min(totalPages.value, currentPage.value + 2)
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
function applyFilters() {
  const filters: Record<string, unknown> = {}
  
  if (selectedStatus.value) {
    filters.status = [selectedStatus.value]
  }
  
  if (selectedPlan.value) {
    filters.planIds = [selectedPlan.value]
  }
  
  if (searchQuery.value.trim()) {
    filters.search = searchQuery.value.trim()
  }
  
  updateFilters(filters)
}

function handleResetFilters() {
  selectedStatus.value = ''
  selectedPlan.value = ''
  searchQuery.value = ''
  resetFilters()
}

async function handleCancelSubscription(subscriptionId: string) {
  const reason = prompt('Reason for cancellation (optional):')
  if (reason !== null) { // User didn't cancel the prompt
    await cancelSubscription(subscriptionId, reason || undefined)
  }
}

async function handleReactivateSubscription(subscriptionId: string) {
  if (confirm('Are you sure you want to reactivate this subscription?')) {
    // Note: reactivateSubscription expects userId and subscriptionId
    // We need to find the subscription and get the userId
    const subscription = subscriptions.value.find(sub => sub.id === subscriptionId)
    if (subscription) {
      await reactivateSubscription(subscriptionId)
    }
  }
}

async function handleRefundSubscription(subscriptionId: string) {
  const amountStr = prompt('Refund amount (leave empty for full refund):')
  if (amountStr !== null) { // User didn't cancel
    const amount = amountStr ? parseFloat(amountStr) * 100 : undefined // Convert to cents
    if (confirm(`Are you sure you want to process ${amount ? `a $${(amount / 100).toFixed(2)}` : 'a full'} refund?`)) {
      await refundSubscription(subscriptionId, amount)
    }
  }
}

async function resetUsage(userId: string) {
  const feature = prompt('Feature to reset (leave empty to reset all):')
  if (feature !== null) { // User didn't cancel
    if (confirm('Are you sure you want to reset usage for this user?')) {
      await resetUserUsage(userId, feature || undefined)
    }
  }
}

function viewSubscriptionDetails(subscription: UserSubscription) {
  // This could open a modal or navigate to a detailed view
  toast.info(`Viewing details for subscription: ${subscription.id}`)
}

function getDaysFromNow(date: Date | string): number {
  const targetDate = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffTime = targetDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

function exportSubscriptions() {
  toast.info('Export functionality would be implemented here')
}

function generateReport() {
  toast.info('Report generation would be implemented here')
}

// Initialize data
onMounted(() => {
  if (hasPermission.value) {
    loadPlans()
  }
})

</script>
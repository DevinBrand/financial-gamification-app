// src/composables/useAdminSubscriptions.ts - Admin subscription management composable
import { ref, computed, onMounted } from 'vue'
import { useAuth } from './useAuth'
import { adminSubscriptionService } from '@/services/api/endpoints/subscription-admin'
import { subscriptionService } from '@/services/api/subscriptions'
import { useToast } from 'vue-toastification'
import type {
  UserSubscription,
  SubscriptionPlan,
  SubscriptionStats,
  AdminSubscriptionFilters,
  AdminAction
} from '@/types/subscription.types'

export function useAdminSubscriptions() {
  const { user, isAdmin } = useAuth()
  const toast = useToast()

  // State
  const subscriptions = ref<UserSubscription[]>([])
  const plans = ref<SubscriptionPlan[]>([])
  const stats = ref<SubscriptionStats | null>(null)
  const adminActions = ref<AdminAction[]>([])
  
  const totalSubscriptions = ref(0)
  const isLoading = ref(false)
  const isLoadingStats = ref(false)
  const isLoadingPlans = ref(false)
  const isLoadingActions = ref(false)

  // Filters
  const filters = ref<AdminSubscriptionFilters>({
    status: undefined,
    planIds: undefined,
    dateRange: undefined,
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 25,
    offset: 0
  })

  // Computed properties
  const hasPermission = computed(() => isAdmin.value)
  
  const activeSubscriptions = computed(() => 
    subscriptions.value.filter(sub => sub.status === 'active' || sub.status === 'trialing')
  )
  
  const canceledSubscriptions = computed(() =>
    subscriptions.value.filter(sub => sub.status === 'canceled')
  )
  
  const pastDueSubscriptions = computed(() =>
    subscriptions.value.filter(sub => sub.status === 'past_due')
  )

  const currentPage = computed(() => Math.floor((filters.value.offset || 0) / (filters.value.limit || 25)) + 1)
  const totalPages = computed(() => Math.ceil(totalSubscriptions.value / (filters.value.limit || 25)))

  // Data loading functions
  async function loadSubscriptions(resetOffset = false) {
    if (!hasPermission.value) {
      toast.error('Insufficient permissions')
      return
    }

    if (resetOffset) {
      filters.value.offset = 0
    }

    isLoading.value = true
    try {
      const result = await adminSubscriptionService.getAllSubscriptions(filters.value)
      subscriptions.value = result.subscriptions
      totalSubscriptions.value = result.total
    } catch (error: any) {
      console.error('Failed to load subscriptions:', error)
      toast.error('Failed to load subscriptions')
    } finally {
      isLoading.value = false
    }
  }

  async function loadPlans() {
    if (!hasPermission.value) return

    isLoadingPlans.value = true
    try {
      plans.value = await subscriptionService.getAvailablePlans()
    } catch (error: any) {
      console.error('Failed to load plans:', error)
      toast.error('Failed to load subscription plans')
    } finally {
      isLoadingPlans.value = false
    }
  }

  async function loadStats(dateRange?: { start: Date, end: Date }) {
    if (!hasPermission.value) return

    isLoadingStats.value = true
    try {
      stats.value = await adminSubscriptionService.getSubscriptionStats(dateRange)
    } catch (error: any) {
      console.error('Failed to load stats:', error)
      toast.error('Failed to load subscription statistics')
    } finally {
      isLoadingStats.value = false
    }
  }

  async function loadAdminActions(actionFilters?: { userId?: string, actionType?: string, limit?: number }) {
    if (!hasPermission.value) return

    isLoadingActions.value = true
    try {
      adminActions.value = await adminSubscriptionService.getAdminActions(actionFilters)
    } catch (error: any) {
      console.error('Failed to load admin actions:', error)
      toast.error('Failed to load admin actions')
    } finally {
      isLoadingActions.value = false
    }
  }

  // Subscription management
  async function cancelSubscription(subscriptionId: string, reason?: string) {
    if (!hasPermission.value) {
      toast.error('Insufficient permissions')
      return null
    }

    try {
      const canceled = await adminSubscriptionService.adminCancelSubscription(subscriptionId, reason)
      
      // Update local state
      const index = subscriptions.value.findIndex(sub => sub.id === subscriptionId)
      if (index !== -1) {
        subscriptions.value[index] = canceled
      }
      
      // Log admin action
      await logAdminAction('subscription_canceled', canceled.userId, {
        subscriptionId,
        reason
      })
      
      toast.success('Subscription canceled successfully')
      return canceled
    } catch (error: unknown) {
      console.error('Failed to cancel subscription:', error)
      toast.error('Failed to cancel subscription')
      return null
    }\n  }\n\n  async function refundSubscription(subscriptionId: string, amount?: number) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return\n    }\n\n    try {\n      await adminSubscriptionService.adminRefundSubscription(subscriptionId, amount)\n      \n      const subscription = subscriptions.value.find(sub => sub.id === subscriptionId)\n      \n      // Log admin action\n      await logAdminAction('subscription_refunded', subscription?.userId, {\n        subscriptionId,\n        amount\n      })\n      \n      toast.success('Refund processed successfully')\n      await loadSubscriptions()\n    } catch (error: any) {\n      console.error('Failed to refund subscription:', error)\n      toast.error('Failed to process refund')\n    }\n  }\n\n  async function updateSubscription(subscriptionId: string, updates: any) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return null\n    }\n\n    try {\n      const updated = await adminSubscriptionService.adminUpdateSubscription(subscriptionId, updates)\n      \n      // Update local state\n      const index = subscriptions.value.findIndex(sub => sub.id === subscriptionId)\n      if (index !== -1) {\n        subscriptions.value[index] = updated\n      }\n      \n      // Log admin action\n      await logAdminAction('subscription_updated', updated.userId, {\n        subscriptionId,\n        updates\n      })\n      \n      toast.success('Subscription updated successfully')\n      return updated\n    } catch (error: any) {\n      console.error('Failed to update subscription:', error)\n      toast.error('Failed to update subscription')\n      return null\n    }\n  }\n\n  // Plan management\n  async function createPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return null\n    }\n\n    try {\n      const created = await adminSubscriptionService.createPlan(plan)\n      plans.value.push(created)\n      \n      // Log admin action\n      await logAdminAction('plan_created', undefined, {\n        planId: created.id,\n        planName: created.name\n      })\n      \n      toast.success('Plan created successfully')\n      return created\n    } catch (error: any) {\n      console.error('Failed to create plan:', error)\n      toast.error('Failed to create plan')\n      return null\n    }\n  }\n\n  async function updatePlan(planId: string, updates: Partial<SubscriptionPlan>) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return null\n    }\n\n    try {\n      const updated = await adminSubscriptionService.updatePlan(planId, updates)\n      \n      // Update local state\n      const index = plans.value.findIndex(plan => plan.id === planId)\n      if (index !== -1) {\n        plans.value[index] = updated\n      }\n      \n      // Log admin action\n      await logAdminAction('plan_updated', undefined, {\n        planId,\n        updates\n      })\n      \n      toast.success('Plan updated successfully')\n      return updated\n    } catch (error: any) {\n      console.error('Failed to update plan:', error)\n      toast.error('Failed to update plan')\n      return null\n    }\n  }\n\n  async function deletePlan(planId: string) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return\n    }\n\n    try {\n      await adminSubscriptionService.deletePlan(planId)\n      \n      // Remove from local state\n      plans.value = plans.value.filter(plan => plan.id !== planId)\n      \n      // Log admin action\n      await logAdminAction('plan_deleted', undefined, {\n        planId\n      })\n      \n      toast.success('Plan deleted successfully')\n    } catch (error: any) {\n      console.error('Failed to delete plan:', error)\n      toast.error('Failed to delete plan')\n    }\n  }\n\n  async function togglePlanStatus(planId: string, isActive: boolean) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return null\n    }\n\n    try {\n      const updated = await adminSubscriptionService.togglePlanStatus(planId, isActive)\n      \n      // Update local state\n      const index = plans.value.findIndex(plan => plan.id === planId)\n      if (index !== -1) {\n        plans.value[index] = updated\n      }\n      \n      // Log admin action\n      await logAdminAction('plan_updated', undefined, {\n        planId,\n        isActive\n      })\n      \n      toast.success(`Plan ${isActive ? 'activated' : 'deactivated'} successfully`)\n      return updated\n    } catch (error: any) {\n      console.error('Failed to toggle plan status:', error)\n      toast.error('Failed to update plan status')\n      return null\n    }\n  }\n\n  // User management\n  async function resetUserUsage(userId: string, feature?: string) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return\n    }\n\n    try {\n      await adminSubscriptionService.resetUserUsage(userId, feature)\n      \n      // Log admin action\n      await logAdminAction('usage_reset', userId, {\n        feature\n      })\n      \n      toast.success('User usage reset successfully')\n    } catch (error: any) {\n      console.error('Failed to reset user usage:', error)\n      toast.error('Failed to reset user usage')\n    }\n  }\n\n  async function getUserSubscriptions(userId: string) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return []\n    }\n\n    try {\n      return await adminSubscriptionService.getUserSubscriptions(userId)\n    } catch (error: any) {\n      console.error('Failed to get user subscriptions:', error)\n      toast.error('Failed to load user subscriptions')\n      return []\n    }\n  }\n\n  async function createSubscriptionForUser(userId: string, planId: string, options?: any) {\n    if (!hasPermission.value) {\n      toast.error('Insufficient permissions')\n      return null\n    }\n\n    try {\n      const created = await adminSubscriptionService.createSubscriptionForUser(userId, planId, options)\n      \n      // Log admin action\n      await logAdminAction('subscription_created', userId, {\n        subscriptionId: created.id,\n        planId\n      })\n      \n      toast.success('Subscription created for user successfully')\n      return created\n    } catch (error: any) {\n      console.error('Failed to create subscription for user:', error)\n      toast.error('Failed to create subscription')\n      return null\n    }\n  }\n\n  // Reporting\n  async function getRevenuReport(dateRange: { start: Date, end: Date }) {\n    if (!hasPermission.value) return null\n\n    try {\n      return await adminSubscriptionService.getRevenuReport(dateRange)\n    } catch (error: any) {\n      console.error('Failed to get revenue report:', error)\n      toast.error('Failed to load revenue report')\n      return null\n    }\n  }\n\n  async function getChurnAnalysis(dateRange: { start: Date, end: Date }) {\n    if (!hasPermission.value) return null\n\n    try {\n      return await adminSubscriptionService.getChurnAnalysis(dateRange)\n    } catch (error: any) {\n      console.error('Failed to get churn analysis:', error)\n      toast.error('Failed to load churn analysis')\n      return null\n    }\n  }\n\n  async function getSubscriptionTrends(period: 'day' | 'week' | 'month', limit?: number) {\n    if (!hasPermission.value) return null\n\n    try {\n      return await adminSubscriptionService.getSubscriptionTrends(period, limit)\n    } catch (error: any) {\n      console.error('Failed to get subscription trends:', error)\n      toast.error('Failed to load subscription trends')\n      return null\n    }\n  }\n\n  // Utility functions\n  async function logAdminAction(\n    actionType: AdminAction['actionType'],\n    targetUserId?: string,\n    details?: Record<string, any>\n  ) {\n    if (!user.value || !hasPermission.value) return\n\n    try {\n      await adminSubscriptionService.logAdminAction({\n        adminUserId: user.value.id,\n        targetUserId: targetUserId || null,\n        actionType,\n        details: details || {},\n        ipAddress: null, // Would be set server-side\n        userAgent: navigator.userAgent\n      })\n    } catch (error) {\n      console.error('Failed to log admin action:', error)\n    }\n  }\n\n  // Filter management\n  function updateFilters(newFilters: Partial<AdminSubscriptionFilters>) {\n    filters.value = { ...filters.value, ...newFilters }\n    loadSubscriptions(true)\n  }\n\n  function resetFilters() {\n    filters.value = {\n      status: undefined,\n      planIds: undefined,\n      dateRange: undefined,\n      search: '',\n      sortBy: 'createdAt',\n      sortOrder: 'desc',\n      limit: 25,\n      offset: 0\n    }\n    loadSubscriptions(true)\n  }\n\n  function nextPage() {\n    if (currentPage.value < totalPages.value) {\n      filters.value.offset = (filters.value.offset || 0) + (filters.value.limit || 25)\n      loadSubscriptions()\n    }\n  }\n\n  function previousPage() {\n    if (currentPage.value > 1) {\n      filters.value.offset = Math.max(0, (filters.value.offset || 0) - (filters.value.limit || 25))\n      loadSubscriptions()\n    }\n  }\n\n  function goToPage(page: number) {\n    if (page >= 1 && page <= totalPages.value) {\n      filters.value.offset = (page - 1) * (filters.value.limit || 25)\n      loadSubscriptions()\n    }\n  }\n\n  // Helper functions\n  function formatCurrency(amount: number, currency = 'USD'): string {\n    return new Intl.NumberFormat('en-US', {\n      style: 'currency',\n      currency,\n    }).format(amount / 100)\n  }\n\n  function formatDate(date: Date | string): string {\n    const d = typeof date === 'string' ? new Date(date) : date\n    return d.toLocaleDateString('en-US', {\n      year: 'numeric',\n      month: 'short',\n      day: 'numeric'\n    })\n  }\n\n  function getStatusColor(status: UserSubscription['status']): string {\n    const colors = {\n      active: 'success',\n      trialing: 'info',\n      canceled: 'error',\n      past_due: 'warning',\n      incomplete: 'warning',\n      incomplete_expired: 'error',\n      unpaid: 'error',\n      paused: 'warning'\n    }\n    return colors[status] || 'neutral'\n  }\n\n  // Initialize data\n  onMounted(() => {\n    if (hasPermission.value) {\n      loadSubscriptions()\n      loadPlans()\n      loadStats()\n      loadAdminActions()\n    }\n  })\n\n  return {\n    // State\n    subscriptions,\n    plans,\n    stats,\n    adminActions,\n    totalSubscriptions,\n    filters,\n    \n    // Loading states\n    isLoading,\n    isLoadingStats,\n    isLoadingPlans,\n    isLoadingActions,\n    \n    // Computed\n    hasPermission,\n    activeSubscriptions,\n    canceledSubscriptions,\n    pastDueSubscriptions,\n    currentPage,\n    totalPages,\n    \n    // Data loading\n    loadSubscriptions,\n    loadPlans,\n    loadStats,\n    loadAdminActions,\n    \n    // Subscription management\n    cancelSubscription,\n    refundSubscription,\n    updateSubscription,\n    \n    // Plan management\n    createPlan,\n    updatePlan,\n    deletePlan,\n    togglePlanStatus,\n    \n    // User management\n    resetUserUsage,\n    getUserSubscriptions,\n    createSubscriptionForUser,\n    \n    // Reporting\n    getRevenuReport,\n    getChurnAnalysis,\n    getSubscriptionTrends,\n    \n    // Filter management\n    updateFilters,\n    resetFilters,\n    nextPage,\n    previousPage,\n    goToPage,\n    \n    // Utility\n    formatCurrency,\n    formatDate,\n    getStatusColor,\n  }\n}"
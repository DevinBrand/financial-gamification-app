// src/composables/useSubscription.ts - Vue composable for subscription management
import { ref, computed, onMounted, watch } from 'vue'
import { useAuth } from './useAuth'
import { subscriptionService } from '@/services/api/subscriptions'
import { useToast } from 'vue-toastification'
import type {
  SubscriptionPlan,
  UserSubscription,
  SubscriptionUsage,
  PaymentMethod,
  Invoice,
  CreateCheckoutRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  FeatureUsage
} from '@/types/subscription.types'

export function useSubscription() {
  const { user, isAuthenticated } = useAuth()
  const toast = useToast()

  // State
  const subscriptions = ref<UserSubscription[]>([])
  const availablePlans = ref<SubscriptionPlan[]>([])
  const paymentMethods = ref<PaymentMethod[]>([])
  const invoices = ref<Invoice[]>([])
  const usage = ref<SubscriptionUsage[]>([])
  const featureUsage = ref<FeatureUsage>({})
  
  const isLoading = ref(false)
  const isLoadingPlans = ref(false)
  const isLoadingPaymentMethods = ref(false)
  const isLoadingInvoices = ref(false)
  const isLoadingUsage = ref(false)

  // Computed properties
  const currentSubscription = computed(() => {
    return subscriptions.value.find(sub => 
      sub.status === 'active' || sub.status === 'trialing'
    ) || null
  })

  const isSubscribed = computed(() => !!currentSubscription.value)

  const currentPlan = computed(async () => {
    if (!currentSubscription.value) return null
    return await subscriptionService.getPlan(currentSubscription.value.planId)
  })

  const subscriptionStatus = computed(() => {
    if (!currentSubscription.value) return 'free'
    return currentSubscription.value.status
  })

  const subscriptionEndDate = computed(() => {
    return currentSubscription.value?.currentPeriodEnd || null
  })

  const willRenew = computed(() => {
    return currentSubscription.value ? !currentSubscription.value.cancelAtPeriodEnd : false
  })

  const isTrialing = computed(() => {
    return currentSubscription.value?.status === 'trialing'
  })

  const trialEndDate = computed(() => {
    return currentSubscription.value?.trialEnd || null
  })

  const defaultPaymentMethod = computed(() => {
    return paymentMethods.value.find(pm => pm.isDefault) || null
  })

  // Subscription management
  async function loadSubscriptions() {
    if (!isAuthenticated.value) return

    isLoading.value = true
    try {
      subscriptions.value = await subscriptionService.getCurrentUserSubscriptions()
    } catch (error: any) {
      console.error('Failed to load subscriptions:', error)
      toast.error('Failed to load subscription data')
    } finally {
      isLoading.value = false
    }
  }

  async function loadPlans() {
    isLoadingPlans.value = true
    try {
      availablePlans.value = await subscriptionService.getAvailablePlans()
    } catch (error: any) {
      console.error('Failed to load plans:', error)
      toast.error('Failed to load subscription plans')
    } finally {
      isLoadingPlans.value = false
    }
  }

  async function subscribeToPlan(planId: string, options?: Partial<CreateCheckoutRequest>) {
    if (!user.value) {
      toast.error('Please sign in to subscribe')
      return null
    }

    try {
      const checkoutRequest: CreateCheckoutRequest = {
        priceId: planId,
        successUrl: `${window.location.origin}/subscription?success=true`,
        cancelUrl: `${window.location.origin}/subscription?canceled=true`,
        ...options
      }

      const response = await subscriptionService.createCheckoutSession(user.value.id, checkoutRequest)
      
      if (response.success && response.data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url
        return response.data
      } else {
        toast.error(response.error || 'Failed to create checkout session')
        return null
      }
    } catch (error: any) {
      console.error('Failed to subscribe:', error)
      toast.error('Failed to start subscription process')
      return null
    }
  }

  async function updateSubscription(subscriptionId: string, updates: UpdateSubscriptionRequest) {
    if (!user.value || !currentSubscription.value) {
      toast.error('No active subscription found')
      return null
    }

    try {
      const updated = await subscriptionService.updateSubscription(
        user.value.id, 
        subscriptionId, 
        updates
      )
      
      // Update local state
      const index = subscriptions.value.findIndex(sub => sub.id === subscriptionId)
      if (index !== -1) {
        subscriptions.value[index] = updated
      }
      
      toast.success('Subscription updated successfully')
      return updated
    } catch (error: any) {
      console.error('Failed to update subscription:', error)
      toast.error('Failed to update subscription')
      return null
    }
  }

  async function cancelSubscription(
    subscriptionId?: string, 
    options?: CancelSubscriptionRequest
  ) {
    const subId = subscriptionId || currentSubscription.value?.id
    if (!user.value || !subId) {
      toast.error('No subscription to cancel')
      return null
    }

    try {
      const canceled = await subscriptionService.cancelSubscription(
        user.value.id,
        subId,
        options
      )
      
      // Update local state
      const index = subscriptions.value.findIndex(sub => sub.id === subId)
      if (index !== -1) {
        subscriptions.value[index] = canceled
      }
      
      const message = canceled.cancelAtPeriodEnd 
        ? 'Subscription will be canceled at the end of the current period'
        : 'Subscription canceled immediately'
      toast.success(message)
      
      return canceled
    } catch (error: any) {
      console.error('Failed to cancel subscription:', error)
      toast.error('Failed to cancel subscription')
      return null
    }
  }

  async function reactivateSubscription(subscriptionId?: string) {
    const subId = subscriptionId || currentSubscription.value?.id
    if (!user.value || !subId) {
      toast.error('No subscription to reactivate')
      return null
    }

    try {
      const reactivated = await subscriptionService.reactivateSubscription(user.value.id, subId)
      
      // Update local state
      const index = subscriptions.value.findIndex(sub => sub.id === subId)
      if (index !== -1) {
        subscriptions.value[index] = reactivated
      }
      
      toast.success('Subscription reactivated successfully')
      return reactivated
    } catch (error: any) {
      console.error('Failed to reactivate subscription:', error)
      toast.error('Failed to reactivate subscription')
      return null
    }
  }

  async function openCustomerPortal(returnUrl?: string) {
    if (!user.value) {
      toast.error('Please sign in to manage billing')
      return
    }

    try {
      const url = await subscriptionService.getCustomerPortalUrl(
        user.value.id,
        returnUrl || window.location.href
      )
      window.location.href = url
    } catch (error: any) {
      console.error('Failed to open customer portal:', error)
      toast.error('Failed to open billing portal')
    }
  }

  // Payment methods
  async function loadPaymentMethods() {
    if (!isAuthenticated.value) return

    isLoadingPaymentMethods.value = true
    try {
      paymentMethods.value = await subscriptionService.getCurrentUserPaymentMethods()
    } catch (error: any) {
      console.error('Failed to load payment methods:', error)
      toast.error('Failed to load payment methods')
    } finally {
      isLoadingPaymentMethods.value = false
    }
  }

  async function setDefaultPaymentMethod(paymentMethodId: string) {
    if (!user.value) return

    try {
      await subscriptionService.setDefaultPaymentMethod(user.value.id, paymentMethodId)
      await loadPaymentMethods() // Refresh the list
      toast.success('Default payment method updated')
    } catch (error: any) {
      console.error('Failed to set default payment method:', error)
      toast.error('Failed to update payment method')
    }
  }

  async function deletePaymentMethod(paymentMethodId: string) {
    try {
      await subscriptionService.deletePaymentMethod(paymentMethodId)
      await loadPaymentMethods() // Refresh the list
      toast.success('Payment method removed')
    } catch (error: any) {
      console.error('Failed to delete payment method:', error)
      toast.error('Failed to remove payment method')
    }
  }

  // Invoices
  async function loadInvoices() {
    if (!isAuthenticated.value) return

    isLoadingInvoices.value = true
    try {
      invoices.value = await subscriptionService.getCurrentUserInvoices()
    } catch (error: any) {
      console.error('Failed to load invoices:', error)
      toast.error('Failed to load billing history')
    } finally {
      isLoadingInvoices.value = false
    }
  }

  // Usage tracking
  async function loadUsage(feature?: string) {
    if (!user.value) return

    isLoadingUsage.value = true
    try {
      usage.value = await subscriptionService.getUsage(user.value.id, feature)
      
      // Build feature usage map
      const usageMap: FeatureUsage = {}
      usage.value.forEach(u => {
        usageMap[u.feature] = {
          used: u.usageCount,
          limit: u.usageLimit,
          resetDate: u.periodEnd
        }
      })
      featureUsage.value = usageMap
    } catch (error: any) {
      console.error('Failed to load usage:', error)
    } finally {
      isLoadingUsage.value = false
    }
  }

  async function trackFeatureUsage(feature: string, amount: number = 1) {
    if (!user.value) return

    try {
      await subscriptionService.trackUsage(user.value.id, feature, amount)
      await loadUsage(feature) // Refresh usage for this feature
    } catch (error: any) {
      console.error('Failed to track usage:', error)
    }
  }

  async function checkFeatureAccess(feature: string): Promise<boolean> {
    if (!user.value) return false

    try {
      return await subscriptionService.checkFeatureAccess(user.value.id, feature)
    } catch (error: any) {
      console.error('Failed to check feature access:', error)
      return false
    }
  }

  async function getRemainingUsage(feature: string): Promise<number | null> {
    if (!user.value) return null

    try {
      return await subscriptionService.getRemainingUsage(user.value.id, feature)
    } catch (error: any) {
      console.error('Failed to get remaining usage:', error)
      return null
    }
  }

  // Helper functions
  function formatPrice(price: number, currency: string = 'usd'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price / 100)
  }

  function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  function getDaysUntilExpiry(): number | null {
    if (!subscriptionEndDate.value) return null
    
    const now = new Date()
    const endDate = new Date(subscriptionEndDate.value)
    const diffTime = endDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    return diffDays
  }

  function isFeatureAvailable(feature: string): boolean {
    const usage = featureUsage.value[feature]
    if (!usage) return true // No usage tracking means unlimited
    if (usage.limit === null) return true // Unlimited
    return usage.used < usage.limit
  }

  function getFeatureUsagePercentage(feature: string): number {
    const usage = featureUsage.value[feature]
    if (!usage || usage.limit === null) return 0
    return Math.min((usage.used / usage.limit) * 100, 100)
  }

  // Initialize data when authenticated
  watch(isAuthenticated, (authenticated) => {
    if (authenticated) {
      loadSubscriptions()
      loadPlans()
      loadPaymentMethods()
      loadInvoices()
      loadUsage()
    } else {
      subscriptions.value = []
      paymentMethods.value = []
      invoices.value = []
      usage.value = []
      featureUsage.value = {}
    }
  }, { immediate: true })

  onMounted(() => {
    if (isAuthenticated.value) {
      loadSubscriptions()
      loadPlans()
      loadPaymentMethods()
      loadInvoices()
      loadUsage()
    }
  })

  return {
    // State
    subscriptions,
    availablePlans,
    paymentMethods,
    invoices,
    usage,
    featureUsage,
    
    // Loading states
    isLoading,
    isLoadingPlans,
    isLoadingPaymentMethods,
    isLoadingInvoices,
    isLoadingUsage,
    
    // Computed
    currentSubscription,
    isSubscribed,
    currentPlan,
    subscriptionStatus,
    subscriptionEndDate,
    willRenew,
    isTrialing,
    trialEndDate,
    defaultPaymentMethod,
    
    // Subscription management
    loadSubscriptions,
    loadPlans,
    subscribeToPlan,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
    
    // Payment methods
    loadPaymentMethods,
    setDefaultPaymentMethod,
    deletePaymentMethod,
    
    // Invoices
    loadInvoices,
    
    // Usage tracking
    loadUsage,
    trackFeatureUsage,
    checkFeatureAccess,
    getRemainingUsage,
    
    // Helper functions
    formatPrice,
    formatDate,
    getDaysUntilExpiry,
    isFeatureAvailable,
    getFeatureUsagePercentage,
  }
}
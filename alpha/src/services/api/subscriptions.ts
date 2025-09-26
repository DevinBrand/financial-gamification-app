// src/services/api/subscriptions.ts - Subscription API service
import { apiClient } from './client'
import type {
  SubscriptionPlan,
  UserSubscription,
  SubscriptionUsage,
  PaymentMethod,
  Invoice,
  SubscriptionResponse,
  PlanResponse,
  CheckoutResponse,
  CustomerPortalResponse,
  UsageResponse,
  PaymentMethodResponse,
  InvoiceResponse,
  CreateCheckoutRequest,
  UpdateSubscriptionRequest,
  CancelSubscriptionRequest,
  AdminSubscriptionFilters,
  SubscriptionStats,
  ISubscriptionService
} from '@/types/subscription.types'

class SubscriptionService implements ISubscriptionService {
  // User subscription operations
  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    try {
      const response = await apiClient.get<SubscriptionResponse>(`/auth/stripe/subscriptions?userId=${userId}`)
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get user subscriptions:', error)
      throw error
    }
  }

  async getCurrentUserSubscriptions(): Promise<UserSubscription[]> {
    try {
      const response = await apiClient.get<SubscriptionResponse>('/auth/stripe/subscriptions')
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get current user subscriptions:', error)
      throw error
    }
  }

  async createCheckoutSession(userId: string, request: CreateCheckoutRequest): Promise<CheckoutResponse> {
    try {
      const response = await apiClient.post<CheckoutResponse>('/auth/stripe/create-checkout', {
        priceId: request.priceId,
        successUrl: request.successUrl || `${window.location.origin}/subscription?success=true`,
        cancelUrl: request.cancelUrl || `${window.location.origin}/subscription?canceled=true`,
        allowPromotionCodes: request.allowPromotionCodes,
        trialPeriodDays: request.trialPeriodDays,
        metadata: request.metadata
      })
      return response.data
    } catch (error) {
      console.error('Failed to create checkout session:', error)
      throw error
    }
  }

  async cancelSubscription(
    userId: string, 
    subscriptionId: string, 
    request?: CancelSubscriptionRequest
  ): Promise<UserSubscription> {
    try {
      const response = await apiClient.post(`/auth/stripe/subscriptions/${subscriptionId}/cancel`, {
        cancelAtPeriodEnd: request?.cancelAtPeriodEnd ?? true,
        cancellationReason: request?.cancellationReason
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to cancel subscription:', error)
      throw error
    }
  }

  async reactivateSubscription(userId: string, subscriptionId: string): Promise<UserSubscription> {
    try {
      const response = await apiClient.post(`/auth/stripe/subscriptions/${subscriptionId}/reactivate`)
      return response.data.data
    } catch (error) {
      console.error('Failed to reactivate subscription:', error)
      throw error
    }
  }

  async updateSubscription(
    userId: string, 
    subscriptionId: string, 
    request: UpdateSubscriptionRequest
  ): Promise<UserSubscription> {
    try {
      const response = await apiClient.put(`/auth/stripe/subscriptions/${subscriptionId}`, request)
      return response.data.data
    } catch (error) {
      console.error('Failed to update subscription:', error)
      throw error
    }
  }

  async getCustomerPortalUrl(userId: string, returnUrl?: string): Promise<string> {
    try {
      const response = await apiClient.post<CustomerPortalResponse>('/auth/stripe/customer-portal', {
        returnUrl: returnUrl || window.location.href
      })
      
      if (response.data.success && response.data.data) {
        return response.data.data.url
      }
      throw new Error('Failed to get customer portal URL')
    } catch (error) {
      console.error('Failed to get customer portal URL:', error)
      throw error
    }
  }

  // Usage tracking
  async trackUsage(userId: string, feature: string, amount: number = 1): Promise<void> {
    try {
      await apiClient.post('/api/subscriptions/usage/track', {
        userId,
        feature,
        amount
      })
    } catch (error) {
      console.error('Failed to track usage:', error)
      throw error
    }
  }

  async getUsage(userId: string, feature?: string): Promise<SubscriptionUsage[]> {
    try {
      const params = new URLSearchParams()
      if (feature) params.append('feature', feature)
      
      const response = await apiClient.get<UsageResponse>(`/api/subscriptions/usage/${userId}?${params}`)
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get usage:', error)
      throw error
    }
  }

  async checkFeatureAccess(userId: string, feature: string): Promise<boolean> {
    try {
      const response = await apiClient.get(`/api/subscriptions/features/${feature}/access?userId=${userId}`)
      return response.data.hasAccess
    } catch (error) {
      console.error('Failed to check feature access:', error)
      return false
    }
  }

  async getRemainingUsage(userId: string, feature: string): Promise<number | null> {
    try {
      const response = await apiClient.get(`/api/subscriptions/usage/${userId}/remaining?feature=${feature}`)
      return response.data.remaining
    } catch (error) {
      console.error('Failed to get remaining usage:', error)
      return null
    }
  }

  // Plan management
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const response = await apiClient.get<PlanResponse>('/auth/stripe/plans')
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get available plans:', error)
      throw error
    }
  }

  async getPlan(planId: string): Promise<SubscriptionPlan | null> {
    try {
      const response = await apiClient.get<{ success: boolean, data?: SubscriptionPlan }>(`/auth/stripe/plans/${planId}`)
      return response.data.success ? response.data.data || null : null
    } catch (error) {
      console.error('Failed to get plan:', error)
      return null
    }
  }

  // Payment methods
  async getPaymentMethods(userId: string): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get<PaymentMethodResponse>(`/auth/stripe/payment-methods?userId=${userId}`)
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get payment methods:', error)
      throw error
    }
  }

  async getCurrentUserPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await apiClient.get<PaymentMethodResponse>('/auth/stripe/payment-methods')
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get current user payment methods:', error)
      throw error
    }
  }

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void> {
    try {
      await apiClient.post('/auth/stripe/payment-methods/set-default', {
        userId,
        paymentMethodId
      })
    } catch (error) {
      console.error('Failed to set default payment method:', error)
      throw error
    }
  }

  async deletePaymentMethod(paymentMethodId: string): Promise<void> {
    try {
      await apiClient.delete(`/auth/stripe/payment-methods/${paymentMethodId}`)
    } catch (error) {
      console.error('Failed to delete payment method:', error)
      throw error
    }
  }

  // Invoices
  async getInvoices(userId: string): Promise<Invoice[]> {
    try {
      const response = await apiClient.get<InvoiceResponse>(`/auth/stripe/invoices?userId=${userId}`)
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get invoices:', error)
      throw error
    }
  }

  async getCurrentUserInvoices(): Promise<Invoice[]> {
    try {
      const response = await apiClient.get<InvoiceResponse>('/auth/stripe/invoices')
      return response.data.success ? response.data.data || [] : []
    } catch (error) {
      console.error('Failed to get current user invoices:', error)
      throw error
    }
  }

  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    try {
      const response = await apiClient.get<{ success: boolean, data?: Invoice }>(`/auth/stripe/invoices/${invoiceId}`)
      return response.data.success ? response.data.data || null : null
    } catch (error) {
      console.error('Failed to get invoice:', error)
      return null
    }
  }

  // Admin operations
  async getAllSubscriptions(filters?: AdminSubscriptionFilters): Promise<{ subscriptions: UserSubscription[], total: number }> {
    try {
      const params = new URLSearchParams()
      
      if (filters?.status) {
        filters.status.forEach(status => params.append('status[]', status))
      }
      if (filters?.planIds) {
        filters.planIds.forEach(planId => params.append('planIds[]', planId))
      }
      if (filters?.dateRange) {
        params.append('startDate', filters.dateRange.start.toISOString())
        params.append('endDate', filters.dateRange.end.toISOString())
      }
      if (filters?.search) {
        params.append('search', filters.search)
      }
      if (filters?.sortBy) {
        params.append('sortBy', filters.sortBy)
      }
      if (filters?.sortOrder) {
        params.append('sortOrder', filters.sortOrder)
      }
      if (filters?.limit) {
        params.append('limit', filters.limit.toString())
      }
      if (filters?.offset) {
        params.append('offset', filters.offset.toString())
      }

      const response = await apiClient.get(`/api/admin/subscriptions?${params}`)
      return response.data
    } catch (error) {
      console.error('Failed to get all subscriptions:', error)
      throw error
    }
  }

  async getSubscriptionStats(dateRange?: { start: Date, end: Date }): Promise<SubscriptionStats> {
    try {
      const params = new URLSearchParams()
      if (dateRange) {
        params.append('startDate', dateRange.start.toISOString())
        params.append('endDate', dateRange.end.toISOString())
      }

      const response = await apiClient.get(`/api/admin/subscriptions/stats?${params}`)
      return response.data
    } catch (error) {
      console.error('Failed to get subscription stats:', error)
      throw error
    }
  }

  async adminCancelSubscription(subscriptionId: string, reason?: string): Promise<UserSubscription> {
    try {
      const response = await apiClient.post(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
        reason
      })
      return response.data.data
    } catch (error) {
      console.error('Failed to admin cancel subscription:', error)
      throw error
    }
  }

  async adminRefundSubscription(subscriptionId: string, amount?: number): Promise<void> {
    try {
      await apiClient.post(`/api/admin/subscriptions/${subscriptionId}/refund`, {
        amount
      })
    } catch (error) {
      console.error('Failed to admin refund subscription:', error)
      throw error
    }
  }

  async resetUserUsage(userId: string, feature?: string): Promise<void> {
    try {
      await apiClient.post(`/api/admin/users/${userId}/usage/reset`, {
        feature
      })
    } catch (error) {
      console.error('Failed to reset user usage:', error)
      throw error
    }
  }

  // Webhook handling (typically handled server-side)
  async processWebhook(payload: any, signature: string): Promise<void> {
    try {
      await apiClient.post('/auth/stripe/webhook', payload, {
        headers: {
          'stripe-signature': signature
        }
      })
    } catch (error) {
      console.error('Failed to process webhook:', error)
      throw error
    }
  }

  // Helper methods
  async isUserSubscribed(userId?: string): Promise<boolean> {
    try {
      const subscriptions = userId 
        ? await this.getUserSubscriptions(userId)
        : await this.getCurrentUserSubscriptions()
      
      return subscriptions.some(sub => sub.status === 'active' || sub.status === 'trialing')
    } catch (error) {
      console.error('Failed to check if user is subscribed:', error)
      return false
    }
  }

  async getUserPlan(userId?: string): Promise<SubscriptionPlan | null> {
    try {
      const subscriptions = userId 
        ? await this.getUserSubscriptions(userId)
        : await this.getCurrentUserSubscriptions()
      
      const activeSub = subscriptions.find(sub => sub.status === 'active' || sub.status === 'trialing')
      if (activeSub) {
        return await this.getPlan(activeSub.planId)
      }
      return null
    } catch (error) {
      console.error('Failed to get user plan:', error)
      return null
    }
  }

  async getSubscriptionEndDate(userId?: string): Promise<Date | null> {
    try {
      const subscriptions = userId 
        ? await this.getUserSubscriptions(userId)
        : await this.getCurrentUserSubscriptions()
      
      const activeSub = subscriptions.find(sub => sub.status === 'active' || sub.status === 'trialing')
      return activeSub ? activeSub.currentPeriodEnd : null
    } catch (error) {
      console.error('Failed to get subscription end date:', error)
      return null
    }
  }

  async willSubscriptionRenew(userId?: string): Promise<boolean> {
    try {
      const subscriptions = userId 
        ? await this.getUserSubscriptions(userId)
        : await this.getCurrentUserSubscriptions()
      
      const activeSub = subscriptions.find(sub => sub.status === 'active' || sub.status === 'trialing')
      return activeSub ? !activeSub.cancelAtPeriodEnd : false
    } catch (error) {
      console.error('Failed to check if subscription will renew:', error)
      return false
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService()
export default subscriptionService
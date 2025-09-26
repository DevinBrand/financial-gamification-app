// src/services/api/endpoints/subscription-admin.ts - Admin subscription management endpoints
import { apiClient } from '../client'
import type {
  UserSubscription,
  SubscriptionStats,
  AdminSubscriptionFilters,
  AdminAction,
  SubscriptionPlan
} from '@/types/subscription.types'

export interface AdminSubscriptionService {
  // Subscription management
  getAllSubscriptions(filters?: AdminSubscriptionFilters): Promise<{ subscriptions: UserSubscription[], total: number }>
  getSubscriptionById(id: string): Promise<UserSubscription | null>
  getSubscriptionStats(dateRange?: { start: Date, end: Date }): Promise<SubscriptionStats>
  
  // Subscription actions
  adminCancelSubscription(subscriptionId: string, reason?: string): Promise<UserSubscription>
  adminRefundSubscription(subscriptionId: string, amount?: number): Promise<void>
  adminUpdateSubscription(subscriptionId: string, updates: any): Promise<UserSubscription>
  
  // Plan management
  createPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan>
  updatePlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan>
  deletePlan(planId: string): Promise<void>
  togglePlanStatus(planId: string, isActive: boolean): Promise<SubscriptionPlan>
  
  // User management
  resetUserUsage(userId: string, feature?: string): Promise<void>
  getUserSubscriptions(userId: string): Promise<UserSubscription[]>
  createSubscriptionForUser(userId: string, planId: string, options?: any): Promise<UserSubscription>
  
  // Analytics and reporting
  getRevenuReport(dateRange: { start: Date, end: Date }): Promise<any>
  getChurnAnalysis(dateRange: { start: Date, end: Date }): Promise<any>
  getSubscriptionTrends(period: 'day' | 'week' | 'month', limit?: number): Promise<any>
  
  // Admin actions log
  getAdminActions(filters?: { userId?: string, actionType?: string, limit?: number }): Promise<AdminAction[]>
  logAdminAction(action: Omit<AdminAction, 'id' | 'createdAt'>): Promise<AdminAction>
}

class AdminSubscriptionServiceImpl implements AdminSubscriptionService {
  async getAllSubscriptions(filters?: AdminSubscriptionFilters): Promise<{ subscriptions: UserSubscription[], total: number }> {
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
  }

  async getSubscriptionById(id: string): Promise<UserSubscription | null> {
    try {
      const response = await apiClient.get(`/api/admin/subscriptions/${id}`)
      return response.data.data || null
    } catch (error) {
      console.error('Failed to get subscription:', error)
      return null
    }
  }

  async getSubscriptionStats(dateRange?: { start: Date, end: Date }): Promise<SubscriptionStats> {
    const params = new URLSearchParams()
    if (dateRange) {
      params.append('startDate', dateRange.start.toISOString())
      params.append('endDate', dateRange.end.toISOString())
    }

    const response = await apiClient.get(`/api/admin/subscriptions/stats?${params}`)
    return response.data
  }

  async adminCancelSubscription(subscriptionId: string, reason?: string): Promise<UserSubscription> {
    const response = await apiClient.post(`/api/admin/subscriptions/${subscriptionId}/cancel`, {
      reason
    })
    return response.data.data
  }

  async adminRefundSubscription(subscriptionId: string, amount?: number): Promise<void> {
    await apiClient.post(`/api/admin/subscriptions/${subscriptionId}/refund`, {
      amount
    })
  }

  async adminUpdateSubscription(subscriptionId: string, updates: any): Promise<UserSubscription> {
    const response = await apiClient.put(`/api/admin/subscriptions/${subscriptionId}`, updates)
    return response.data.data
  }

  async createPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SubscriptionPlan> {
    const response = await apiClient.post('/api/admin/plans', plan)
    return response.data.data
  }

  async updatePlan(planId: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const response = await apiClient.put(`/api/admin/plans/${planId}`, updates)
    return response.data.data
  }

  async deletePlan(planId: string): Promise<void> {
    await apiClient.delete(`/api/admin/plans/${planId}`)
  }

  async togglePlanStatus(planId: string, isActive: boolean): Promise<SubscriptionPlan> {
    const response = await apiClient.patch(`/api/admin/plans/${planId}/status`, {
      isActive
    })
    return response.data.data
  }

  async resetUserUsage(userId: string, feature?: string): Promise<void> {
    await apiClient.post(`/api/admin/users/${userId}/usage/reset`, {
      feature
    })
  }

  async getUserSubscriptions(userId: string): Promise<UserSubscription[]> {
    const response = await apiClient.get(`/api/admin/users/${userId}/subscriptions`)
    return response.data.data || []
  }

  async createSubscriptionForUser(userId: string, planId: string, options?: any): Promise<UserSubscription> {
    const response = await apiClient.post(`/api/admin/users/${userId}/subscriptions`, {
      planId,
      ...options
    })
    return response.data.data
  }

  async getRevenuReport(dateRange: { start: Date, end: Date }): Promise<any> {
    const params = new URLSearchParams()
    params.append('startDate', dateRange.start.toISOString())
    params.append('endDate', dateRange.end.toISOString())

    const response = await apiClient.get(`/api/admin/reports/revenue?${params}`)
    return response.data
  }

  async getChurnAnalysis(dateRange: { start: Date, end: Date }): Promise<any> {
    const params = new URLSearchParams()
    params.append('startDate', dateRange.start.toISOString())
    params.append('endDate', dateRange.end.toISOString())

    const response = await apiClient.get(`/api/admin/reports/churn?${params}`)
    return response.data
  }

  async getSubscriptionTrends(period: 'day' | 'week' | 'month', limit: number = 30): Promise<any> {
    const params = new URLSearchParams()
    params.append('period', period)
    params.append('limit', limit.toString())

    const response = await apiClient.get(`/api/admin/reports/trends?${params}`)
    return response.data
  }

  async getAdminActions(filters?: { userId?: string, actionType?: string, limit?: number }): Promise<AdminAction[]> {
    const params = new URLSearchParams()
    
    if (filters?.userId) {
      params.append('userId', filters.userId)
    }
    if (filters?.actionType) {
      params.append('actionType', filters.actionType)
    }
    if (filters?.limit) {
      params.append('limit', filters.limit.toString())
    }

    const response = await apiClient.get(`/api/admin/actions?${params}`)
    return response.data.data || []
  }

  async logAdminAction(action: Omit<AdminAction, 'id' | 'createdAt'>): Promise<AdminAction> {
    const response = await apiClient.post('/api/admin/actions', action)
    return response.data.data
  }
}

// Export singleton instance
export const adminSubscriptionService = new AdminSubscriptionServiceImpl()
export default adminSubscriptionService
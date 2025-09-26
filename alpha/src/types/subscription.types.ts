// src/types/subscription.types.ts - Subscription management types
export interface SubscriptionPlan {
  id: string // Stripe price ID
  productId: string // Stripe product ID
  name: string
  description: string | null
  price: number // In cents
  currency: string
  interval: 'day' | 'week' | 'month' | 'year'
  intervalCount: number
  trialPeriodDays: number
  features: string[]
  metadata: Record<string, any>
  isActive: boolean
  isPopular: boolean
  sortOrder: number
}

export interface UserSubscription {
  id: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  planId: string
  status: 'incomplete' | 'incomplete_expired' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'paused'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  trialStart: Date | null
  trialEnd: Date | null
  quantity: number
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
  
  // Joined data
  plan?: SubscriptionPlan
  user?: {
    id: string
    email: string
    name: string
  }
}

export interface SubscriptionUsage {
  id: string
  subscriptionId: string
  userId: string
  feature: string // e.g., 'api_calls', 'storage_gb', 'exports'
  usageCount: number
  usageLimit: number | null // NULL for unlimited
  periodStart: Date
  periodEnd: Date
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface PaymentMethod {
  id: string // Stripe payment method ID
  userId: string
  stripeCustomerId: string
  type: 'card' | 'bank_account' | 'sepa_debit'
  card?: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface Invoice {
  id: string // Stripe invoice ID
  userId: string
  subscriptionId: string | null
  stripeCustomerId: string
  amountPaid: number // In cents
  amountDue: number // In cents
  currency: string
  status: 'draft' | 'open' | 'paid' | 'uncollectible' | 'void'
  invoiceNumber: string | null
  hostedInvoiceUrl: string | null
  invoicePdf: string | null
  periodStart: Date | null
  periodEnd: Date | null
  dueDate: Date | null
  paidAt: Date | null
  metadata: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface WebhookEvent {
  id: string
  stripeEventId: string
  eventType: string
  processed: boolean
  processedAt: Date | null
  errorMessage: string | null
  retryCount: number
  data: Record<string, any>
  createdAt: Date
}

// API Response types
export interface SubscriptionResponse {
  success: boolean
  data?: UserSubscription[]
  error?: string
}

export interface PlanResponse {
  success: boolean
  data?: SubscriptionPlan[]
  error?: string
}

export interface CheckoutResponse {
  success: boolean
  data?: {
    sessionId: string
    url: string
  }
  error?: string
}

export interface CustomerPortalResponse {
  success: boolean
  data?: {
    url: string
  }
  error?: string
}

export interface UsageResponse {
  success: boolean
  data?: SubscriptionUsage[]
  error?: string
}

export interface PaymentMethodResponse {
  success: boolean
  data?: PaymentMethod[]
  error?: string
}

export interface InvoiceResponse {
  success: boolean
  data?: Invoice[]
  error?: string
}

// Admin types
export interface AdminAction {
  id: string
  adminUserId: string
  targetUserId: string | null
  actionType: 'subscription_created' | 'subscription_updated' | 'subscription_canceled' | 'subscription_refunded' | 
              'plan_created' | 'plan_updated' | 'plan_deleted' | 'user_banned' | 'user_unbanned' | 'usage_reset'
  details: Record<string, any>
  ipAddress: string | null
  userAgent: string | null
  createdAt: Date
}

export interface SubscriptionStats {
  totalSubscribers: number
  activeSubscribers: number
  monthlyRevenue: number
  churnRate: number
  planDistribution: Record<string, number>
  recentSignups: number
  canceledThisMonth: number
}

export interface AdminSubscriptionFilters {
  status?: UserSubscription['status'][]
  planIds?: string[]
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string // Email or name search
  sortBy?: 'createdAt' | 'updatedAt' | 'currentPeriodEnd' | 'price'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// Form types for UI
export interface CreateCheckoutRequest {
  priceId: string
  successUrl?: string
  cancelUrl?: string
  allowPromotionCodes?: boolean
  trialPeriodDays?: number
  metadata?: Record<string, any>
}

export interface UpdateSubscriptionRequest {
  priceId?: string
  quantity?: number
  prorationBehavior?: 'create_prorations' | 'none' | 'always_invoice'
  metadata?: Record<string, any>
}

export interface CancelSubscriptionRequest {
  cancelAtPeriodEnd?: boolean
  cancellationReason?: string
}

// Webhook payload types
export interface StripeWebhookPayload {
  id: string
  object: 'event'
  created: number
  data: {
    object: any
    previous_attributes?: any
  }
  livemode: boolean
  pending_webhooks: number
  request: {
    id: string | null
    idempotency_key: string | null
  }
  type: string
}

// Feature flags and limits
export interface PlanFeatures {
  apiCalls: number | null // null = unlimited
  storageGb: number | null
  exports: number | null
  advancedAnalytics: boolean
  prioritySupport: boolean
  customIntegrations: boolean
  multiUser: boolean
  maxUsers?: number
}

export interface FeatureUsage {
  [key: string]: {
    used: number
    limit: number | null
    resetDate: Date
  }
}

// Subscription management interface for services
export interface ISubscriptionService {
  // User operations
  getUserSubscriptions(userId: string): Promise<UserSubscription[]>
  createCheckoutSession(userId: string, request: CreateCheckoutRequest): Promise<CheckoutResponse>
  cancelSubscription(userId: string, subscriptionId: string, request?: CancelSubscriptionRequest): Promise<UserSubscription>
  updateSubscription(userId: string, subscriptionId: string, request: UpdateSubscriptionRequest): Promise<UserSubscription>
  getCustomerPortalUrl(userId: string, returnUrl?: string): Promise<string>
  
  // Usage tracking
  trackUsage(userId: string, feature: string, amount?: number): Promise<void>
  getUsage(userId: string, feature?: string): Promise<SubscriptionUsage[]>
  checkFeatureAccess(userId: string, feature: string): Promise<boolean>
  getRemainingUsage(userId: string, feature: string): Promise<number | null>
  
  // Plan management
  getAvailablePlans(): Promise<SubscriptionPlan[]>
  getPlan(planId: string): Promise<SubscriptionPlan | null>
  
  // Payment methods
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>
  setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<void>
  
  // Invoices
  getInvoices(userId: string): Promise<Invoice[]>
  getInvoice(invoiceId: string): Promise<Invoice | null>
  
  // Admin operations
  getAllSubscriptions(filters?: AdminSubscriptionFilters): Promise<{ subscriptions: UserSubscription[], total: number }>
  getSubscriptionStats(dateRange?: { start: Date, end: Date }): Promise<SubscriptionStats>
  adminCancelSubscription(subscriptionId: string, reason?: string): Promise<UserSubscription>
  adminRefundSubscription(subscriptionId: string, amount?: number): Promise<void>
  resetUserUsage(userId: string, feature?: string): Promise<void>
  
  // Webhook handling
  processWebhook(payload: StripeWebhookPayload, signature: string): Promise<void>
}
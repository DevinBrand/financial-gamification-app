// src/types/auth.types.ts - Enhanced Auth Type Definitions

// Better Auth default user type
export interface BetterAuthUser {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified: boolean
  phoneNumber?: string | null
  phoneNumberVerified?: boolean
  twoFactorEnabled?: boolean
  role?: string
  banned?: boolean
  banReason?: string | null
  banExpires?: Date | null
  createdAt: Date
  updatedAt: Date
}

// Extended user type for our app
export interface User extends BetterAuthUser {
  firstName?: string
  lastName?: string
  avatar?: string
  bio?: string
  isPublicProfile?: boolean
  gamificationData?: any
  subscriptionStatus?: 'free' | 'premium' | 'enterprise'
  subscriptionId?: string
  customerId?: string
  lastLoginAt?: Date
  loginCount?: number
}

// Helper function to transform BetterAuth user to our User type
export function transformUser(authUser: BetterAuthUser): User {
  const [firstName, ...lastNameParts] = authUser.name?.split(' ') || ['', '']
  const lastName = lastNameParts.join(' ')
  
  return {
    ...authUser,
    firstName,
    lastName,
    avatar: authUser.image || undefined,
    isPublicProfile: false,
    subscriptionStatus: 'free'
  }
}

// Session and authentication response types
export interface AuthResponse {
  user: User
  session?: {
    id: string
    token: string
    expiresAt: Date
  }
}

export interface SessionData {
  user: User | null
  session?: {
    id: string
    token: string
    expiresAt: Date
    ipAddress?: string
    userAgent?: string
    createdAt: Date
    updatedAt: Date
  }
}

// Authentication result types
export interface SignInData {
  success: boolean
  error?: string
  user?: User
  requiresTwoFactor?: boolean
}

export interface SignUpData {
  success: boolean
  error?: string
  user?: User
  requiresEmailVerification?: boolean
}

export interface AuthActionResult {
  success: boolean
  error?: string
  data?: any
}

// Two-Factor Authentication types
export interface TwoFactorSetupData {
  qrCode: string
  secret: string
  backupCodes: string[]
}

export interface TwoFactorVerification {
  code: string
}

export interface BackupCode {
  id: string
  code: string
  used: boolean
  usedAt?: Date
}

// Phone number verification types
export interface PhoneNumberVerification {
  phoneNumber: string
  code?: string
}

// Email OTP types
export interface EmailOTPVerification {
  email: string
  code?: string
}

// Password reset types
export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  password: string
}

// Email verification types
export interface EmailVerification {
  token: string
}

// Social login types
export type SocialProvider = 'google' | 'github' | 'discord' | 'facebook' | 'twitter'

export interface SocialLoginRequest {
  provider: SocialProvider
  callbackURL?: string
}

// Admin types
export interface AdminAction {
  action: 'ban' | 'unban' | 'delete' | 'verify' | 'updateRole'
  userId: string
  reason?: string
  duration?: number // in days for bans
  newRole?: string
}

export interface UserBanInfo {
  banned: boolean
  banReason?: string
  banExpires?: Date
  bannedBy?: string
  bannedAt?: Date
}

// API Key types
export interface ApiKey {
  id: string
  name: string
  key: string // only shown once during creation
  keyPreview: string // masked version for display
  permissions: string[]
  expiresAt?: Date
  lastUsedAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateApiKeyRequest {
  name: string
  permissions: string[]
  expiresAt?: Date
}

// Device detection types
export interface Device {
  id: string
  name: string
  type: 'desktop' | 'mobile' | 'tablet' | 'unknown'
  os: string
  browser: string
  ipAddress: string
  location?: {
    country?: string
    city?: string
  }
  isCurrent: boolean
  lastUsedAt: Date
  createdAt: Date
}

export interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'password_change' | 'profile_update' | 'suspicious_activity'
  description: string
  ipAddress: string
  userAgent: string
  location?: {
    country?: string
    city?: string
  }
  createdAt: Date
}

// Subscription/Stripe types
export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  popular?: boolean
}

export interface Subscription {
  id: string
  customerId: string
  planId: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete'
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  createdAt: Date
  updatedAt: Date
}

export interface PaymentMethod {
  id: string
  type: 'card'
  card: {
    brand: string
    last4: string
    expMonth: number
    expYear: number
  }
  isDefault: boolean
  createdAt: Date
}

// Email service types
export interface EmailTemplate {
  id: string
  name: string
  subject: string
  htmlContent: string
  textContent: string
  variables: string[]
}

export interface EmailSendRequest {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  template?: string
  variables?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: string | Buffer
    contentType?: string
  }>
}

// Captcha types
export interface CaptchaVerification {
  token: string
  action?: string
}

// Have I Been Pwned types
export interface PasswordBreachCheck {
  isBreached: boolean
  breachCount?: number
  warning?: string
}
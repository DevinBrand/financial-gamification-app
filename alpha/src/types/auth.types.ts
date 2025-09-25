// src/types/auth.types.ts - Auth Type Definitions

// Better Auth default user type
export interface BetterAuthUser {
  id: string
  email: string
  name: string
  image?: string | null
  emailVerified: boolean
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
  }
}

export interface AuthResponse {
  user: User
  session?: {
    id: string
    token: string
    expiresAt: Date
  }
}

export interface SignInData {
  success: boolean
  error?: string
}

export interface SignUpData {
  success: boolean
  error?: string
}

export interface SessionData {
  user: User | null
  session?: {
    id: string
    token: string
    expiresAt: Date
  }
}
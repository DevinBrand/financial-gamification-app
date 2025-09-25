// src/lib/auth-server-simple.ts - Working Better Auth Server Configuration
import { betterAuth } from "better-auth"
import { 
  emailOTP,
  phoneNumber,
  twoFactor,
  admin,
  apiKey
} from "better-auth/plugins"
import { Pool } from "pg"
import { mailtrapService } from "../services/email/mailtrap"

// Database configuration - PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/financial_gamification_app",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

export const auth = betterAuth({
  database: pool,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
      await mailtrapService.sendEmailVerification(
        user.email,
        user.name,
        url
      )
    },
  },
  forgetPassword: {
    sendResetPassword: async ({ user, url }: { user: any; url: string }) => {
      await mailtrapService.sendPasswordReset(
        user.email,
        user.name,
        url
      )
    },
  },
  rateLimit: {
    window: 60, // 1 minute
    max: 100, // 100 requests per minute
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.COOKIE_DOMAIN,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    // Two-Factor Authentication
    twoFactor({
      issuer: process.env.APP_NAME || "Financial Gamification App",
    }),

    // Phone Number Verification
    phoneNumber(),

    // Email OTP
    emailOTP(),

    // Admin functionality
    admin(),

    // API Keys
    apiKey(),
  ],
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "github"],
    },
  },
  user: {
    additionalFields: {
      firstName: {
        type: "string",
        required: false,
      },
      lastName: {
        type: "string",
        required: false,
      },
      bio: {
        type: "string",
        required: false,
      },
      subscriptionStatus: {
        type: "string",
        required: false,
        defaultValue: "free",
      },
      customerId: {
        type: "string",
        required: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
      },
    },
  },
  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.PROD_CLIENT_URL || "https://yourdomain.com",
  ],
})

export type Auth = typeof auth
// src/lib/auth-server.ts - Complete Better Auth Server Configuration
import { betterAuth } from "better-auth"
import { 
  emailOTP,
  phoneNumber,
  twoFactor,
  admin,
  apiKey,
  passkey,
  magicLink,
  emailOtpSignIn
} from "better-auth/plugins"
import { Pool } from "pg"
import { haveIBeenPwned, captcha, deviceDetection } from "./auth-plugins"
import { stripePlugin } from "./stripe-auth-plugin"
import { mailtrapService } from "../services/email/mailtrap"

// Database configuration - PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || "postgresql://localhost:5432/auth_db",
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
    passwordStrengthCheck: true,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/github`,
    },
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/discord`,
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url, token }) => {
      await mailtrapService.sendEmailVerification(
        user.email,
        user.name,
        url
      )
    },
  },
  forgetPassword: {
    sendResetPassword: async ({ user, url, token }) => {
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
    storage: "database", // Use database for rate limiting
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubDomainCookies: {
      enabled: true,
      domain: process.env.COOKIE_DOMAIN,
    },
    useSecureCookies: process.env.NODE_ENV === "production",
    defaultCookieAttributes: {
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  },
  plugins: [
    // Two-Factor Authentication
    twoFactor({
      issuer: process.env.APP_NAME || "Financial Gamification App",
      otpOptions: {
        period: 30,
        digits: 6,
      },
      backupCodes: {
        enabled: true,
        length: 10,
        amount: 8,
      },
    }),

    // Phone Number Verification
    phoneNumber({
      sendSMS: async (phoneNumber: string, otp: string) => {
        // Integration with SMS provider (Twilio, AWS SNS, etc.)
        console.log(`SMS to ${phoneNumber}: Your verification code is ${otp}`)
        
        // Example Twilio integration:
        // const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
        // await twilio.messages.create({
        //   body: `Your verification code is: ${otp}`,
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: phoneNumber
        // })
      },
      otpLength: 6,
      expiresIn: 60 * 10, // 10 minutes
    }),

    // Email OTP
    emailOTP({
      sendEmailOTP: async ({ email, otp, type }) => {
        const subject = type === "sign-in" 
          ? "Your sign-in code" 
          : "Your verification code"
        
        await mailtrapService.sendEmail({
          to: email,
          subject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333;">Verification Code</h2>
              </div>
              
              <p>Use this code to complete your ${type}:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">
                  ${otp}
                </div>
              </div>
              
              <p style="color: #666;">This code will expire in 10 minutes.</p>
              <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; text-align: center;">
                Financial Gamification App
              </p>
            </div>
          `,
        })
      },
      otpLength: 6,
      expiresIn: 60 * 10, // 10 minutes
    }),

    // Email OTP Sign-in
    emailOtpSignIn({
      sendEmailOTP: async ({ email, otp }) => {
        await mailtrapService.sendEmail({
          to: email,
          subject: "Sign in to your account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333;">Sign In Code</h2>
              </div>
              
              <p>Use this code to sign in to your account:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; font-size: 32px; font-weight: bold; color: #007bff; letter-spacing: 8px;">
                  ${otp}
                </div>
              </div>
              
              <p style="color: #666;">This code will expire in 10 minutes.</p>
              <p style="color: #666;">If you didn't request this code, please ignore this email.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; text-align: center;">
                Financial Gamification App
              </p>
            </div>
          `,
        })
      },
    }),

    // Admin functionality
    admin({
      defaultRole: "user",
      roleHierarchy: {
        admin: ["user", "moderator"],
        moderator: ["user"],
        user: [],
      },
    }),

    // API Keys
    apiKey({
      length: 32,
      prefix: "fga_", // Financial Gamification App prefix
    }),

    // Passkeys/WebAuthn
    passkey({
      rpName: process.env.APP_NAME || "Financial Gamification App",
      rpID: process.env.RP_ID || "localhost",
      origin: process.env.CLIENT_URL || "http://localhost:3000",
    }),

    // Magic Link
    magicLink({
      sendMagicLink: async ({ email, url, token }) => {
        await mailtrapService.sendEmail({
          to: email,
          subject: "Sign in to your account",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333;">🔗 Magic Sign In Link</h2>
              </div>
              
              <p>Click the button below to sign in to your account:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${url}" 
                   style="background: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  🚀 Sign In to Your Account
                </a>
              </div>
              
              <p style="color: #666;">This link will expire in 1 hour for security reasons.</p>
              <p style="color: #666;">If you didn't request this link, please ignore this email.</p>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
              <p style="color: #888; font-size: 12px; text-align: center;">
                Financial Gamification App
              </p>
            </div>
          `,
        })
      },
      expiresIn: 60 * 60, // 1 hour
    }),

    // Custom Plugins
    haveIBeenPwned(),
    captcha(),
    deviceDetection(),
    stripePlugin(),
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
        input: false, // Don't include in default forms
      },
      lastName: {
        type: "string",
        required: false,
        input: false,
      },
      bio: {
        type: "string",
        required: false,
        input: false,
      },
      isPublicProfile: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      subscriptionStatus: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
      subscriptionId: {
        type: "string",
        required: false,
        input: false,
      },
      customerId: {
        type: "string",
        required: false,
        input: false,
      },
      lastLoginAt: {
        type: "date",
        required: false,
        input: false,
      },
      loginCount: {
        type: "number",
        required: false,
        defaultValue: 0,
        input: false,
      },
    },
  },
  trustedOrigins: [
    process.env.CLIENT_URL || "http://localhost:3000",
    process.env.PROD_CLIENT_URL || "https://yourdomain.com",
  ],
  logger: {
    level: process.env.NODE_ENV === "production" ? "error" : "debug",
    disabled: false,
  },
})

export type Auth = typeof auth
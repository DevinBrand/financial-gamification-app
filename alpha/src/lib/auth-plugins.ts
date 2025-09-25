// src/lib/auth-plugins.ts - Custom Auth Plugins
import type { BetterAuthPlugin } from "better-auth"
import crypto from "crypto"
import axios from "axios"

// Have I Been Pwned Plugin
export const haveIBeenPwned = (): BetterAuthPlugin => {
  return {
    id: "have-i-been-pwned",
    hooks: {
      before: [
        {
          matcher: (context) => context.path === "/sign-up/email",
          handler: async (context) => {
            const body = await context.body
            const password = body?.password

            if (password && typeof password === "string") {
              // Check password against Have I Been Pwned database
              const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
              const prefix = sha1Hash.substring(0, 5)
              const suffix = sha1Hash.substring(5)

              try {
                const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`)
                const hashes = response.data.split('\n')
                
                for (const hash of hashes) {
                  const [hashSuffix, count] = hash.split(':')
                  if (hashSuffix === suffix) {
                    throw new Error(`This password has been compromised in ${count} data breaches. Please choose a different password.`)
                  }
                }
              } catch (error: any) {
                if (error.message.includes('compromised')) {
                  throw error
                }
                // If API is down, continue with registration but log the error
                console.warn('Have I Been Pwned API unavailable:', error.message)
              }
            }

            return context
          },
        },
      ],
    },
    endpoints: {
      "/auth/password/check-breach": {
        method: "POST",
        handler: async (request: Request) => {
          try {
            const { password } = await request.json()
            
            if (!password) {
              return new Response(JSON.stringify({ 
                success: false, 
                error: "Password is required" 
              }), { 
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

            const sha1Hash = crypto.createHash('sha1').update(password).digest('hex').toUpperCase()
            const prefix = sha1Hash.substring(0, 5)
            const suffix = sha1Hash.substring(5)

            const response = await axios.get(`https://api.pwnedpasswords.com/range/${prefix}`)
            const hashes = response.data.split('\n')
            
            for (const hash of hashes) {
              const [hashSuffix, count] = hash.split(':')
              if (hashSuffix === suffix) {
                return new Response(JSON.stringify({
                  success: true,
                  data: {
                    isBreached: true,
                    breachCount: parseInt(count),
                    warning: `This password has been found in ${count} data breaches.`
                  }
                }), {
                  headers: { "Content-Type": "application/json" }
                })
              }
            }

            return new Response(JSON.stringify({
              success: true,
              data: {
                isBreached: false
              }
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: "Unable to check password breach status"
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },
    },
  }
}

// Captcha Plugin
export const captcha = (): BetterAuthPlugin => {
  return {
    id: "captcha",
    hooks: {
      before: [
        {
          matcher: (context) => 
            context.path === "/sign-up/email" || 
            context.path === "/sign-in/email" ||
            context.path === "/forget-password",
          handler: async (context) => {
            const body = await context.body
            const captchaToken = body?.captchaToken

            if (process.env.RECAPTCHA_SECRET_KEY && captchaToken) {
              try {
                const verifyResponse = await axios.post(
                  'https://www.google.com/recaptcha/api/siteverify',
                  `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${captchaToken}`,
                  {
                    headers: {
                      'Content-Type': 'application/x-www-form-urlencoded'
                    }
                  }
                )

                if (!verifyResponse.data.success) {
                  throw new Error('Captcha verification failed')
                }
              } catch (error) {
                throw new Error('Captcha verification failed')
              }
            }

            return context
          },
        },
      ],
    },
    endpoints: {
      "/auth/captcha/verify": {
        method: "POST",
        handler: async (request: Request) => {
          try {
            const { token, action } = await request.json()
            
            if (!process.env.RECAPTCHA_SECRET_KEY) {
              return new Response(JSON.stringify({
                success: true,
                data: { verified: true }
              }), {
                headers: { "Content-Type": "application/json" }
              })
            }

            const verifyResponse = await axios.post(
              'https://www.google.com/recaptcha/api/siteverify',
              `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
              {
                headers: {
                  'Content-Type': 'application/x-www-form-urlencoded'
                }
              }
            )

            const isValid = verifyResponse.data.success && 
              (!action || verifyResponse.data.action === action) &&
              (verifyResponse.data.score === undefined || verifyResponse.data.score >= 0.5)

            return new Response(JSON.stringify({
              success: true,
              data: {
                verified: isValid,
                score: verifyResponse.data.score,
                action: verifyResponse.data.action
              }
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: "Captcha verification failed"
            }), {
              status: 400,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },
    },
  }
}

// Device Detection Plugin
export const deviceDetection = (): BetterAuthPlugin => {
  return {
    id: "device-detection",
    hooks: {
      after: [
        {
          matcher: (context) => context.path === "/sign-in/email" && context.context.user,
          handler: async (context) => {
            const user = context.context.user
            const session = context.context.session
            
            if (user && session) {
              const userAgent = context.request.headers.get('user-agent') || ''
              const ipAddress = context.request.headers.get('x-forwarded-for') || 
                              context.request.headers.get('x-real-ip') || 
                              'unknown'

              // Parse user agent for device info
              const deviceInfo = parseUserAgent(userAgent)
              
              // Store device information in session or separate table
              // This would typically be stored in a devices table
              console.log('Device login detected:', {
                userId: user.id,
                sessionId: session.id,
                device: deviceInfo,
                ipAddress,
                timestamp: new Date()
              })

              // You could also check for suspicious activity here
              // and require additional verification
            }

            return context
          },
        },
      ],
    },
    endpoints: {
      "/auth/devices": {
        method: "GET",
        handler: async (request: Request) => {
          // This would fetch devices from database
          const mockDevices = [
            {
              id: "device-1",
              name: "Chrome on Windows",
              type: "desktop",
              os: "Windows 10",
              browser: "Chrome 120",
              ipAddress: "192.168.1.100",
              location: { country: "US", city: "New York" },
              isCurrent: true,
              lastUsedAt: new Date(),
              createdAt: new Date()
            }
          ]

          return new Response(JSON.stringify({
            success: true,
            data: mockDevices
          }), {
            headers: { "Content-Type": "application/json" }
          })
        },
      },
      "/auth/devices/:id": {
        method: "DELETE",
        handler: async (request: Request) => {
          const url = new URL(request.url)
          const deviceId = url.pathname.split('/').pop()
          
          // This would remove the device from database
          console.log('Revoking device:', deviceId)

          return new Response(JSON.stringify({
            success: true
          }), {
            headers: { "Content-Type": "application/json" }
          })
        },
      },
      "/auth/security-events": {
        method: "GET",
        handler: async (request: Request) => {
          // This would fetch security events from database
          const mockEvents = [
            {
              id: "event-1",
              type: "login",
              description: "Successful login from Chrome on Windows",
              ipAddress: "192.168.1.100",
              userAgent: "Mozilla/5.0...",
              location: { country: "US", city: "New York" },
              createdAt: new Date()
            }
          ]

          return new Response(JSON.stringify({
            success: true,
            data: mockEvents
          }), {
            headers: { "Content-Type": "application/json" }
          })
        },
      },
    },
  }
}

// Helper function to parse user agent
function parseUserAgent(userAgent: string) {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(userAgent)
  const isTablet = /Tablet|iPad/.test(userAgent)
  const isDesktop = !isMobile && !isTablet

  let os = 'Unknown'
  let browser = 'Unknown'

  // Detect OS
  if (/Windows NT/.test(userAgent)) os = 'Windows'
  else if (/Mac OS X/.test(userAgent)) os = 'macOS'
  else if (/Linux/.test(userAgent)) os = 'Linux'
  else if (/Android/.test(userAgent)) os = 'Android'
  else if (/iPhone|iPad/.test(userAgent)) os = 'iOS'

  // Detect Browser
  if (/Chrome/.test(userAgent)) browser = 'Chrome'
  else if (/Firefox/.test(userAgent)) browser = 'Firefox'
  else if (/Safari/.test(userAgent) && !/Chrome/.test(userAgent)) browser = 'Safari'
  else if (/Edge/.test(userAgent)) browser = 'Edge'

  return {
    type: isDesktop ? 'desktop' : isMobile ? 'mobile' : 'tablet',
    os,
    browser,
    userAgent
  }
}
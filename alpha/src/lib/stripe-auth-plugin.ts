// src/lib/stripe-auth-plugin.ts - Stripe Integration Plugin for Better Auth
import type { BetterAuthPlugin } from "better-auth"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-08-27.basil",
})

export const stripePlugin = (): BetterAuthPlugin => {
  return {
    id: "stripe-integration",
    hooks: {
      after: [
        {
          matcher: (context) => context.path === "/sign-up/email" && context.context.user,
          handler: async (context) => {
            const user = context.context.user
            
            if (user) {
              try {
                // Create Stripe customer when user signs up
                const customer = await stripe.customers.create({
                  email: user.email,
                  name: user.name,
                  metadata: {
                    userId: user.id,
                  },
                })

                // Store customer ID in user record
                // This would typically update the user in your database
                console.log('Created Stripe customer:', customer.id, 'for user:', user.id)
                
              } catch (error) {
                console.error('Failed to create Stripe customer:', error)
              }
            }

            return context
          },
        },
      ],
    },
    endpoints: {
      // Get subscription plans
      "/auth/stripe/plans": {
        method: "GET",
        handler: async (request: Request) => {
          try {
            // Fetch prices from Stripe
            const prices = await stripe.prices.list({
              active: true,
              expand: ['data.product'],
            })

            const plans = prices.data.map(price => ({
              id: price.id,
              name: (price.product as Stripe.Product).name,
              description: (price.product as Stripe.Product).description,
              price: price.unit_amount! / 100, // Convert from cents
              currency: price.currency,
              interval: price.recurring?.interval || 'one_time',
              features: (price.product as Stripe.Product).metadata.features?.split(',') || [],
              popular: (price.product as Stripe.Product).metadata.popular === 'true',
            }))

            return new Response(JSON.stringify({
              success: true,
              data: plans
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },

      // Create checkout session
      "/auth/stripe/create-checkout": {
        method: "POST",
        handler: async (request: Request) => {
          try {
            const { priceId, customerId, successUrl, cancelUrl } = await request.json()

            const session = await stripe.checkout.sessions.create({
              customer: customerId,
              payment_method_types: ['card'],
              line_items: [
                {
                  price: priceId,
                  quantity: 1,
                },
              ],
              mode: 'subscription',
              success_url: successUrl,
              cancel_url: cancelUrl,
            })

            return new Response(JSON.stringify({
              success: true,
              data: { sessionId: session.id, url: session.url }
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },

      // Create customer portal session
      "/auth/stripe/customer-portal": {
        method: "POST",
        handler: async (request: Request) => {
          try {
            const { customerId, returnUrl } = await request.json()

            const session = await stripe.billingPortal.sessions.create({
              customer: customerId,
              return_url: returnUrl,
            })

            return new Response(JSON.stringify({
              success: true,
              data: { url: session.url }
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },

      // Get user's subscriptions
      "/auth/stripe/subscriptions": {
        method: "GET",
        handler: async (request: Request) => {
          try {
            // TODO: Get customerId from authenticated user
            const customerId = "cus_placeholder" // This should come from the authenticated user
            
            if (!customerId) {
              return new Response(JSON.stringify({
                success: false,
                error: "No customer ID found"
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

            const subscriptions = await stripe.subscriptions.list({
              customer: customerId,
              status: 'all',
              expand: ['data.default_payment_method'],
            })

            const formattedSubscriptions = subscriptions.data.map(sub => ({
              id: sub.id,
              customerId: sub.customer as string,
              planId: sub.items.data[0].price.id,
              status: sub.status,
              currentPeriodStart: new Date(sub.current_period_start * 1000),
              currentPeriodEnd: new Date(sub.current_period_end * 1000),
              cancelAtPeriodEnd: sub.cancel_at_period_end,
              createdAt: new Date(sub.created * 1000),
              updatedAt: new Date(),
            }))

            return new Response(JSON.stringify({
              success: true,
              data: formattedSubscriptions
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },

      // Cancel subscription
      "/auth/stripe/subscriptions/:id/cancel": {
        method: "POST",
        handler: async (request: Request) => {
          try {
            const url = new URL(request.url)
            const subscriptionId = url.pathname.split('/').slice(-2, -1)[0]

            const subscription = await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: true,
            })

            return new Response(JSON.stringify({
              success: true,
              data: { 
                id: subscription.id, 
                cancelAtPeriodEnd: subscription.cancel_at_period_end 
              }
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },

      // Reactivate subscription
      "/auth/stripe/subscriptions/:id/reactivate": {
        method: "POST",
        handler: async (request: Request) => {
          try {
            const url = new URL(request.url)
            const subscriptionId = url.pathname.split('/').slice(-2, -1)[0]

            const subscription = await stripe.subscriptions.update(subscriptionId, {
              cancel_at_period_end: false,
            })

            return new Response(JSON.stringify({
              success: true,
              data: { 
                id: subscription.id, 
                cancelAtPeriodEnd: subscription.cancel_at_period_end 
              }
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },

      // Get payment methods
      "/auth/stripe/payment-methods": {
        method: "GET",
        handler: async (request: Request) => {
          try {
            // TODO: Get customerId from authenticated user
            const customerId = "cus_placeholder" // This should come from the authenticated user
            
            if (!customerId) {
              return new Response(JSON.stringify({
                success: false,
                error: "No customer ID found"
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

            const paymentMethods = await stripe.paymentMethods.list({
              customer: customerId,
              type: 'card',
            })

            const customer = await stripe.customers.retrieve(customerId)
            const defaultPaymentMethodId = (customer as Stripe.Customer).invoice_settings.default_payment_method as string

            const formattedMethods = paymentMethods.data.map(pm => ({
              id: pm.id,
              type: pm.type,
              card: pm.card ? {
                brand: pm.card.brand,
                last4: pm.card.last4,
                expMonth: pm.card.exp_month,
                expYear: pm.card.exp_year,
              } : null,
              isDefault: pm.id === defaultPaymentMethodId,
              createdAt: new Date(pm.created * 1000),
            }))

            return new Response(JSON.stringify({
              success: true,
              data: formattedMethods
            }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            return new Response(JSON.stringify({
              success: false,
              error: error.message
            }), {
              status: 500,
              headers: { "Content-Type": "application/json" }
            })
          }
        },
      },

      // Webhook endpoint for Stripe events
      "/auth/stripe/webhook": {
        method: "POST",
        handler: async (request: Request) => {
          try {
            const body = await request.text()
            const signature = request.headers.get('stripe-signature')!

            const event = stripe.webhooks.constructEvent(
              body,
              signature,
              process.env.STRIPE_WEBHOOK_SECRET!
            )

            // Handle the event
            switch (event.type) {
              case 'customer.subscription.created':
              case 'customer.subscription.updated':
              case 'customer.subscription.deleted':
                const subscription = event.data.object as Stripe.Subscription
                console.log('Subscription event:', event.type, subscription.id)
                // Update user's subscription status in database
                break

              case 'invoice.payment_succeeded':
                const invoice = event.data.object as Stripe.Invoice
                console.log('Payment succeeded:', invoice.id)
                // Update user's payment status
                break

              case 'invoice.payment_failed':
                const failedInvoice = event.data.object as Stripe.Invoice
                console.log('Payment failed:', failedInvoice.id)
                // Handle failed payment
                break

              default:
                console.log('Unhandled Stripe event:', event.type)
            }

            return new Response(JSON.stringify({ received: true }), {
              headers: { "Content-Type": "application/json" }
            })

          } catch (error: any) {
            console.error('Stripe webhook error:', error)
            return new Response(JSON.stringify({
              success: false,
              error: error.message
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
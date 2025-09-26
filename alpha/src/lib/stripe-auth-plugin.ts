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
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const { priceId, successUrl, cancelUrl, allowPromotionCodes, trialPeriodDays, metadata } = await request.json()

            let customerId = user.customerId
            
            // Create customer if doesn't exist
            if (!customerId) {
              const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                  userId: user.id,
                },
              })
              customerId = customer.id
              
              // TODO: Update user record with customer ID
              console.log('Created Stripe customer:', customerId, 'for user:', user.id)
            }

            const sessionData: any = {
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
            }

            if (allowPromotionCodes) {
              sessionData.allow_promotion_codes = true
            }

            if (trialPeriodDays) {
              sessionData.subscription_data = {
                trial_period_days: trialPeriodDays
              }
            }

            if (metadata) {
              sessionData.metadata = metadata
            }

            const session = await stripe.checkout.sessions.create(sessionData)

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
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const { returnUrl } = await request.json()
            const customerId = user.customerId

            if (!customerId) {
              return new Response(JSON.stringify({
                success: false,
                error: "No customer ID found for user"
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

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
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const customerId = user.customerId
            if (!customerId) {
              return new Response(JSON.stringify({
                success: false,
                error: "No customer ID found for user"
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
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const customerId = user.customerId
            if (!customerId) {
              return new Response(JSON.stringify({
                success: false,
                error: "No customer ID found for user"
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
                // This would typically involve:
                // 1. Finding the user by customer ID
                // 2. Updating their subscription status
                // 3. Creating/updating subscription records
                await handleSubscriptionEvent(subscription, event.type)
                break

              case 'invoice.payment_succeeded':
                const invoice = event.data.object as Stripe.Invoice
                console.log('Payment succeeded:', invoice.id)
                await handleInvoicePaymentSucceeded(invoice)
                break

              case 'invoice.payment_failed':
                const failedInvoice = event.data.object as Stripe.Invoice
                console.log('Payment failed:', failedInvoice.id)
                await handleInvoicePaymentFailed(failedInvoice)
                break

              case 'customer.created':
                const customer = event.data.object as Stripe.Customer
                console.log('Customer created:', customer.id)
                break

              case 'payment_method.attached':
                const paymentMethod = event.data.object as Stripe.PaymentMethod
                console.log('Payment method attached:', paymentMethod.id)
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
      // Additional endpoints for advanced subscription management
      
      // Get specific plan details
      "/auth/stripe/plans/:id": {
        method: "GET",
        handler: async (request: Request) => {
          try {
            const url = new URL(request.url)
            const priceId = url.pathname.split('/').pop()
            
            if (!priceId) {
              return new Response(JSON.stringify({
                success: false,
                error: "Price ID is required"
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

            const price = await stripe.prices.retrieve(priceId, {
              expand: ['product']
            })

            const plan = {
              id: price.id,
              productId: typeof price.product === 'string' ? price.product : price.product.id,
              name: (price.product as Stripe.Product).name,
              description: (price.product as Stripe.Product).description,
              price: price.unit_amount! / 100,
              currency: price.currency,
              interval: price.recurring?.interval || 'one_time',
              intervalCount: price.recurring?.interval_count || 1,
              trialPeriodDays: price.recurring?.trial_period_days || 0,
              features: (price.product as Stripe.Product).metadata.features?.split(',') || [],
              metadata: (price.product as Stripe.Product).metadata,
              isActive: price.active,
              isPopular: (price.product as Stripe.Product).metadata.popular === 'true',
              sortOrder: parseInt((price.product as Stripe.Product).metadata.sort_order || '0')
            }

            return new Response(JSON.stringify({
              success: true,
              data: plan
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
        }
      },

      // Get user's invoices
      "/auth/stripe/invoices": {
        method: "GET",
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const customerId = user.customerId
            if (!customerId) {
              return new Response(JSON.stringify({
                success: false,
                error: "No customer ID found for user"
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

            const invoices = await stripe.invoices.list({
              customer: customerId,
              limit: 100
            })

            const formattedInvoices = invoices.data.map(invoice => ({
              id: invoice.id,
              userId: user.id,
              subscriptionId: invoice.subscription as string || null,
              stripeCustomerId: customerId,
              amountPaid: invoice.amount_paid,
              amountDue: invoice.amount_due,
              currency: invoice.currency,
              status: invoice.status,
              invoiceNumber: invoice.number,
              hostedInvoiceUrl: invoice.hosted_invoice_url,
              invoicePdf: invoice.invoice_pdf,
              periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
              periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
              dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
              paidAt: invoice.status_transitions?.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : null,
              metadata: invoice.metadata,
              createdAt: new Date(invoice.created * 1000)
            }))

            return new Response(JSON.stringify({
              success: true,
              data: formattedInvoices
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
        }
      },

      // Update subscription
      "/auth/stripe/subscriptions/:id": {
        method: "PUT",
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const url = new URL(request.url)
            const subscriptionId = url.pathname.split('/').slice(-1)[0]
            const { priceId, quantity, prorationBehavior, metadata } = await request.json()

            const updateData: any = {}
            
            if (priceId) {
              // Get current subscription to update the price
              const subscription = await stripe.subscriptions.retrieve(subscriptionId)
              updateData.items = [{
                id: subscription.items.data[0].id,
                price: priceId,
                quantity: quantity || 1
              }]
            }

            if (metadata) {
              updateData.metadata = metadata
            }

            if (prorationBehavior) {
              updateData.proration_behavior = prorationBehavior
            }

            const subscription = await stripe.subscriptions.update(subscriptionId, updateData)

            const formattedSubscription = {
              id: subscription.id,
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              stripeCustomerId: subscription.customer as string,
              planId: subscription.items.data[0].price.id,
              status: subscription.status,
              currentPeriodStart: new Date(subscription.current_period_start * 1000),
              currentPeriodEnd: new Date(subscription.current_period_end * 1000),
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
              trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
              trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
              quantity: subscription.items.data[0].quantity,
              metadata: subscription.metadata,
              createdAt: new Date(subscription.created * 1000),
              updatedAt: new Date()
            }

            return new Response(JSON.stringify({
              success: true,
              data: formattedSubscription
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
        }
      },

      // Delete/detach payment method
      "/auth/stripe/payment-methods/:id": {
        method: "DELETE",
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const url = new URL(request.url)
            const paymentMethodId = url.pathname.split('/').pop()

            if (!paymentMethodId) {
              return new Response(JSON.stringify({
                success: false,
                error: "Payment method ID is required"
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

            await stripe.paymentMethods.detach(paymentMethodId)

            return new Response(JSON.stringify({
              success: true,
              message: "Payment method removed successfully"
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
        }
      },

      // Set default payment method
      "/auth/stripe/payment-methods/set-default": {
        method: "POST",
        handler: async (request: Request, context) => {
          try {
            const user = context.context?.user
            if (!user) {
              return new Response(JSON.stringify({
                success: false,
                error: "Authentication required"
              }), {
                status: 401,
                headers: { "Content-Type": "application/json" }
              })
            }

            const { paymentMethodId } = await request.json()
            const customerId = user.customerId

            if (!customerId) {
              return new Response(JSON.stringify({
                success: false,
                error: "No customer ID found for user"
              }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
              })
            }

            await stripe.customers.update(customerId, {
              invoice_settings: {
                default_payment_method: paymentMethodId
              }
            })

            return new Response(JSON.stringify({
              success: true,
              message: "Default payment method updated"
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
        }
      },
    },
  }
}

// Helper functions for webhook event handling
async function handleSubscriptionEvent(subscription: Stripe.Subscription, eventType: string) {
  try {
    // In a real implementation, you would:
    // 1. Find the user by customer ID
    // 2. Update/create subscription records in your database
    // 3. Update user's subscription status
    // 4. Send notifications if needed
    
    console.log(`Processing subscription ${eventType}:`, {
      subscriptionId: subscription.id,
      customerId: subscription.customer,
      status: subscription.status,
      priceId: subscription.items.data[0]?.price.id
    })
    
    // Example: Update user subscription status
    // const user = await findUserByCustomerId(subscription.customer as string)
    // if (user) {
    //   await updateUserSubscription(user.id, subscription)
    // }
  } catch (error) {
    console.error('Error handling subscription event:', error)
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log('Processing successful payment:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amountPaid: invoice.amount_paid
    })
    
    // Example: Record payment, update subscription, send receipt
    // const user = await findUserByCustomerId(invoice.customer as string)
    // if (user) {
    //   await recordPayment(user.id, invoice)
    //   await sendPaymentConfirmation(user.email, invoice)
    // }
  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log('Processing failed payment:', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amountDue: invoice.amount_due
    })
    
    // Example: Send payment failure notification, update subscription status
    // const user = await findUserByCustomerId(invoice.customer as string)
    // if (user) {
    //   await sendPaymentFailureNotification(user.email, invoice)
    //   await handleSubscriptionPastDue(user.id)
    // }
  } catch (error) {
    console.error('Error handling failed payment:', error)
  }
}
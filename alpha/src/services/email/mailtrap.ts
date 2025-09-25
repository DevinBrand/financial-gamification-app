// src/services/email/mailtrap.ts - Mailtrap Email Service Integration
import nodemailer from 'nodemailer'
import type { EmailSendRequest, EmailTemplate } from '@/types/auth.types'

class MailtrapService {
  private transporter: nodemailer.Transporter

  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.MAILTRAP_HOST || "live.smtp.mailtrap.io",
      port: parseInt(process.env.MAILTRAP_PORT || "587"),
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME!,
        pass: process.env.MAILTRAP_PASSWORD!,
      },
    })
  }

  // Send individual email
  async sendEmail(request: EmailSendRequest): Promise<{ success: boolean; error?: string }> {
    try {
      const mailOptions = {
        from: process.env.FROM_EMAIL || '"Financial Gamification App" <noreply@yourdomain.com>',
        to: Array.isArray(request.to) ? request.to.join(', ') : request.to,
        subject: request.subject,
        html: request.html,
        text: request.text,
        attachments: request.attachments?.map(att => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      }

      await this.transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error: any) {
      console.error('Mailtrap send error:', error)
      return { success: false, error: error.message }
    }
  }

  // Send email using template
  async sendTemplateEmail(
    to: string | string[],
    templateId: string,
    variables: Record<string, any> = {}
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const template = await this.getTemplate(templateId)
      if (!template) {
        return { success: false, error: 'Template not found' }
      }

      let html = template.htmlContent
      let text = template.textContent
      let subject = template.subject

      // Replace variables in template
      Object.keys(variables).forEach(key => {
        const value = variables[key]
        html = html.replace(new RegExp(`{{${key}}}`, 'g'), value)
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), value)
        subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value)
      })

      return await this.sendEmail({
        to,
        subject,
        html,
        text,
      })
    } catch (error: any) {
      console.error('Template email send error:', error)
      return { success: false, error: error.message }
    }
  }

  // Authentication-related email templates
  async sendWelcomeEmail(to: string, name: string): Promise<{ success: boolean; error?: string }> {
    return this.sendTemplateEmail(to, 'welcome', { name })
  }

  async sendEmailVerification(
    to: string, 
    name: string, 
    verificationUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">Welcome to Financial Gamification App!</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Thanks for signing up! Please verify your email address by clicking the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" 
               style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Verify Email Address
            </a>
          </div>
          
          <p>This link will expire in 24 hours for security reasons.</p>
          
          <p>If you didn't create an account, please ignore this email.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Financial Gamification App<br>
            This email was sent to ${to}
          </p>
        </div>
      `,
    })
  }

  async sendPasswordReset(
    to: string, 
    name: string, 
    resetUrl: string
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">Password Reset Request</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>We received a request to reset your password. Click the button below to choose a new password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Reset Password
            </a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Financial Gamification App<br>
            This email was sent to ${to}
          </p>
        </div>
      `,
    })
  }

  async sendTwoFactorEnabled(to: string, name: string): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'Two-Factor Authentication Enabled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">🔐 Security Update</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Two-factor authentication has been successfully enabled on your account. This adds an extra layer of security to keep your account safe.</p>
          
          <div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #155724;">
              ✅ Your account is now more secure with 2FA enabled
            </p>
          </div>
          
          <p>If you didn't enable 2FA, please contact support immediately.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Financial Gamification App<br>
            This email was sent to ${to}
          </p>
        </div>
      `,
    })
  }

  async sendLoginAlert(
    to: string, 
    name: string, 
    device: string, 
    location: string, 
    time: Date
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'New login to your account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">🚨 New Login Alert</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>We detected a new login to your account:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Device:</strong> ${device}</p>
            <p><strong>Location:</strong> ${location}</p>
            <p><strong>Time:</strong> ${time.toLocaleString()}</p>
          </div>
          
          <p>If this was you, no action is needed. If you don't recognize this activity, please secure your account immediately by changing your password.</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Financial Gamification App<br>
            This email was sent to ${to}
          </p>
        </div>
      `,
    })
  }

  // Billing-related emails
  async sendSubscriptionConfirmation(
    to: string, 
    name: string, 
    planName: string, 
    amount: number
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'Subscription Confirmed',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">🎉 Welcome to ${planName}!</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>Thank you for subscribing to ${planName}! Your subscription has been confirmed.</p>
          
          <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Plan:</strong> ${planName}</p>
            <p><strong>Amount:</strong> $${amount}</p>
            <p><strong>Billing:</strong> Monthly</p>
          </div>
          
          <p>You now have access to all premium features. Enjoy your enhanced experience!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Financial Gamification App<br>
            This email was sent to ${to}
          </p>
        </div>
      `,
    })
  }

  async sendPaymentFailed(
    to: string, 
    name: string, 
    amount: number, 
    retryDate: Date
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: 'Payment Failed - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc3545;">⚠️ Payment Failed</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>We couldn't process your payment of $${amount} for your subscription.</p>
          
          <div style="background: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #721c24;">
              Please update your payment method to continue enjoying our services.
            </p>
          </div>
          
          <p>We'll retry the payment on ${retryDate.toLocaleDateString()}. If the payment fails again, your subscription may be cancelled.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/billing" 
               style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Update Payment Method
            </a>
          </div>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Financial Gamification App<br>
            This email was sent to ${to}
          </p>
        </div>
      `,
    })
  }

  // App update notifications
  async sendAppUpdate(
    to: string, 
    name: string, 
    version: string, 
    features: string[]
  ): Promise<{ success: boolean; error?: string }> {
    return this.sendEmail({
      to,
      subject: `New App Update - Version ${version}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333;">🚀 App Update Available</h1>
          </div>
          
          <p>Hi ${name},</p>
          
          <p>We've just released version ${version} with exciting new features and improvements!</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3>What's New:</h3>
            <ul>
              ${features.map(feature => `<li>${feature}</li>`).join('')}
            </ul>
          </div>
          
          <p>Update now to enjoy these new features!</p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Financial Gamification App<br>
            This email was sent to ${to}
          </p>
        </div>
      `,
    })
  }

  // Get email template (this would typically fetch from database)
  private async getTemplate(templateId: string): Promise<EmailTemplate | null> {
    const templates: Record<string, EmailTemplate> = {
      welcome: {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to Financial Gamification App!',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Welcome, {{name}}!</h1>
            <p>Thanks for joining Financial Gamification App. Get started with our features!</p>
          </div>
        `,
        textContent: 'Welcome, {{name}}! Thanks for joining Financial Gamification App.',
        variables: ['name'],
      },
    }

    return templates[templateId] || null
  }
}

export const mailtrapService = new MailtrapService()
export default mailtrapService
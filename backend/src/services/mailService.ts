import nodemailer, { Transporter } from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

// Email validation schemas
const emailSchema = z.object({
  to: z.string().email('Invalid email address'),
  subject: z.string().min(1, 'Subject is required'),
  template: z.string().min(1, 'Template name is required'),
  context: z.record(z.any()).optional(),
});

const passwordResetSchema = z.object({
  resetToken: z.string().min(1, 'Reset token is required'),
  resetUrl: z.string().url('Invalid reset URL'),
});

export type EmailOptions = z.infer<typeof emailSchema>;
export type PasswordResetContext = z.infer<typeof passwordResetSchema>;

interface MailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  from: {
    name: string;
    email: string;
  };
}

export class MailService {
  private transporter: Transporter | null = null;
  private isConfigured = false;
  private templateCache = new Map<string, HandlebarsTemplateDelegate>();

  constructor() {
    this.initializeService();
  }

  private async initializeService() {
    try {
      await this.setupTransporter();
      await this.preloadTemplates();
      console.log('📧 Mail service initialized successfully');
    } catch (error) {
      console.warn('⚠️  Mail service initialization failed:', error);
      console.warn('📨 Email features will be disabled');
    }
  }

  private async setupTransporter() {
    const config = this.getMailConfig();

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.auth,
      tls: {
        rejectUnauthorized: false, // For development with self-signed certificates
      },
    });

    // Test connection
    if (this.transporter) {
      await this.transporter.verify();
      this.isConfigured = true;
      console.log(`📧 SMTP connection established: ${config.host}:${config.port}`);
    } else {
      throw new Error('Failed to create SMTP transporter');
    }
  }

  private getMailConfig(): MailConfig {
    const requiredEnvVars = [
      'SMTP_HOST',
      'SMTP_PORT',
      'SMTP_USER',
      'SMTP_PASS',
      'MAIL_FROM_NAME',
      'MAIL_FROM_EMAIL'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    return {
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
      from: {
        name: process.env.MAIL_FROM_NAME!,
        email: process.env.MAIL_FROM_EMAIL!,
      },
    };
  }

  private async preloadTemplates() {
    const templateDir = path.join(__dirname, '../../templates/emails');

    try {
      // Check if templates directory exists
      if (!fs.existsSync(templateDir)) {
        console.log('📂 Creating email templates directory...');
        fs.mkdirSync(templateDir, { recursive: true });
      }

      const templateFiles = ['welcome.hbs', 'password-reset.hbs'];

      for (const templateFile of templateFiles) {
        const templatePath = path.join(templateDir, templateFile);

        if (fs.existsSync(templatePath)) {
          const templateContent = fs.readFileSync(templatePath, 'utf-8');
          const compiledTemplate = handlebars.compile(templateContent);
          const templateName = path.basename(templateFile, '.hbs');
          this.templateCache.set(templateName, compiledTemplate);
          console.log(`📋 Template loaded: ${templateName}`);
        }
      }
    } catch (error) {
      console.error('❌ Failed to preload templates:', error);
    }
  }

  /**
   * Send welcome email to new users with invite codes
   */
  async sendWelcomeEmail(user: { email: string; username: string }, inviteCodes: string[]): Promise<void> {
    if (!this.isConfigured) {
      console.warn('📧 Mail not configured - skipping welcome email');
      return;
    }

    const context = {
      username: user.username,
      inviteCodes,
      gameUrl: process.env.FRONTEND_URL || 'https://swuniverse.net',
      currentYear: new Date().getFullYear(),
    };

    await this.sendMail({
      to: user.email,
      subject: 'Willkommen im Star Wars Universe! 🚀',
      template: 'welcome',
      context,
    });

    console.log(`📧 Welcome email sent to ${user.email}`);
  }

  /**
   * Send password reset email with secure token
   */
  async sendPasswordResetEmail(user: { email: string; username: string }, resetToken: string): Promise<void> {
    if (!this.isConfigured) {
      console.warn('📧 Mail not configured - skipping password reset email');
      return;
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'https://swuniverse.net'}/reset-password?token=${resetToken}`;

    const context = {
      username: user.username,
      resetUrl,
      resetToken,
      expirationHours: 24,
      currentYear: new Date().getFullYear(),
    };

    await this.sendMail({
      to: user.email,
      subject: 'Star Wars Universe - Passwort zurücksetzen',
      template: 'password-reset',
      context,
    });

    console.log(`📧 Password reset email sent to ${user.email}`);
  }

  /**
   * Generic email sending method
   */
  private async sendMail(options: EmailOptions): Promise<void> {
    if (!this.transporter || !this.isConfigured) {
      throw new Error('Mail service not properly configured');
    }

    // Validate input
    const validatedOptions = emailSchema.parse(options);

    // Get compiled template
    const template = this.getTemplate(validatedOptions.template);

    // Render HTML content
    const htmlContent = template(validatedOptions.context || {});

    // Get mail configuration for sender info
    const config = this.getMailConfig();

    const mailOptions = {
      from: `"${config.from.name}" <${config.from.email}>`,
      to: validatedOptions.to,
      subject: validatedOptions.subject,
      html: htmlContent,
      // Optional: Add text version for better compatibility
      text: this.stripHtml(htmlContent),
    };

    try {
      await this.transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error(`Failed to send email to ${validatedOptions.to}`);
    }
  }

  /**
   * Get compiled template by name
   */
  private getTemplate(templateName: string): HandlebarsTemplateDelegate {
    const template = this.templateCache.get(templateName);

    if (!template) {
      // Fallback: Create basic template if not found
      console.warn(`⚠️  Template '${templateName}' not found, using fallback`);
      return this.getFallbackTemplate(templateName);
    }

    return template;
  }

  /**
   * Generate fallback template for missing templates
   */
  private getFallbackTemplate(templateName: string): HandlebarsTemplateDelegate {
    let fallbackContent = '';

    if (templateName === 'welcome') {
      fallbackContent = `
        <div style="font-family: monospace; background: #000; color: #00ffff; padding: 20px;">
          <h1>STAR WARS UNIVERSE</h1>
          <h2>Willkommen, {{username}}!</h2>
          <p>Deine Invite-Codes:</p>
          {{#each inviteCodes}}
            <code style="background: #003333; padding: 5px;">{{this}}</code><br>
          {{/each}}
          <p><a href="{{gameUrl}}" style="color: #00ffff;">Zum Spiel</a></p>
        </div>
      `;
    } else if (templateName === 'password-reset') {
      fallbackContent = `
        <div style="font-family: monospace; background: #000; color: #00ffff; padding: 20px;">
          <h1>STAR WARS UNIVERSE</h1>
          <h2>Passwort zurücksetzen</h2>
          <p>Hallo {{username}},</p>
          <p><a href="{{resetUrl}}" style="color: #00ffff;">Passwort zurücksetzen</a></p>
          <p>Link gültig für {{expirationHours}} Stunden.</p>
        </div>
      `;
    }

    return handlebars.compile(fallbackContent);
  }

  /**
   * Strip HTML tags for text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Check if mail service is properly configured
   */
  isMailEnabled(): boolean {
    return this.isConfigured && this.transporter !== null;
  }

  /**
   * Get service status for debugging
   */
  getStatus(): { configured: boolean; templatesLoaded: number; host?: string } {
    const config = this.isConfigured ? this.getMailConfig() : null;

    return {
      configured: this.isConfigured,
      templatesLoaded: this.templateCache.size,
      host: config?.host,
    };
  }
}

// Export singleton instance
export const mailService = new MailService();
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

interface EmailOptions {
  to: string;
  subject: string;
  resetUrl: string;
}

interface TestEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  senderEmail: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false, // For self-signed certificates
      },
    });
  }

  private async loadEmailTemplate(): Promise<string> {
    const templatePath = path.join(process.cwd(), 'src', 'templates', 'password-reset-email.html');
    return fs.readFileSync(templatePath, 'utf-8');
  }

  private replaceTemplateVariables(template: string, variables: Record<string, string>): string {
    let result = template;
    Object.entries(variables).forEach(([key, value]) => {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value);
    });
    return result;
  }

  async sendPasswordResetEmail({ to, subject, resetUrl }: EmailOptions): Promise<boolean> {
    try {
      // Verify SMTP connection
      await this.transporter.verify();

      // Load and prepare email template
      const template = await this.loadEmailTemplate();
      const htmlContent = this.replaceTemplateVariables(template, {
        RESET_URL: resetUrl,
      });

      // Email options
      const mailOptions = {
        from: {
          name: 'Untitled88',
          address: process.env.SMTP_USER!,
        },
        to: to,
        subject: subject,
        html: htmlContent,
        // Text fallback for email clients that don't support HTML
        text: `
Hi there,

We received a request to reset your password for your Untitled88 account.

Click this link to reset your password: ${resetUrl}

This link will expire in 24 hours for your security.

If you didn't request this password reset, you can safely ignore this email.

Best regards,
The Untitled88 Team
        `.trim(),
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      

      return true;
    } catch (error) {
      return false;
    }
  }

  async sendTestEmail({ to, subject, htmlContent, senderEmail }: TestEmailOptions): Promise<boolean> {
    try {
      // Verify SMTP connection
      await this.transporter.verify();

      // Email options
      const mailOptions = {
        from: {
          name: 'Untitled88',
          address: process.env.SMTP_USER!,
        },
        to: to,
        subject: subject,
        html: htmlContent,
        // Text fallback - extract text from HTML or provide basic fallback
        text: `This is a test email sent from Untitled88.\n\nSent by: ${senderEmail}\n\nIf you can't see the email content, please enable HTML viewing in your email client.`,
      };

      // Send email
      const info = await this.transporter.sendMail(mailOptions);
      

      return true;
    } catch (error) {
      return false;
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default EmailService;

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, type Transporter } from 'nodemailer';
import type { AppEnvironment } from '../../../config/env';

@Injectable()
export class AuthMailService {
  private readonly logger = new Logger(AuthMailService.name);
  private readonly transporter?: Transporter;

  constructor(private readonly config: ConfigService<AppEnvironment, true>) {
    if (this.config.get('MAIL_MODE', { infer: true }) === 'smtp') {
      const user = this.config.get('SMTP_USER', { infer: true });
      const password = this.config.get('SMTP_PASSWORD', { infer: true });

      this.transporter = createTransport({
        host: this.config.get('SMTP_HOST', { infer: true }),
        port: this.config.get('SMTP_PORT', { infer: true }),
        secure: this.config.get('SMTP_SECURE', { infer: true }),
        ...(user && password ? { auth: { user, pass: password } } : {}),
      });
    }
  }

  sendEmailVerification(email: string, token: string): Promise<void> {
    const url = this.createClientUrl('/verify-email', token);
    return this.send({
      to: email,
      subject: 'Verify your email address',
      text: `Verify your email address by opening this link: ${url}`,
      html: `<p>Verify your email address:</p><p><a href="${url}">Verify email</a></p>`,
      developmentUrl: url,
    });
  }

  sendPasswordReset(email: string, token: string): Promise<void> {
    const url = this.createClientUrl('/reset-password', token);
    return this.send({
      to: email,
      subject: 'Reset your password',
      text: `Reset your password by opening this link: ${url}`,
      html: `<p>Reset your password:</p><p><a href="${url}">Reset password</a></p>`,
      developmentUrl: url,
    });
  }

  private async send(message: {
    to: string;
    subject: string;
    text: string;
    html: string;
    developmentUrl: string;
  }): Promise<void> {
    if (!this.transporter) {
      this.logger.log(
        `[development email] ${message.to}: ${message.developmentUrl}`,
      );
      return;
    }

    await this.transporter.sendMail({
      from: this.config.get('MAIL_FROM', { infer: true }),
      to: message.to,
      subject: message.subject,
      text: message.text,
      html: message.html,
    });
  }

  private createClientUrl(path: string, token: string): string {
    const url = new URL(path, this.config.get('CLIENT_URL', { infer: true }));
    url.searchParams.set('token', token);
    return url.toString();
  }
}

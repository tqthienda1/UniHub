import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { INotificationChannel } from '../interfaces/notification-channel.interface';
import { NotificationPayload } from '../types/notification-payload.type';

@Injectable()
export class EmailChannel implements INotificationChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn(
        'SMTP configuration is missing. Email notifications may not work.',
      );
    }
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send(recipient: string, payload: NotificationPayload): Promise<void> {
    this.logger.log(`Sending email to ${recipient}`);
    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || '"UniHub" <no-reply@unihub.com>',
        to: recipient,
        subject: payload.subject,
        text: payload.body,
        html: payload.body, // In a real app, you'd use a template engine
      });
      this.logger.log(`Email sent successfully to ${recipient}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${recipient}: ${error.message}`);
      throw error;
    }
  }
}

import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { NotificationsService } from './notifications.service';
import { NotificationPayload } from './types/notification-payload.type';

@Processor('notification-queue')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send-notification')
  async handleSendNotification(job: Job<{ recipient: string; payload: NotificationPayload }>) {
    this.logger.log(`Processing job ${job.id}: Sending notification to ${job.data.recipient}`);
    try {
      await this.notificationsService.executeSend(job.data.recipient, job.data.payload);
      this.logger.log(`Job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }
}

import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { INotificationChannel } from './interfaces/notification-channel.interface';
import { NotificationPayload } from './types/notification-payload.type';
import { EmailChannel } from './channels/email.channel';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly channels: INotificationChannel[] = [];

  constructor(
    @InjectQueue('notification-queue') private readonly notificationQueue: Queue,
    private readonly emailChannel: EmailChannel,
  ) {}

  onModuleInit() {
    this.registerChannel(this.emailChannel);
  }

  registerChannel(channel: INotificationChannel) {
    this.channels.push(channel);
  }

  async send(recipient: string, payload: NotificationPayload): Promise<void> {
    this.logger.log(`Queueing notification for ${recipient}`);
    await this.notificationQueue.add('send-notification', {
      recipient,
      payload,
    });
  }

  async executeSend(recipient: string, payload: NotificationPayload): Promise<void> {
    this.logger.log(`Executing notification delivery to ${recipient}`);
    
    const results = await Promise.allSettled(
      this.channels.map((channel) => channel.send(recipient, payload)),
    );

    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        this.logger.error(
          `Failed to send notification via channel ${index}: ${result.reason}`,
        );
      }
    });
  }
}

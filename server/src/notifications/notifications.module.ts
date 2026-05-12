import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { NotificationsService } from './notifications.service';
import { EmailChannel } from './channels/email.channel';
import { NotificationsProcessor } from './notifications.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notification-queue',
    }),
  ],
  providers: [NotificationsService, EmailChannel, NotificationsProcessor],
  exports: [NotificationsService],
})
export class NotificationsModule {}

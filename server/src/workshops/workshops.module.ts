import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';
import { AiSummaryService } from './ai-summary.service';
import { AiSummaryProcessor } from './ai-summary.processor';
import { WorkshopsRepository } from './workshops.repository';
import { QrService } from './qr.service';
import { WorkshopsGateway } from './workshops.gateway';
import { WorkshopsAdminController } from './workshops-admin.controller';
import { RegistrationsController } from './registrations.controller';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-summary-queue',
      limiter: {
        max: 15,
        duration: 60000,
      },
    }),
    RedisModule,
    NotificationsModule,
    PaymentsModule,
  ],
  controllers: [
    WorkshopsController,
    WorkshopsAdminController,
    RegistrationsController,
  ],

  providers: [
    WorkshopsService,
    AiSummaryService,
    AiSummaryProcessor,
    WorkshopsRepository,
    QrService,
    WorkshopsGateway,
  ],
  exports: [
    WorkshopsService,
    AiSummaryService,
    WorkshopsRepository,
    QrService,
    WorkshopsGateway,
  ],
})
export class WorkshopsModule {}

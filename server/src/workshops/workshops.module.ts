import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { WorkshopsController } from './workshops.controller';
import { WorkshopsService } from './workshops.service';
import { AiSummaryService } from './ai-summary.service';
import { AiSummaryProcessor } from './ai-summary.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'ai-summary-queue',
      limiter: {
        max: 15,
        duration: 60000,
      },
    }),
  ],
  controllers: [WorkshopsController],
  providers: [WorkshopsService, AiSummaryService, AiSummaryProcessor],
  exports: [WorkshopsService, AiSummaryService],
})
export class WorkshopsModule {}

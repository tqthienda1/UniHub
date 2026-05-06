import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkshopsService {
  private readonly logger = new Logger(WorkshopsService.name);

  constructor(
    @InjectQueue('ai-summary-queue') private readonly aiSummaryQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}

  async getWorkshop(id: string) {
    let workshop = await this.prisma.workshop.findUnique({ where: { id } });
    if (!workshop) {
      workshop = await this.prisma.workshop.create({
        data: {
          id,
          title: 'Demo AI Workshop',
          status: 'active',
          aiSummary: null,
          room: 'Virtual',
          startTime: new Date(),
          capacity: 100,
          availableSlots: 100,
        },
      });
    }
    return workshop;
  }

  async queueAiSummary(workshopId: string, pdfBuffer: Buffer) {
    this.logger.log(`Queueing AI summary job for workshop: ${workshopId}`);
    
    try {
      // Adding a timeout so it doesn't hang forever if Redis is down
      const jobPromise = this.aiSummaryQueue.add('generate-summary', {
        workshopId,
        pdfBuffer,
      });
      
      const job = await Promise.race([
        jobPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Redis timeout')), 3000))
      ]) as any;

      return { jobId: job?.id, message: 'PDF uploaded and summary job queued.' };
    } catch (error) {
      this.logger.error('Failed to queue job', error);
      // Fallback or error response
      return { jobId: null, message: 'Failed to queue job. Check if Redis is running.' };
    }
  }
}

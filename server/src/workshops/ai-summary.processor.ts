import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { AiSummaryService } from './ai-summary.service';
import { PrismaService } from '../prisma/prisma.service';

@Processor('ai-summary-queue')
export class AiSummaryProcessor {
  private readonly logger = new Logger(AiSummaryProcessor.name);

  constructor(
    private readonly aiSummaryService: AiSummaryService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('generate-summary')
  async handleGenerateSummary(job: Job<{ workshopId: string; pdfBuffer: Buffer }>) {
    const { workshopId, pdfBuffer } = job.data;
    this.logger.log(`Processing AI summary for workshop: ${workshopId}`);

    try {
      // 1. Extract text from PDF
      // pdfBuffer might be a plain object after serialization in Bull/Redis, 
      // or an actual Buffer if Bull handles it directly.
      const buffer = Buffer.isBuffer(pdfBuffer) 
        ? pdfBuffer 
        : Buffer.from((pdfBuffer as any).data || pdfBuffer);
      const text = await this.aiSummaryService.extractTextFromPdf(buffer);

      // 2. Generate summary with AI
      const summary = await this.aiSummaryService.generateSummary(text);

      // 3. Update database
      await this.prisma.workshop.update({
        where: { id: workshopId },
        data: { aiSummary: summary },
      });

      this.logger.log(`Successfully generated summary for workshop: ${workshopId}`);
    } catch (error) {
      this.logger.error(`Failed to process AI summary for workshop: ${workshopId}`, error);
      throw error; // Let Bull handle retries
    }
  }
}

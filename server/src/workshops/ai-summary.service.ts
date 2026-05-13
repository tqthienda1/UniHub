import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pdf = require('pdf-parse');

@Injectable()
export class AiSummaryService {
  private readonly logger = new Logger(AiSummaryService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const data = await new (pdf as any).PDFParse({ data: buffer }).getText();
      return typeof data === 'string'
        ? data
        : data.text || JSON.stringify(data);
    } catch (error) {
      this.logger.error('Failed to extract text from PDF', error);
      throw new Error('PDF text extraction failed');
    }
  }

  async generateSummary(text: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction:
          'You are a helpful assistant that summarizes workshop introduction documents. Provide a concise summary (max 30 words).',
      });

      const prompt = `Please summarize the following workshop content:\n\n${text}`;

      const result = await model.generateContent(prompt);
      const response = result.response;

      // Handle empty response or candidates
      if (!response.candidates || response.candidates.length === 0) {
        return 'No summary generated.';
      }

      const summary = response.text();
      return summary || 'No summary generated.';
    } catch (error: any) {
      // 5.3.1 Implement error handling for Gemini-specific exceptions
      if (error.message?.includes('SAFETY')) {
        this.logger.warn('Gemini blocked the content due to safety settings');
        return 'Summary blocked by safety filters.';
      }
      if (error.status === 429 || error.message?.includes('quota')) {
        this.logger.warn('Gemini quota exhausted');
        throw new Error('Gemini quota exhausted'); // Let Bull handle retries
      }

      this.logger.error('Failed to generate summary with Gemini', error);
      throw new Error('Gemini summary generation failed');
    }
  }
}

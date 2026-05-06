import { Controller, Get, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WorkshopsService } from './workshops.service';

@Controller('workshops')
export class WorkshopsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get(':id')
  async getWorkshop(@Param('id') id: string) {
    return this.workshopsService.getWorkshop(id);
  }

  @Post(':id/pdf')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.workshopsService.queueAiSummary(id, file.buffer);
  }
}

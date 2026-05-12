import { Controller, Post, Get, UseGuards, Logger } from '@nestjs/common';
import { SyncService } from './sync.service';

@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  @Post('students')
  async triggerSync() {
    this.logger.log('Manual sync triggered via API');
    this.syncService.syncStudentData();
    return { message: 'Sync triggered successfully' };
  }

  @Get('students')
  async getStudents() {
    return this.syncService.getSyncedStudents();
  }
}

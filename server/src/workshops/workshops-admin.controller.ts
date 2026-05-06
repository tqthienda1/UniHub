import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Header,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { WorkshopsService } from './workshops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role, RegistrationStatus } from '@prisma/client';

@Controller('admin/workshops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.INSTRUCTOR)
export class WorkshopsAdminController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get()
  async getWorkshops(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.workshopsService.findAllAdmin({
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status: status as any,
    });
  }

  @Post()

  async createWorkshop(@Body() data: any) {
    return this.workshopsService.createWorkshop(data);
  }

  @Patch(':id')
  async updateWorkshop(@Param('id') id: string, @Body() data: any) {
    return this.workshopsService.updateWorkshop(id, data);
  }

  @Patch(':id/publish')
  async publishWorkshop(@Param('id') id: string) {
    return this.workshopsService.publishWorkshop(id);
  }

  @Delete(':id')
  async cancelWorkshop(@Param('id') id: string) {
    return this.workshopsService.cancelWorkshop(id);
  }

  @Get(':id/registrations')
  async getRegistrations(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: RegistrationStatus,
  ) {
    return this.workshopsService.getRegistrations(
      id,
      page ? parseInt(page, 10) : undefined,
      limit ? parseInt(limit, 10) : undefined,
      status,
    );
  }

  @Get(':id/registrations/export')
  @Header('Content-Type', 'text/csv')
  @Header('Content-Disposition', 'attachment; filename=registrations.csv')
  async exportRegistrations(@Param('id') id: string) {
    const { items } = await this.workshopsService.getRegistrations(id, 1, 1000);

    const header =
      'registrationId,studentName,studentEmail,mssv,status,createdAt\n';
    const rows = items
      .map(
        (reg) =>
          `${reg.id},"${reg.user.fullName}",${reg.user.email},${reg.user.mssv || ''},${reg.status},${reg.createdAt.toISOString()}`,
      )
      .join('\n');

    return header + rows;
  }

  @Post(':id/checkin')
  async checkIn(@Param('id') id: string, @Body('qrToken') qrToken: string) {
    return this.workshopsService.checkIn(id, qrToken);
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


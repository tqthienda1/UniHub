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

@Controller('staff-portal/workshops')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkshopsAdminController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get('active')
  @Roles(Role.ADMIN, Role.CHECKIN_STAFF)
  async getActiveWorkshops() {
    return this.workshopsService.getActiveWorkshopsForStaff();
  }

  @Get(':id/registrations/search')
  @Roles(Role.ADMIN, Role.CHECKIN_STAFF)
  async searchRegistrations(
    @Param('id') id: string,
    @Query('keyword') keyword?: string,
  ) {
    return this.workshopsService.searchRegistrations(id, keyword);
  }

  @Get()
  @Roles(Role.ADMIN, Role.CHECKIN_STAFF)
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
  @Roles(Role.ADMIN)
  async createWorkshop(@Body() data: any) {
    return this.workshopsService.createWorkshop(data);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  async updateWorkshop(@Param('id') id: string, @Body() data: any) {
    return this.workshopsService.updateWorkshop(id, data);
  }

  @Patch(':id/publish')
  @Roles(Role.ADMIN)
  async publishWorkshop(@Param('id') id: string) {
    return this.workshopsService.publishWorkshop(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  async cancelWorkshop(@Param('id') id: string) {
    return this.workshopsService.cancelWorkshop(id);
  }

  @Get(':id/registrations')
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN)
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
  @Roles(Role.ADMIN, Role.CHECKIN_STAFF)
  async checkIn(@Param('id') id: string, @Body('qrToken') qrToken: string) {
    return this.workshopsService.checkIn(id, qrToken);
  }

  @Post(':id/pdf')
  @Roles(Role.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  async uploadPdf(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.workshopsService.queueAiSummary(id, file.buffer);
  }

  @Patch('registrations/:id/status')
  @Roles(Role.ADMIN, Role.CHECKIN_STAFF)
  async updateRegistrationStatus(
    @Param('id') id: string,
    @Body('status') status: RegistrationStatus,
  ) {
    return this.workshopsService.updateRegistrationStatus(id, status);
  }
}


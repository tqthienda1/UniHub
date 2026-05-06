import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { User } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('registrations')
@UseGuards(JwtAuthGuard)
export class RegistrationsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get('me')
  async getMyRegistrations(@Req() req: AuthenticatedRequest) {
    return this.workshopsService.getUserRegistrations(req.user.id);
  }

  @Post(':workshopId')

  async register(@Param('workshopId') workshopId: string, @Req() req: AuthenticatedRequest) {
    console.log(`POST /registrations/${workshopId} from user ${req.user.id}`);
    return this.workshopsService.register(workshopId, req.user.id);
  }


  @Get(':workshopId')
  async getMyRegistration(
    @Param('workshopId') workshopId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workshopsService.getMyRegistration(workshopId, req.user.id);
  }

  @Post(':regId/cancel')
  async cancelRegistration(
    @Param('regId') regId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    console.log(`POST /registrations/${regId}/cancel from user ${req.user.id}`);
    return this.workshopsService.cancelRegistration(regId, req.user.id);
  }

}

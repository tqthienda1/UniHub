import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Req,
  Headers,
  Query,
} from '@nestjs/common';
import { WorkshopsService } from './workshops.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Request } from 'express';
import { User } from '@prisma/client';

interface AuthenticatedRequest extends Request {
  user: User;
}

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly workshopsService: WorkshopsService) {}

  @Get('mock-payment/scan')
  async mockPaymentScan(
    @Query('workshopId') workshopId: string,
    @Query('userId') userId: string,
  ) {
    console.log(`MOCK QR SCAN: user ${userId} for workshop ${workshopId}`);
    return this.workshopsService.mockQrPayment(workshopId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyRegistrations(@Req() req: AuthenticatedRequest) {
    return this.workshopsService.getUserRegistrations(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':workshopId')
  async register(
    @Param('workshopId') workshopId: string,
    @Req() req: AuthenticatedRequest,
    @Headers('x-test-payment-timeout') testTimeoutHeader?: string,
  ) {
    const forceTimeout = testTimeoutHeader === 'true';
    console.log(
      `POST /registrations/${workshopId} from user ${req.user.id} (forceTimeout=${forceTimeout})`,
    );
    return this.workshopsService.register(
      workshopId,
      req.user.id,
      forceTimeout,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':workshopId')
  async getMyRegistration(
    @Param('workshopId') workshopId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workshopsService.getMyRegistration(workshopId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':regId/cancel')
  async cancelRegistration(
    @Param('regId') regId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    console.log(`POST /registrations/${regId}/cancel from user ${req.user.id}`);
    return this.workshopsService.cancelRegistration(regId, req.user.id);
  }
}

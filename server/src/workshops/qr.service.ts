import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { WorkshopRegistration } from '@prisma/client';

@Injectable()
export class QrService {
  private readonly secret =
    process.env.QR_JWT_SECRET || 'fallback-secret-for-qr';

  generate(registration: WorkshopRegistration): string {
    const payload = {
      registrationId: registration.id,
      workshopId: registration.workshopId,
      studentId: registration.userId,
    };

    return jwt.sign(payload, this.secret, { expiresIn: '24h' });
  }

  verify(token: string): any {
    try {
      return jwt.verify(token, this.secret);
    } catch {
      return null;
    }
  }
}

import { Injectable, Logger, OnModuleInit, ConflictException, BadRequestException, NotFoundException, HttpException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { WorkshopsRepository } from './workshops.repository';
import { RegistrationStatus, WorkshopStatus, Prisma } from '@prisma/client';

import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkshopsGateway } from './workshops.gateway';
import { QrService } from './qr.service';
import { NotificationsService } from '../notifications/notifications.service';

interface QrPayload {
  registrationId: string;
  workshopId: string;
  studentId: string;
}

@Injectable()
export class WorkshopsService implements OnModuleInit {
  private readonly logger = new Logger(WorkshopsService.name);

  constructor(
    @InjectQueue('ai-summary-queue') private readonly aiSummaryQueue: Queue,
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly repository: WorkshopsRepository,
    private readonly qrService: QrService,
    private readonly gateway: WorkshopsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleSeatReclamation() {
    this.logger.log('Running seat reclamation cron job...');
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() - 10);

    const staleRegistrations = await this.prisma.workshopRegistration.findMany({
      where: {
        status: RegistrationStatus.PENDING,
        createdAt: { lt: expirationTime },
      },
    });

    if (staleRegistrations.length === 0) {
      this.logger.log('No stale registrations found.');
      return;
    }

    for (const reg of staleRegistrations) {
      await this.prisma.$transaction(async (tx) => {
        await tx.workshopRegistration.update({
          where: { id: reg.id },
          data: { status: RegistrationStatus.EXPIRED },
        });

        await tx.workshop.update({
          where: { id: reg.workshopId },
          data: {
            availableSeats: { increment: 1 },
          },
        });
      });

      await this.redis.incr(`workshop:${reg.workshopId}:seats`);
      const newSeats = await this.getAvailableSeats(reg.workshopId);
      this.gateway.emitSeatCountUpdate(reg.workshopId, newSeats);
    }

    this.logger.log(
      `Expired ${staleRegistrations.length} registrations and reclaimed seats.`,
    );
  }

  async onModuleInit() {
    this.logger.log('Seeding Redis seat counters from database...');
    const workshops = await this.prisma.workshop.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, availableSeats: true },
    });

    for (const workshop of workshops) {
      await this.redis.set(
        `workshop:${workshop.id}:seats`,
        workshop.availableSeats.toString(),
      );
    }
    this.logger.log(`Seeded ${workshops.length} workshops into Redis.`);
  }

  async getAvailableSeats(workshopId: string): Promise<number> {
    const cachedSeats = await this.redis.get(`workshop:${workshopId}:seats`);
    if (cachedSeats !== null) {
      return parseInt(cachedSeats, 10);
    }

    const workshop = await this.repository.findOne(workshopId);
    if (!workshop) return 0;

    // Re-seed Redis if missing
    await this.redis.set(
      `workshop:${workshopId}:seats`,
      workshop.availableSeats.toString(),
    );
    return workshop.availableSeats;
  }

  async findAll(params: {
    page?: number;
    limit?: number;
    keyword?: string;
    category?: string;
    availableOnly?: boolean;
    startDate?: Date;
    endDate?: Date;
  }) {
    const {
      page = 1,
      limit = 20,
      keyword,
      category,
      availableOnly,
      startDate,
      endDate,
    } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkshopWhereInput = {
      status: 'PUBLISHED',
    };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (availableOnly) {
      where.availableSeats = { gt: 0 };
    }

    if (startDate || endDate) {
      const startTime: Prisma.DateTimeFilter = {};
      if (startDate) startTime.gte = startDate;
      if (endDate) startTime.lte = endDate;
      where.startTime = startTime;
    }

    const [total, items] = await Promise.all([
      this.prisma.workshop.count({ where }),
      this.repository.findAll({
        skip,
        take: limit,
        where,
        orderBy: { startTime: 'asc' },
      }),
    ]);

    // Update real-time seat counts from Redis
    const itemsWithSeats = await Promise.all(
      items.map(async (item) => ({
        ...item,
        availableSeats: await this.getAvailableSeats(item.id),
      })),
    );

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items: itemsWithSeats,
    };
  }

  async getWorkshop(id: string) {
    const workshop = await this.repository.findOne(id);
    if (!workshop) return null;

    return {
      ...workshop,
      availableSeats: await this.getAvailableSeats(id),
    };
  }

  async register(workshopId: string, userId: string) {
    this.logger.log(`Student ${userId} attempting to register for workshop ${workshopId}`);
    
    // 0. Verify student identity against authoritative Source of Truth
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.role === 'STUDENT') {
      if (!user.mssv) {
        throw new BadRequestException('Your account is missing MSSV. Please update your profile.');
      }

      const identity = await this.prisma.studentIdentity.findUnique({
        where: { mssv: user.mssv }
      });

      if (!identity) {
        throw new BadRequestException(`Your Student ID (${user.mssv}) is not recognized in the university's official records. Only verified students can register.`);
      }
    }

    const lockKey = `workshop:${workshopId}:lock`;

    const lockTtl = 5; // 5 seconds

    // Acquire distributed lock
    const acquired = await this.redis.setnx(lockKey, 'locked', lockTtl);
    if (!acquired) {
      throw new Error('Could not acquire lock, please try again');
    }

    try {
      // 1. Check if already registered
      const existing = await this.repository.findRegistration(
        userId,
        workshopId,
      );
      if (
        existing &&
        existing.status !== RegistrationStatus.CANCELLED &&
        existing.status !== RegistrationStatus.EXPIRED
      ) {
        throw new Error('Already registered for this workshop');
      }

      // 2. Check seats in Redis
      const availableSeats = await this.getAvailableSeats(workshopId);
      if (availableSeats <= 0) {
        throw new Error('No seats available');
      }

      // 3. Create registration and decrement seats
      const registration = await this.prisma.$transaction(async (tx) => {
        const reg = await tx.workshopRegistration.upsert({
          where: {
            userId_workshopId: { userId, workshopId },
          },
          update: {
            status: RegistrationStatus.CONFIRMED,
          },
          create: {
            userId,
            workshopId,
            status: RegistrationStatus.CONFIRMED,
          },
        });

        await tx.workshop.update({
          where: { id: workshopId },
          data: {
            availableSeats: { decrement: 1 },
          },
        });

        return reg;
      });

      // 4. Update Redis
      await this.redis.decr(`workshop:${workshopId}:seats`);
      const newSeats = await this.getAvailableSeats(workshopId);
      this.gateway.emitSeatCountUpdate(workshopId, newSeats);

      // 5. Trigger notification
      try {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        const workshop = await this.prisma.workshop.findUnique({ where: { id: workshopId } });
        if (user && workshop) {
          await this.notificationsService.send(user.email, {
            subject: `Registration Confirmed: ${workshop.title}`,
            body: `You have successfully registered for the workshop "${workshop.title}" at ${workshop.room}. Time: ${workshop.startTime}.`,
          });
        }
      } catch (err) {
        this.logger.error(`Failed to trigger notification: ${err.message}`);
      }

      return registration;
    } finally {
      // Release lock
      await this.redis.del(lockKey);
    }
  }

  async cancelRegistration(registrationId: string, userId: string) {
    this.logger.log(`Student ${userId} attempting to cancel registration ${registrationId}`);
    const registration = await this.prisma.workshopRegistration.findUnique({
      where: { id: registrationId },
      include: { workshop: true },
    });


    if (!registration || registration.userId !== userId) {
      throw new Error('Registration not found');
    }

    if (
      registration.status !== RegistrationStatus.CONFIRMED &&
      registration.status !== RegistrationStatus.PENDING
    ) {
      throw new Error('Registration cannot be cancelled in current status');
    }

    if (registration.workshop.startTime < new Date()) {
      throw new Error('Workshop has already started');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.workshopRegistration.update({
        where: { id: registrationId },
        data: { status: RegistrationStatus.CANCELLED },
      });

      await tx.workshop.update({
        where: { id: registration.workshopId },
        data: {
          availableSeats: { increment: 1 },
        },
      });
    });

    // Update Redis
    await this.redis.incr(`workshop:${registration.workshopId}:seats`);
    const newSeats = await this.getAvailableSeats(registration.workshopId);
    this.gateway.emitSeatCountUpdate(registration.workshopId, newSeats);

    return { message: 'Registration cancelled successfully' };
  }

  async getUserRegistrations(userId: string) {
    const registrations = await this.prisma.workshopRegistration.findMany({
      where: { userId },
      include: {
        workshop: {
          select: {
            id: true,
            title: true,
            startTime: true,
            room: true,
            category: true,
            aiSummary: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Add QR token for active registrations
    return registrations.map((reg) => ({
      ...reg,
      qrToken:
        reg.status === RegistrationStatus.CONFIRMED
          ? this.qrService.generate(reg)
          : null,

    }));
  }

  async getMyRegistration(workshopId: string, userId: string) {
    const registration = await this.repository.findRegistration(

      userId,
      workshopId,
    );
    if (!registration || registration.status !== RegistrationStatus.CONFIRMED) {
      return registration;
    }

    const qrToken = this.qrService.generate(registration);
    return {
      ...registration,
      qrToken,
    };
  }

  async checkIn(workshopId: string, qrToken: string) {
    try {
      const payload = this.qrService.verify(qrToken) as QrPayload | null;
      if (!payload || payload.workshopId !== workshopId) {
        throw new BadRequestException('Invalid or expired QR code');
      }

      const registrationId = payload.registrationId;
      const registration = await this.prisma.workshopRegistration.findUnique({
        where: { id: registrationId },
      });

      if (!registration) {
        throw new NotFoundException('Registration not found');
      }

      if (registration.status === RegistrationStatus.CHECKED_IN) {
        throw new ConflictException('Student already checked in');
      }

      if (registration.status !== RegistrationStatus.CONFIRMED) {
        throw new BadRequestException('Registration is not in confirmed state');
      }

      const checkin = await this.prisma.$transaction(async (tx) => {
        await tx.workshopRegistration.update({
          where: { id: registrationId },
          data: { status: RegistrationStatus.CHECKED_IN },
        });

        return tx.workshopCheckIn.create({
          data: {
            registrationId,
            workshopId,
            scannedAt: new Date(),
          },
          include: {
            registration: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    mssv: true,
                  },
                },
              },
            },
          },
        });
      });
      await this.notifyCheckInUpdate(workshopId);

      return {
        message: 'Check-in successful',
        student: {
          id: checkin.registration.user.id,
          fullName: checkin.registration.user.fullName,
          email: checkin.registration.user.email,
        },
        scannedAt: checkin.scannedAt,
      };
    } catch (err) {
      if (err instanceof HttpException) throw err;
      throw new BadRequestException('Invalid or expired QR code');
    }
  }

  private async notifyCheckInUpdate(workshopId: string) {
    const [registeredCount, checkedInCount] = await Promise.all([
      this.prisma.workshopRegistration.count({
        where: {
          workshopId,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN],
          },
        },
      }),
      this.prisma.workshopCheckIn.count({
        where: { workshopId },
      }),
    ]);

    this.gateway.emitCheckInUpdate(workshopId, {
      registeredCount,
      checkedInCount,
    });
  }

  async getActiveWorkshopsForStaff() {
    const windowStart = new Date();
    windowStart.setDate(windowStart.getDate() - 2); // include workshops from 2 days ago
    windowStart.setHours(0, 0, 0, 0);

    const windowEnd = new Date();
    windowEnd.setDate(windowEnd.getDate() + 7); // include upcoming workshops up to 7 days ahead
    windowEnd.setHours(23, 59, 59, 999);

    const workshops = await this.prisma.workshop.findMany({
      where: {
        status: WorkshopStatus.PUBLISHED,
        startTime: {
          gte: windowStart,
          lte: windowEnd,
        },
      },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: {
                  in: [
                    RegistrationStatus.CONFIRMED,
                    RegistrationStatus.CHECKED_IN,
                  ],
                },
              },
            },
            checkins: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    return workshops.map((w) => ({
      id: w.id,
      title: w.title,
      startTime: w.startTime,
      room: w.room,
      location: w.location,
      capacity: w.capacity,
      registeredCount: w._count.registrations,
      checkedInCount: w._count.checkins,
    }));
  }

  async searchRegistrations(workshopId: string, keyword?: string) {
    const where: Prisma.WorkshopRegistrationWhereInput = {
      workshopId,
      status: {
        in: [RegistrationStatus.CONFIRMED, RegistrationStatus.CHECKED_IN],
      },
    };

    if (keyword) {
      where.user = {
        OR: [
          { fullName: { contains: keyword, mode: 'insensitive' } },
          { email: { contains: keyword, mode: 'insensitive' } },
          { mssv: { contains: keyword, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.workshopRegistration.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            mssv: true,
          },
        },
      },
      orderBy: { user: { fullName: 'asc' } },
    });
  }

  async createWorkshop(data: Prisma.WorkshopCreateInput) {
    return this.repository.create({
      ...data,
      availableSeats: data.capacity,
      status: WorkshopStatus.DRAFT,
    });
  }

  async updateWorkshop(id: string, data: Prisma.WorkshopUpdateInput) {
    if (data.capacity !== undefined) {
      const capacityValue =
        typeof data.capacity === 'number'
          ? data.capacity
          : (data.capacity as { set: number }).set;

      const activeRegsCount = await this.prisma.workshopRegistration.count({
        where: {
          workshopId: id,
          status: {
            in: [
              RegistrationStatus.CONFIRMED,
              RegistrationStatus.PENDING,
              RegistrationStatus.CHECKED_IN,
            ],
          },
        },
      });

      if (capacityValue < activeRegsCount) {
        throw new Error(
          'Capacity cannot be less than current registration count',
        );
      }

      // Update available seats if capacity changes
      const workshop = await this.repository.findOne(id);
      if (!workshop) {
        throw new Error('Workshop not found');
      }
      const diff = capacityValue - workshop.capacity;
      data.availableSeats = workshop.availableSeats + diff;
    }

    const updated = await this.repository.update(id, data);

    // Sync Redis
    await this.redis.set(
      `workshop:${id}:seats`,
      updated.availableSeats.toString(),
    );
    this.gateway.emitSeatCountUpdate(id, updated.availableSeats);

    return updated;
  }

  async publishWorkshop(id: string) {
    const workshop = await this.prisma.workshop.findUnique({
      where: { id },
      include: { _count: { select: { registrations: true } } },
    });

    if (!workshop) {
      throw new Error('Workshop not found');
    }

    const data: Prisma.WorkshopUpdateInput = {
      status: WorkshopStatus.PUBLISHED,
    };

    // If seats were never initialized (0) and no registrations exist, set to capacity
    if (workshop.availableSeats === 0 && workshop._count.registrations === 0) {
      data.availableSeats = workshop.capacity;
    }

    const updated = await this.repository.update(id, data);

    // Seed Redis
    await this.redis.set(
      `workshop:${id}:seats`,
      updated.availableSeats.toString(),
    );
    this.gateway.emitSeatCountUpdate(id, updated.availableSeats);


    return updated;
  }

  async cancelWorkshop(id: string) {

    return this.prisma.$transaction(async (tx) => {
      // 1. Cancel workshop
      const workshop = await tx.workshop.update({
        where: { id },
        data: { status: WorkshopStatus.CANCELLED, availableSeats: 0 },
      });

      // 2. Cancel all confirmed registrations
      await tx.workshopRegistration.updateMany({
        where: {
          workshopId: id,
          status: {
            in: [RegistrationStatus.CONFIRMED, RegistrationStatus.PENDING],
          },
        },
        data: { status: RegistrationStatus.CANCELLED },
      });

      // 3. Update Redis
      await this.redis.set(`workshop:${id}:seats`, '0');
      this.gateway.emitSeatCountUpdate(id, 0);

      return workshop;
    });
  }

  async getRegistrations(
    workshopId: string,
    page = 1,
    limit = 20,
    status?: RegistrationStatus,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.WorkshopRegistrationWhereInput = { workshopId };
    if (status) where.status = status;

    const [total, items] = await Promise.all([
      this.prisma.workshopRegistration.count({ where }),
      this.prisma.workshopRegistration.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { fullName: true, email: true, mssv: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async updateRegistrationStatus(id: string, status: RegistrationStatus) {
    const registration = await this.prisma.workshopRegistration.findUnique({
      where: { id },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const reg = await tx.workshopRegistration.update({
        where: { id },
        data: { status },
      });

      if (status === RegistrationStatus.CHECKED_IN) {
        await tx.workshopCheckIn.upsert({
          where: { registrationId: id },
          update: { scannedAt: new Date() },
          create: {
            registrationId: id,
            workshopId: reg.workshopId,
            scannedAt: new Date(),
          },
        });
      }

      return reg;
    });

    // Notify via WebSockets
    const newSeats = await this.getAvailableSeats(registration.workshopId);
    this.gateway.emitSeatCountUpdate(registration.workshopId, newSeats);
    await this.notifyCheckInUpdate(registration.workshopId);

    return updated;
  }

  async findAllAdmin(params: {

    page?: number;
    limit?: number;
    status?: WorkshopStatus;
  }) {
    const { page = 1, limit = 10, status } = params;
    const skip = (page - 1) * limit;

    const where: Prisma.WorkshopWhereInput = {};
    if (status) {
      where.status = status;
    }

    const [total, items] = await Promise.all([
      this.prisma.workshop.count({ where }),
      this.prisma.workshop.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }


  async queueAiSummary(workshopId: string, pdfBuffer: Buffer) {
    this.logger.log(`Queueing AI summary job for workshop: ${workshopId}`);

    try {
      // Adding a timeout so it doesn't hang forever if Redis is down
      const jobPromise = this.aiSummaryQueue.add('generate-summary', {
        workshopId,
        pdfBuffer,
      }) as Promise<{ id: string }>;

      const job = (await Promise.race([
        jobPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Redis timeout')), 3000),
        ),
      ])) as { id: string } | null;

      return {
        jobId: job?.id,
        message: 'PDF uploaded and summary job queued.',
      };
    } catch (error) {
      this.logger.error('Failed to queue job', error);
      // Fallback or error response
      return {
        jobId: null,
        message: 'Failed to queue job. Check if Redis is running.',
      };
    }
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationStatus, Prisma } from '@prisma/client';

@Injectable()
export class WorkshopsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.WorkshopWhereUniqueInput;
    where?: Prisma.WorkshopWhereInput;
    orderBy?: Prisma.WorkshopOrderByWithRelationInput;
  }) {
    return this.prisma.workshop.findMany(params);
  }

  async findOne(id: string) {
    return this.prisma.workshop.findUnique({
      where: { id },
      include: {
        registrations: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });
  }

  async create(data: Prisma.WorkshopCreateInput) {
    return this.prisma.workshop.create({ data });
  }

  async update(id: string, data: Prisma.WorkshopUpdateInput) {
    return this.prisma.workshop.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return this.prisma.workshop.delete({
      where: { id },
    });
  }

  async findRegistration(userId: string, workshopId: string) {
    return this.prisma.workshopRegistration.findUnique({
      where: {
        userId_workshopId: {
          userId,
          workshopId,
        },
      },
    });
  }

  async createRegistration(
    data: Prisma.WorkshopRegistrationUncheckedCreateInput,
  ) {
    return this.prisma.workshopRegistration.create({
      data,
    });
  }

  async updateRegistrationStatus(id: string, status: RegistrationStatus) {
    return this.prisma.workshopRegistration.update({
      where: { id },
      data: { status },
    });
  }

  async createCheckIn(data: Prisma.WorkshopCheckInUncheckedCreateInput) {
    return this.prisma.workshopCheckIn.create({
      data,
    });
  }
}

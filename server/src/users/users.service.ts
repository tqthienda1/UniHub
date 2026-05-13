import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: any): Promise<User> {
    // If user is a student, verify MSSV against StudentIdentity (Source of Truth)
    if (data.role === 'STUDENT') {
      if (!data.mssv) {
        throw new Error('MSSV is required for student registration');
      }

      const identity = await this.prisma.studentIdentity.findUnique({
        where: { mssv: data.mssv },
      });

      if (!identity) {
        throw new Error(
          `Student ID ${data.mssv} is not found in the official university records. Please contact the administrator.`,
        );
      }

      // Optionally sync email/name from identity if not provided
      data.fullName = data.fullName || identity.fullName;
      data.email = data.email || identity.email;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }
}

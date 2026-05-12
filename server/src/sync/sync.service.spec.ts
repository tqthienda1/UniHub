import { Test, TestingModule } from '@nestjs/testing';
import { SyncService } from './sync.service';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

describe('SyncService', () => {
  let service: SyncService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SyncService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<SyncService>(SyncService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // More tests can be added here to simulate file scenarios
});

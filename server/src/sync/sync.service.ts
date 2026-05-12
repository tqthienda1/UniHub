import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private isSyncing = false;

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 2 * * *')
  async syncStudentData() {
    if (this.isSyncing) {
      this.logger.warn('Sync is already in progress. Skipping.');
      return;
    }

    this.isSyncing = true;
    const csvPath = path.resolve(process.env.STUDENT_DATA_CSV_PATH || 'data/students.csv');

    try {
      if (!fs.existsSync(csvPath)) {
        const msg = `CSV file not found at ${csvPath}. Skipping sync.`;
        this.logger.warn(msg);
        await this.sendAlert(msg);
        return;
      }

      const stats = fs.statSync(csvPath);
      if (stats.size === 0) {
        const msg = `CSV file at ${csvPath} is empty. Skipping sync.`;
        this.logger.warn(msg);
        await this.sendAlert(msg);
        return;
      }

      // Validate headers
      const firstLine = await this.readFirstLine(csvPath);
      const requiredHeaders = ['mssv', 'email', 'fullName'];
      const headers = firstLine.split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h));

      if (missingHeaders.length > 0) {
        const msg = `CSV file is missing required headers: ${missingHeaders.join(', ')}`;
        this.logger.error(msg);
        await this.sendAlert(msg);
        await this.moveFile(csvPath, process.env.STUDENT_DATA_FAILED_PATH || 'data/failed');
        return;
      }

      this.logger.log(`Starting student data sync from ${csvPath}...`);

      const parser = fs.createReadStream(csvPath).pipe(
        parse({
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }),
      );

      let count = 0;
      let createdCount = 0;
      let updatedCount = 0;
      let errorCount = 0;
      const batchSize = 100;
      let batch: any[] = [];

      for await (const record of parser) {
        count++;
        const { mssv, email, fullName } = record;

        if (!mssv || !email || !fullName) {
          this.logger.error(`Row ${count}: Missing required fields. MSSV: ${mssv}, Email: ${email}, Name: ${fullName}`);
          errorCount++;
          continue;
        }

        if (!email.includes('@')) {
          this.logger.error(`Row ${count}: Invalid email format: ${email}`);
          errorCount++;
          continue;
        }

        batch.push({ mssv, email, fullName });

        if (batch.length >= batchSize) {
          const { created, updated, errors } = await this.processBatch(batch);
          createdCount += created;
          updatedCount += updated;
          errorCount += errors;
          batch = [];
        }
      }

      if (batch.length > 0) {
        const { created, updated, errors } = await this.processBatch(batch);
        createdCount += created;
        updatedCount += updated;
        errorCount += errors;
      }

      this.logger.log(
        `Sync complete. Total processed: ${count}, Created: ${createdCount}, Updated: ${updatedCount}, Errors: ${errorCount}`,
      );
      await this.moveFile(csvPath, process.env.STUDENT_DATA_ARCHIVE_PATH || 'data/archive');
    } catch (error) {
      this.logger.error(`Unexpected error during sync: ${error.message}`);
      await this.sendAlert(`Fatal error during student data sync: ${error.message}`);
      if (fs.existsSync(csvPath)) {
        await this.moveFile(csvPath, process.env.STUDENT_DATA_FAILED_PATH || 'data/failed');
      }
    } finally {
      this.isSyncing = false;
    }
  }

  async getSyncedStudents() {
    return this.prisma.studentIdentity.findMany({
      orderBy: { mssv: 'asc' },
    });
  }

  private async sendAlert(message: string) {
    this.logger.warn(`ALERT: ${message}`);
    // TODO: Integrate with Slack/Telegram/Email
  }

  private async moveFile(sourcePath: string, destDir: string) {
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    const fileName = path.basename(sourcePath);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const destPath = path.join(destDir, `${timestamp}-${fileName}`);

    try {
      fs.renameSync(sourcePath, destPath);
      this.logger.log(`Moved file ${fileName} to ${destDir}`);
    } catch (error) {
      this.logger.error(`Failed to move file ${fileName} to ${destDir}: ${error.message}`);
    }
  }

  private async processBatch(batch: any[]) {
    let created = 0;
    let updated = 0;
    let errors = 0;

    const mssvs = batch.map((r) => r.mssv);
    const existingIdentities = await this.prisma.studentIdentity.findMany({
      where: { mssv: { in: mssvs } },
      select: { mssv: true },
    });

    const existingMssvs = new Set(existingIdentities.map((u) => u.mssv));

    const toCreate = batch
      .filter((r) => !existingMssvs.has(r.mssv))
      .map((r) => ({
        mssv: r.mssv,
        email: r.email,
        fullName: r.fullName,
      }));

    const toUpdate = batch.filter((r) => existingMssvs.has(r.mssv));

    if (toCreate.length > 0) {
      try {
        const result = await this.prisma.studentIdentity.createMany({
          data: toCreate,
          skipDuplicates: true,
        });
        created += result.count;
      } catch (error) {
        this.logger.error(`Batch insert error: ${error.message}`);
        errors += toCreate.length;
      }
    }

    for (const record of toUpdate) {
      try {
        await this.prisma.studentIdentity.update({
          where: { mssv: record.mssv },
          data: {
            email: record.email,
            fullName: record.fullName,
          },
        });
        updated++;
      } catch (error) {
        this.logger.error(`Error updating record ${record.mssv}: ${error.message}`);
        errors++;
      }
    }

    return { created, updated, errors };
  }

  private async readFirstLine(filePath: string): Promise<string> {
    const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
    let firstLine = '';
    for await (const chunk of stream) {
      firstLine += chunk;
      const eolIndex = firstLine.indexOf('\n');
      if (eolIndex !== -1) {
        firstLine = firstLine.slice(0, eolIndex);
        stream.destroy();
        break;
      }
    }
    return firstLine.trim();
  }
}

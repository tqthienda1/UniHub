## 1. Database Schema Enhancements
- [x] 1.1 Define the `StudentIdentity` model in `schema.prisma` to store authoritative student records as the source of truth.

## 2. Setup and Dependencies

- [x] 2.1 Install required dependencies (`csv-parse`, `@nestjs/schedule`).
- [x] 2.2 Create the `SyncModule` and `SyncService` in the `server/src/workers` or a relevant directory.
- [x] 2.3 Add configuration for the CSV file path in the environment configuration.

## 3. CSV Processing Logic

- [x] 3.1 Implement the `StudentDataSyncService` with a stream-based CSV parser.
- [x] 3.2 Add data validation for CSV rows (ensuring `mssv`, `email`, and `fullName` are present and valid).
- [x] 3.3 Implement the batched upsert logic using Prisma to handle new and existing students in `StudentIdentity` table.
- [x] 3.4 Pre-processing: Check for file existence, verify file size, and validate the header row structure before opening the read stream.
- [x] 3.5 Post-processing: Move the processed CSV file to an /archive folder (on success) or /failed folder (on structural failure) to prevent duplicate processing the following day.

## 4. Background Job Scheduling

- [x] 4.1 Configure the Cron job using `@Cron` to trigger the sync nightly at 02:00 AM.
- [x] 4.2 Implement a mechanism to trigger the sync manually for testing and emergency updates.
- [x] 4.3 Concurrency Control: Implement a Mutex Lock/Flag mechanism to prevent manual triggers while the scheduled cron job is actively running (and vice versa).
- [x] 4.4 Implement an Admin Dashboard tab to monitor and manually trigger the student data sync.

## 5. Logging and Auditing

- [x] 5.1 Implement logging for the start and completion of each sync job.
- [x] 5.2 Track and log the number of records processed, created, updated, and failed.
- [x] 5.3 Ensure that errors on individual records are caught and logged without aborting the entire process.
- [x] 5.4 Alerting: Integrate automated notifications (Slack/Telegram/Email) to alert the team if the job aborts due to a fatal error or if the expected export file is missing.

## 6. Testing and Verification

- [x] 6.1 Prepare a test CSV file containing new students, existing students, and malformed records.
- [x] 6.2 Run the sync job and verify that the database reflects the changes correctly.
- [x] 6.3 Confirm that all logs accurately report the statistics and any skipped records.
- [x] 6.4 Edge-case Testing: Simulate scenarios where the CSV file is missing headers, completely empty, or absent to verify file-level error handling and alert generation.

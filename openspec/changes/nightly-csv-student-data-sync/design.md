## Context

UniHub Workshop needs to synchronize student data from the university's Legacy Student Information System (SIS). The SIS provides a nightly CSV export containing updated student records. Our system uses NestJS for the backend and Prisma for database access (PostgreSQL). We need to implement a worker process that ingests this CSV and updates the `User` table to ensure student information is current.

## Goals / Non-Goals

**Goals:**
- Automate the nightly ingestion of student CSV data.
- Accurately upsert records based on Student ID (`mssv`).
- Provide clear logs for success/failure auditing.
- Handle data validation errors gracefully.

**Non-Goals:**
- Bidirectional synchronization (data flows only from SIS to UniHub).
- Real-time updates (nightly sync is sufficient).
- Web-based UI for triggering or monitoring the sync (logs and CLI are sufficient).

## Decisions

- **Sync Trigger**: Use `@nestjs/schedule` to run the sync job at 02:00 AM daily.
- **CSV Processing**: Use the `csv-parse` library for efficient, stream-based parsing of the input file.
- **Database Upsert**: Since Prisma does not natively support a bulk `upsert` in one command for Postgres (only `createMany`), we will implement a batched approach:
  - Fetch existing `mssv` values in chunks.
  - Determine which records are new (insert) and which exist (update).
  - Execute updates in small batches to minimize database locks.
- **Storage Location**: The CSV file is assumed to be placed in a designated local directory or shared volume accessible by the worker container.

## Risks / Trade-offs

- **Risk: Memory Exhaustion** → [Mitigation] Use Node.js streams to process the CSV file row-by-row instead of loading the entire file into memory.
- **Risk: Database Lock Contention** → [Mitigation] Run the job during off-peak hours (02:00 AM) and use batching for updates.
- **Risk: Malformed CSV Data** → [Mitigation] Implement schema validation for each row and skip invalid records while logging the specific error and row number.

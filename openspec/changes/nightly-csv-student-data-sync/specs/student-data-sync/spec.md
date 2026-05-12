## ADDED Requirements

### Requirement: CSV File Ingestion
The system SHALL ingest student data from a CSV file provided by the Legacy SIS every night.

#### Scenario: Successful CSV processing
- **WHEN** the nightly sync job is triggered and a valid CSV file is present
- **THEN** the system parses the file and prepares the data for upserting into the database

#### Scenario: Missing CSV file
- **WHEN** the nightly sync job is triggered but no CSV file is found at the configured location
- **THEN** the system SHALL log a warning and exit gracefully

### Requirement: Student Data Upsert
The system SHALL upsert (create or update) user records in the database based on the CSV data, using the `mssv` (Student ID) as the unique identifier.

#### Scenario: New student record
- **WHEN** a record in the CSV has an `mssv` that does not exist in the database
- **THEN** the system SHALL create a new `User` record with `role: STUDENT` and the provided details (fullName, email)

#### Scenario: Existing student record update
- **WHEN** a record in the CSV has an `mssv` that already exists in the database
- **THEN** the system SHALL update the existing `User` record's `fullName` and `email` if they have changed

### Requirement: Sync Audit Logging
The system SHALL maintain a log of each sync operation to track progress and issues.

#### Scenario: Log sync statistics
- **WHEN** a sync job completes
- **THEN** the system SHALL log the total number of records processed, created, updated, and any errors encountered

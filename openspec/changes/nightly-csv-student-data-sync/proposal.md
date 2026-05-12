## Why

Automating the synchronization of student data from the Legacy Student Information System (SIS) ensures that UniHub Workshop has accurate and up-to-date student records. This reduces manual data entry, prevents inconsistencies in Student IDs (MSSV), and streamlines the registration process for university-wide workshops.

## What Changes

- **Background Sync Task**: A new scheduled worker (running nightly) to import student data from a CSV file provided by the Legacy SIS.
- **CSV Ingestion Logic**: Logic to parse CSV files, validate data formats, and handle errors during processing.
- **User Upsert Operation**: An upsert mechanism in the database to either create new student records or update existing ones based on their unique Student ID (MSSV).
- **Audit Logging**: Basic logging to track the status of each sync operation, including the number of records processed, updated, and failed.

## Capabilities

### New Capabilities
- `student-data-sync`: Automated nightly ingestion of student records (Name, Email, MSSV) from Legacy SIS CSV files into the UniHub database.

### Modified Capabilities
<!-- Leave empty as no existing requirements are changing -->

## Impact

- **Backend Workers**: A new background job will be added to the Node.js workers.
- **Database**: Frequent updates to the `User` table during the nightly sync.
- **Infrastructure**: Requirement for access to the Legacy SIS CSV export location (e.g., shared volume or SFTP).

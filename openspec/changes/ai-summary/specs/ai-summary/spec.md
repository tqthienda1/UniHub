## ADDED Requirements

### Requirement: Automatic PDF Summarization
The system must automatically generate a summary for any PDF uploaded to a workshop by an organizer.

#### Scenario: Successful PDF Upload and Summarization
- **WHEN** an organizer uploads a valid PDF file for a workshop.
- **THEN** a background job is queued for processing.
- **THEN** the text is extracted from the PDF.
- **THEN** a summary is generated using an AI model.
- **THEN** the `ai_summary` field for the workshop is updated in the database.

#### Scenario: PDF Upload with Invalid File Type
- **WHEN** an organizer tries to upload a non-PDF file.
- **THEN** the system returns an error and does not queue a job.

#### Scenario: AI Service Failure
- **WHEN** the AI model generation fails (e.g., API timeout).
- **THEN** the background job should retry based on the queue policy.
- **THEN** if all retries fail, a log entry is created, and the `ai_summary` remains unchanged or shows a "Failed" status.

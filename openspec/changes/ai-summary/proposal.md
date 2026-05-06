## Why

The organizers need a quick way to generate a summary for workshop introduction PDFs. Manually summarizing content is time-consuming. Automating this process using AI improves the organizer's efficiency and provides students with immediate, concise information about the workshop.

## What Changes

This change introduces an automated AI-driven summarization pipeline.
- Organizers can upload a PDF for a workshop.
- The system extracts text from the PDF.
- An AI model generates a summary of the extracted text.
- The summary is stored in the database and displayed in the workshop details.
- The processing happens asynchronously in the background to ensure a responsive UI.

## Capabilities

### New Capabilities
- `ai-summary`: Automates text extraction and summarization for workshop introduction PDFs using AI.

### Modified Capabilities
- `workshop-management`: Updated to support PDF uploads and display AI-generated summaries.

## Impact

- **Backend**: New queue (`ai-summary-queue`), new worker process, integration with `pdf-parse` and OpenAI API.
- **Database**: `ai_summary` field in the `workshops` table.
- **Frontend**: PDF upload UI in Admin app, summary display in Student and Admin apps.
- **Dependencies**: `pdf-parse`, `openai`, `@nestjs/bull`.

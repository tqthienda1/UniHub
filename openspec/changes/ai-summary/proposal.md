## Why

<!-- Explain the motivation for this change. What problem does this solve? Why now? -->
Currently, students need to read through workshop introduction PDFs to understand the content, which can be time-consuming. Organizers also have to manually provide summaries or descriptions. By introducing AI-powered summaries, we can help students quickly grasp the core value of each workshop and automate a manual task for the organizers, improving the overall efficiency of the UniHub platform.

## What Changes

<!-- Describe what will change. Be specific about new capabilities, modifications, or removals. -->
- **AI Processor Worker**: A new background worker (proposed in Python with `pdfplumber`) that consumes messages from RabbitMQ, extracts text from uploaded PDFs, and calls an LLM (OpenAI or local) to generate a concise summary.
- **Database Schema**: Add an `ai_summary` field to the `workshops` table to store the generated text.
- **Admin API**: New endpoint `POST /workshops/:id/pdf` to handle PDF uploads and trigger the AI processing flow.
- **Messaging**: Introduce a new RabbitMQ exchange/queue `ai.pdf.process` to decouple PDF processing from the main API request.
- **Frontend**:
    - **Admin Web**: Add a file upload component for workshop PDFs.
    - **Student Web**: Display the `ai_summary` on the workshop details page.

## Capabilities

### New Capabilities
<!-- Capabilities being introduced. Replace <name> with kebab-case identifier (e.g., user-auth, data-export, api-rate-limiting). Each creates specs/<name>/spec.md -->
- `ai-summary`: Automatic extraction of text from workshop PDFs and generation of summaries using Large Language Models (LLMs) to enhance content discoverability for students.

### Modified Capabilities
<!-- Existing capabilities whose REQUIREMENTS are changing (not just implementation).
     Only list here if spec-level behavior changes. Each needs a delta spec file.
     Use existing spec names from openspec/specs/. Leave empty if no requirement changes. -->

## Impact

<!-- Affected code, APIs, dependencies, systems -->
- **Backend (NestJS)**: New controller and service for PDF management; integration with RabbitMQ.
- **Worker (Python)**: New service for PDF parsing and LLM integration.
- **Database (PostgreSQL)**: Schema migration for `workshops` table.
- **Frontend (Next.js)**: New UI components for upload and display.
- **Infrastructure**: Requires RabbitMQ and an LLM API provider (e.g., OpenAI).

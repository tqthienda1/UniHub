## Context

Currently, workshop descriptions are entered manually. This change automates the creation of summaries from uploaded PDF documents using AI. The system already uses NestJS, Redis (for Bull Queue), and PostgreSQL.

## Goals / Non-Goals

**Goals:**
- Implement a background worker to process PDF files.
- Extract text from PDFs using `pdf-parse`.
- Generate summaries using OpenAI's GPT models.
- Store summaries in the `workshops` table.
- Provide a UI for organizers to upload PDFs and view summaries.

**Non-Goals:**
- Real-time processing of PDFs (will be asynchronous).
- Support for formats other than PDF (e.g., DOCX).
- UI for editing generated summaries (summaries are read-only for now).

## Decisions

- **Queue System**: Use `@nestjs/bull` with a new queue named `ai-summary-queue`. This leverages the existing Redis infrastructure.
- **Text Extraction**: Use `pdf-parse` for its simplicity and robustness in extracting text from PDFs in a Node.js environment.
- **AI Integration**: Use the Google Gemini (Gemini 1.5 Flash/Pro) for summarization.
- **Data Model**: Add a `ai_summary` column of type `TEXT` to the `workshops` table.
- **Frontend**: Use a simple file upload component in the workshop edit page in the Admin app and style it with TailwindCSS.

## Risks / Trade-offs

- **Risk**: Large PDFs might consume significant memory or exceed LLM token limits.
  - **Mitigation**: Implement file size limits and truncate extracted text if it exceeds a reasonable token limit.
- **Risk**: OpenAI API latency or cost.
  - **Mitigation**: Process in the background (Bull Queue) and monitor usage.
- **Trade-off**: Asynchronous processing means the summary isn't immediately available after upload.
  - **Decision**: Show a "Processing..." status in the UI until the background job completes.

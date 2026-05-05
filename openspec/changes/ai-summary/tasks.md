## 1. Database & Infrastructure

- [ ] 1.1 Add `ai_summary` column (type TEXT) to the `workshops` table via migration.
- [ ] 1.2 Configure RabbitMQ exchange and queue `ai.pdf.process`.
- [ ] 1.3 Setup shared storage directory for workshop PDFs.

## 2. Backend API (NestJS)

- [ ] 2.1 Install and configure `multer` for handling PDF file uploads.
- [ ] 2.2 Create `WorkshopsController.uploadPdf` (`POST /workshops/:id/pdf`) to save files to shared storage.
- [ ] 2.3 Implement RabbitMQ producer to publish `{ workshopId, filePath }` when a PDF is uploaded.
- [ ] 2.4 Update `WorkshopsService` to include `ai_summary` in the workshop response.

## 3. AI Processor Worker (Python)

- [ ] 3.1 Initialize Python project with `pika` (RabbitMQ) and `pdfplumber`.
- [ ] 3.2 Implement RabbitMQ consumer for the `ai.pdf.process` queue.
- [ ] 3.3 Implement text extraction logic from PDF files.
- [ ] 3.4 Integrate OpenAI SDK and implement summarization prompt logic.
- [ ] 3.5 Implement DB connection to update the `ai_summary` field in PostgreSQL.

## 4. Frontend Implementation

- [ ] 4.1 **Admin Web**: Add a "Upload PDF" button and file picker to the workshop management interface.
- [ ] 4.2 **Student Web**: Add an "AI Summary" section to the workshop details page.

## 5. Testing & Validation

- [ ] 5.1 Verify PDF upload and file persistence.
- [ ] 5.2 Verify message delivery to RabbitMQ.
- [ ] 5.3 Verify end-to-end summary generation (PDF -> LLM -> DB).
- [ ] 5.4 Test error handling and retries in the AI Worker.

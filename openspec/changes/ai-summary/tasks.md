## 1. Database and Environment

- [x] 1.1 Add `ai_summary` column to the `workshops` table in PostgreSQL using Prisma.
- [x] 1.2 Update the Prisma client and run migrations.
- [x] 1.3 Add `OPENAI_API_KEY` to the environment variables.

## 2. Backend Implementation (NestJS)

- [x] 2.1 Install dependencies: `pdf-parse`, `openai`, `@nestjs/bull`, `bull`.
- [x] 2.2 Configure `ai-summary-queue` in the `WorkshopsModule` using Bull.
- [x] 2.3 Create a new service `AiSummaryService` to handle OpenAI API calls and text extraction logic.
- [x] 2.4 Create a new worker `AiSummaryProcessor` to process jobs from the `ai-summary-queue`.
- [x] 2.5 Update `WorkshopsController` to add an endpoint for PDF upload (`POST /workshops/:id/pdf`).
- [x] 2.6 Implement logic in the controller to save the uploaded file temporarily and add a job to the queue.

## 3. Frontend Implementation (React + TailwindCSS)

- [x] 3.1 Update the workshop edit page in the Admin app to include a file upload field for PDFs.
- [x] 3.2 Implement the API call to upload the PDF.
- [x] 3.3 Update the workshop details view in the Admin and Student apps to display the AI-generated summary.
- [x] 3.4 Handle loading and error states for the summary display (e.g., "Processing...", "No summary available").
- [x] 3.5 Update the UI with tailwindcss to make it look more beautiful and user-friendly.

## 5. Migration: OpenAI to Google Gemini

- [x] **5.1 Environment and Dependency Setup**
    - [x] 5.1.1 Replace `OPENAI_API_KEY` with `GEMINI_API_KEY` in the `.env` file.
    - [x] 5.1.2 Install the official Google Generative AI SDK: `@google/generative-ai`.
    - [x] 5.1.3 Remove the `openai` dependency from `package.json` to keep the project clean.

- [x] **5.2 Service Logic Refactoring (`AiSummaryService`)**
    - [x] 5.2.1 Initialize the `GoogleGenerativeAI` client and configure the model (e.g., `gemini-1.5-flash`)[cite: 8].
    - [x] 5.2.2 Refactor the core summary logic to use Gemini's `generateContent` method instead of OpenAI's `chat.completions`[cite: 8].
    - [x] 5.2.3 Adjust the Response Schema handling to parse Gemini's candidate-based output format[cite: 8].
    - [x] 5.2.4 Optimize the system prompt to leverage Gemini's large context window for better PDF analysis[cite: 8, 9].

- [x] **5.3 Resilience and Error Handling**
    - [x] 5.3.1 Implement error handling for Gemini-specific exceptions, including Safety Filter blocks and Quota exhaustion[cite: 8].
    - [x] 5.3.2 Configure basic rate-limiting logic to stay within the Gemini Free Tier limits (RPM/TPM)[cite: 8, 9].
    - [x] 5.3.3 Verify the end-to-end flow from PDF upload to database storage using the new Gemini integration[cite: 8].

## 7. create reactjs page for AI Summary

- [x] **7.1 create reactjs page for AI Summary**
    - [x] 7.1.1 create reactjs page for AI Summary

## 8. Fix the prisma client path

- [x] **8.1 Fix the prisma client path**
    - [x] 8.1.1 Fix the prisma client path

- [x] Build the client and server to check if any errors occur
- [x] Check and fix why the processing when summary is taking too long, it always spinning "Processing..."
- [x] Run server and check whwy the error is error TS2349: This expression is not callable.
  Type 'typeof import("E:/TKPM/UniHub/server/node_modules/pdf-parse/dist/pdf-parse/cjs/index")' has no call signatures.

16       const data = await pdf(buffer);

- [x] This error occurs when click upload & summarize, check and fix it (Fixed by using `new PDFParse({ data: buffer }).getText()`)
 [Nest] 1424  - 05/06/2026, 11:57:43 AM   ERROR [AiSummaryService] Failed to extract text from PDF
[Nest] 1424  - 05/06/2026, 11:57:43 AM   ERROR [AiSummaryService] TypeError: pdf is not a function
    at AiSummaryService.extractTextFromPdf (E:\TKPM\UniHub\server\src\workshops\ai-summary.service.ts:16:26)
    at AiSummaryProcessor.handleGenerateSummary (E:\TKPM\UniHub\server\src\workshops\ai-summary.processor.ts:28:48)
    at handlers.<computed> (E:\TKPM\UniHub\server\node_modules\bull\lib\queue.js:733:42)
    at Queue.processJob (E:\TKPM\UniHub\server\node_modules\bull\lib\queue.js:1210:22)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)
[Nest] 1424  - 05/06/2026, 11:57:43 AM   ERROR [AiSummaryProcessor] Failed to process AI summary for workshop: 123e4567-e89b-12d3-a456-426614174000
[Nest] 1424  - 05/06/2026, 11:57:43 AM   ERROR [AiSummaryProcessor] Error: PDF text extraction failed
    at AiSummaryService.extractTextFromPdf (E:\TKPM\UniHub\server\src\workshops\ai-summary.service.ts:20:13)
    at AiSummaryProcessor.handleGenerateSummary (E:\TKPM\UniHub\server\src\workshops\ai-summary.processor.ts:28:48)
    at handlers.<computed> (E:\TKPM\UniHub\server\node_modules\bull\lib\queue.js:733:42)
    at Queue.processJob (E:\TKPM\UniHub\server\node_modules\bull\lib\queue.js:1210:22)
    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)

- [x] Fix this error occurs when click upload & summarize (Fixed by updating model to `gemini-1.5-flash-latest`)

## 6. Testing and Validation

- [ ] 6.1 Verify that uploading a PDF correctly triggers the background job.
- [ ] 6.2 Verify that text is extracted correctly from various PDF samples.
- [ ] 6.3 Verify that the summary is generated and stored in the database.
- [ ] 6.4 Verify that the summary is displayed correctly in both Admin and Student apps.

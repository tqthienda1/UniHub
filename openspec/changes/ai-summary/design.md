## Context

<!-- Background and current state -->
The UniHub Workshop system manages workshop registrations. Currently, workshop information is limited to basic metadata. To provide more value to students, we want to automatically generate summaries from workshop introduction PDFs. The system architecture already includes RabbitMQ for asynchronous tasks and a placeholder for an AI Processor Worker.

## Goals / Non-Goals

**Goals:**
- Implement an automated pipeline: PDF Upload -> Text Extraction -> LLM Summarization -> DB Update.
- Ensure the summarization process does not block the user interface (asynchronous).
- Maintain a clear separation of concerns by using a dedicated worker for AI tasks.

**Non-Goals:**
- Building a custom LLM model (will use external API).
- Supporting multi-file uploads per workshop (one PDF per workshop).
- Real-time UI updates (e.g., WebSockets) for summary completion.

## Decisions

- **RabbitMQ for Decoupling**: The Backend API will only handle the file upload and publish a message to the `ai.pdf.process` queue. This ensures the API remains responsive.
- **Python-based Worker**: We will use Python for the AI Processor Worker to leverage `pdfplumber` for robust text extraction and standard AI libraries.
- **OpenAI Integration**: Use OpenAI's Chat Completion API (e.g., `gpt-4o-mini`) for generating concise, high-quality summaries.
- **Database Schema**: Add a nullable `ai_summary` column to the `workshops` table. The `available_slots` and other fields remain unchanged.
- **Storage**: Store the uploaded PDFs in a local directory (e.g., `storage/workshops/{id}/intro.pdf`) accessible by both the API and the Worker (shared volume).

## Risks / Trade-offs

- **Cost and Quotas**: External AI API usage involves costs and rate limits. We should implement retries with exponential backoff.
- **Processing Time**: PDF extraction and AI generation can take 5-15 seconds. Students might see a "Processing..." state or empty summary initially.
- **Accuracy**: LLMs can occasionally miss details or misinterpret complex PDF layouts. We will use a clear prompt to minimize this.

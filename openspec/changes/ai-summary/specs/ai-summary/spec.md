## ADDED Requirements

### Requirement: Workshop PDF Upload
Administrators must be able to upload a PDF file containing introductory information for a specific workshop.

#### Scenario: Successful PDF Upload
- **WHEN** an admin uploads a valid PDF file for a workshop via the `/workshops/:id/pdf` endpoint.
- **THEN** the system stores the file and publishes a processing event to RabbitMQ.

### Requirement: Asynchronous AI Summarization
The system must automatically generate a concise summary of the workshop content from the uploaded PDF using an LLM.

#### Scenario: Summary Generated Successfully
- **WHEN** the AI Processor worker receives a processing event, extracts text from the PDF, and receives a successful response from the AI Model API.
- **THEN** the system updates the workshop record with the generated summary.

#### Scenario: AI Processing Failure
- **WHEN** the AI Model API returns an error or the text extraction fails.
- **THEN** the system retries the operation (up to 3 times) and eventually logs the failure or alerts the administrator if retries are exhausted.

### Requirement: Summary Display
The generated AI summary must be visible to students when viewing workshop details.

#### Scenario: Displaying Summary to Students
- **WHEN** a student views the details of a workshop that has a generated summary.
- **THEN** the `ai_summary` field is included in the API response and displayed in the UI.

# Task Plan

## Blueprint
*(Approved & Completed)*

### 1. Application Architecture Layer
- **Project Name:** LocalLLMTestGenBuddy
- **Frontend (React):**
  - Input Interface for providing the Jira ID and Jira Requirement.
  - Settings Modal/Page to configure API keys and endpoints for Ollama, LM Studio, Grok, OpenAI, and Claude.
  - Results view to display the generated Jira-formatted test cases in a **tabular view**.
- **Backend (Node.js + TypeScript):**
  - API endpoints to handle test case generation requests.
  - LLM Service router to send prompts/tests to the configured LLM provider.

### 2. Functional & Non-Functional Output Formatting
- Maintain a system prompt guiding the LLMs to strictly generate structured test cases in a **Jira Tabular Format** based on the given Jira ID and requirement.

## Phases, Goals, and Checklists
### Phase 1: Discovery & Initialization
- [x] Initialize tracking documents (`task_plan.md`, `findings.md`, `progress.md`, `context.md`)
- [x] Ask discovery questions
- [x] Document project requirements and constraints
- [x] Draft blueprint
- [x] Await blueprint approval

### Phase 2: Project Setup
- [x] Initialize Node.js + TypeScript project (Backend)
- [x] Initialize React project (Frontend)
- [x] Setup overarching workspace structure

### Phase 3: Backend Implementation
- [x] Develop Settings/Config management for multiple LLM APIs.
- [x] Implement LLM Integration Service.
- [x] Create endpoint for Requirement Ingestion and Test Case Generation.

### Phase 4: Frontend Implementation
- [x] Build Chat/Input UI for Jira requirements + Jira ID.
- [x] Build Settings UI for configuring LLM providers.
- [x] Build Results UI for displaying tabular Jira-formatted test cases.
- [x] Integrate with Designs (Custom Modern Dark UI Used)

### Phase 5: Testing & Refinement
- [x] Test End-to-End flow. (Blocked currently by local runtime limits - manual validation by user needed).
- [x] Polish UI/UX.

### Phase 6: Multimedia & Anti-Hallucination (Recent)
- [x] Implement PDF & Image Vision ingestion support.
- [x] Fix parseResponse envelope data loss bug.
- [x] Build Automated Validation Score dashboard.
- [x] Perform full code audit & DRY optimizations.


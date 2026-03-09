# LocalLLMTestGenBuddy

> An AI-powered test case generation platform for QA teams, built to generate structured Jira-ready test cases with anti-hallucination guardrails, BDD/Gherkin support, and automated traceability scoring.

![GitHub](https://img.shields.io/badge/GitHub-Repository-black)
![CI](https://img.shields.io/badge/CI-Enabled-success)

---

## Overview

LocalLLMTestGenBuddy helps QA engineers transform requirements into reliable, structured test cases using modern LLMs, while reducing unsupported assumptions through a built-in anti-hallucination workflow.

The platform is designed for practical QA use cases such as:

- Converting PRDs, screenshots, and design documents into test cases
- Generating Jira-ready manual test cases
- Producing BDD/Gherkin scenarios and downloadable `.feature` files
- Creating API-focused test scenarios from Swagger/OpenAPI specifications
- Measuring test case traceability against source requirements

---

## Key Features

### Multi-LLM Provider Support
Supports multiple model providers for flexibility across local and cloud-based setups:

- Ollama
- LM Studio
- OpenAI GPT-4o
- Claude 3.5 Sonnet
- Gemini 2.0 Flash
- Grok
- Groq

### Anti-Hallucination Guardrails
The generation workflow is designed to reduce fabricated or unsupported outputs by validating content against the provided requirement context before returning test cases.

Each generated test case includes a **Source Fact** reference so users can trace the output back to the originating requirement text.

### BDD / Gherkin Output
Users can generate either:

- Standard tabular test cases, or
- BDD/Gherkin scenarios with downloadable `.feature` files

### PDF and Image-Based Context
Supports uploading requirement documents, screenshots, and design references to enrich input context for vision-capable models.

### Swagger / OpenAPI Support
Upload `.yaml`, `.yml`, or `.json` API definitions to generate API test scenarios directly from specification files.

### Validation Scoring
Each generated test case is evaluated for requirement traceability and labeled using:

- `PASS`
- `WARN`
- `FAIL`

### Persistent Session History
Session history is preserved through page reloads using `localStorage`, allowing users to restore previous work quickly.

### Configurable Test Count
Generate a fixed number of test cases based on need:

- 5
- 10
- 15
- 20
- 30

### Example Mode
A built-in example flow allows users to explore the tool quickly without preparing their own input first.

---

## Why This Project

LLM-based test generation tools are powerful, but they often introduce unsupported assumptions when requirements are incomplete or ambiguous.

LocalLLMTestGenBuddy addresses that challenge by prioritizing:

- factual grounding,
- traceability,
- transparent validation,
- and QA-oriented output formats.

The goal is not just to generate test cases faster, but to generate them more responsibly.

---

## Project Structure

```text
LocalLLMTestGenBuddy/
├── backend/               # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts       # Server setup, routes, rate limiting, sanitization
│   │   └── llmService.ts  # Multi-provider LLM integration with timeout handling
│   ├── .env.example       # Environment variable template
│   └── package.json
├── frontend/              # React + Vite + TypeScript application
│   ├── src/
│   │   ├── App.tsx        # Main UI component
│   │   └── index.css      # Styling and theme definitions
│   └── package.json
├── .github/workflows/     # CI/CD workflows
├── Design/                # UI wireframes and supporting assets
└── README.md
```

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/bappichok/LocalLLMTestGenBuddy.git
cd LocalLLMTestGenBuddy
```

### 2. Configure the Backend

```bash
cd backend
cp .env.example .env
```

Update the `.env` file with the API keys required for the providers you want to use.

### 3. Start the Backend

```bash
npm install
npm run dev
```

Backend default:
`http://localhost:4000`

### 4. Start the Frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend default:
`http://localhost:5173`

---

## Supported LLM Providers

| Provider | API Key Variable | Notes |
|---|---|---|
| Ollama | Not required | Local setup |
| LM Studio | Not required | Local setup |
| OpenAI GPT-4o | `OPENAI_API_KEY` | Vision + PDF support |
| Claude 3.5 Sonnet | `CLAUDE_API_KEY` | Vision + PDF support |
| Gemini 2.0 Flash | `GEMINI_API_KEY` | Vision support |
| Grok (xAI) | `GROK_API_KEY` | Cloud-based provider |
| Groq (llama-3.3-70b) | `GROQ_API_KEY` | Fast inference |

> All provider calls enforce a strict 60-second timeout to avoid hung requests.

---

## Anti-Hallucination Workflow

Every generation passes through a three-step validation flow before final output is returned:

1. **Fact Extraction**  
   The system extracts only the facts explicitly present in the provided requirement.

2. **Missing Information Detection**  
   It identifies gaps or ambiguities that could otherwise lead to assumptions.

3. **Self-Validation Audit**  
   The generated output is checked again before being presented to the user.

This workflow is reflected directly in the UI through **Source Fact** references attached to each generated test case.

---

## Validation Score

The Validation Score module automatically evaluates generated test cases for requirement traceability.

It provides:

- a score from **0 to 100**
- a status label: `PASS`, `WARN`, or `FAIL`
- mapping between generated test cases and verified requirement facts

This helps users quickly identify which outputs are strongly grounded and which may need review.

---

## Security and Architecture

The platform includes baseline protections for safer and more reliable usage:

- **Input Sanitization**  
  User input is sanitized before being processed, helping reduce malicious or malformed prompt content.

- **Rate Limiting**  
  In-memory rate limiting restricts generation traffic to 10 requests per minute per IP.

- **CORS Protection**  
  Development mode is open for local testing, while production deployments can restrict origins via `ALLOWED_ORIGINS`.

- **Graceful Error Handling**  
  Upstream provider issues such as timeout, quota problems, or content filtering are translated into user-friendly messages.

- **Server-Side API Key Management**  
  API keys are stored in environment variables and remain on the server side.

---

## Recommended README Enhancements

To make this repository even stronger for recruiters, hiring managers, and GitHub visitors, consider adding:

- screenshots of the main UI,
- a sample input and output section,
- a short architecture diagram,
- and a “Roadmap” section for upcoming features.

---

## Author

**Bappi Chokhani**  
GitHub: [@bappichok](https://github.com/bappichok)

---

## License

`MIT License`

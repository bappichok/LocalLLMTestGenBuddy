# 🧪 LocalLLMTestGenBuddy

[![GitHub](https://img.shields.io/badge/github-bappichok-181717?logo=github)](https://github.com/bappichok)
[![CI](https://github.com/bappichok/LocalLLMTestGenBuddy/actions/workflows/ci.yml/badge.svg)](https://github.com/bappichok/LocalLLMTestGenBuddy/actions)

> AI-powered Jira test case generator with **Anti-Hallucination guardrails**, **BDD/Gherkin support**, and **automated traceability scoring**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-LLM Support** | Ollama, LM Studio, OpenAI GPT-4o, Claude 3.5, Gemini 2.0 Flash, Grok, Groq |
| 🛡️ **Anti-Hallucination** | Strict fact-verification before generating test cases, with inline "Source Fact" citations |
| 🥒 **BDD / Gherkin Mode** | Generate standard table output OR switch to BDD/Gherkin with `.feature` file downloads |
| 📄 **PDF & Image Upload** | Attach PRDs, screenshots, or design docs as context (Vision-enabled models only) |
| 🔌 **Swagger / OpenAPI** | Upload `.yaml`, `.yml`, or `.json` API specs to automatically generate API test scenarios |
| ✅ **Validation Scoring** | Automated traceability score for every test case with PASS/WARN/FAIL labels |
| 📋 **Persistent History** | Session history survives page reloads (via `localStorage`) with one-click restore |
| 🔢 **Custom Test Count** | Choose exactly how many test cases to generate (5, 10, 15, 20, or 30) |
| 🚀 **Try Example Button** | One-click example to instantly test the tool's capabilities |

---

## 🗂️ Project Structure

```
TestCase_Generator_LocalLLM/
├── backend/               # Express + TypeScript API (Rate limited, CORS protected)
│   ├── src/
│   │   ├── index.ts       # Express server, routes, rate limiter, sanitization
│   │   └── llmService.ts  # Multi-LLM provider layer with timeout handling
│   ├── .env.example       # Copy to .env and fill in keys
│   └── package.json
├── frontend/              # React + Vite + TypeScript UI
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   └── index.css      # Dark theme design system
│   └── package.json
├── .github/workflows/     # CI/CD pipelines (TypeScript type-check + ESLint)
├── Design/                # UI wireframes & design assets
└── README.md
```

---

## 🚀 Getting Started

### 1. Clone the repo
```bash
git clone https://github.com/bappichok/LocalLLMTestGenBuddy.git
cd LocalLLMTestGenBuddy
```

### 2. Configure the backend
```bash
cd backend
cp .env.example .env
# Edit .env and add your API keys
```

### 3. Start the backend
```bash
npm install
npm run dev
# Server runs on http://localhost:4000
```

### 4. Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

---

## 🔑 Supported LLM Providers

| Provider | API Key Variable | Notes |
|---|---|---|
| Ollama | — | Local, no key needed |
| LM Studio | — | Local, no key needed |
| OpenAI GPT-4o | `OPENAI_API_KEY` | Vision + PDF ✓ |
| Claude 3.5 Sonnet | `CLAUDE_API_KEY` | Vision + PDF ✓ |
| Gemini 2.0 Flash | `GEMINI_API_KEY` | Vision ✓ |
| Grok (xAI) | `GROK_API_KEY` | |
| Groq (llama-3.3-70b) | `GROQ_API_KEY` | Super fast 🚀 |

*(All API calls enforce a strict 60-second timeout to prevent hangups).*

---

## 🛡️ Anti-Hallucination System

Every generation goes through a 3-step guardrail before test cases are written:
1. **Fact Extraction** — Only uses facts explicitly stated in the requirement
2. **Missing Info Detection** — Flags gaps that could lead to assumptions  
3. **Self-Validation Audit** — The LLM checks its own output before returning

This is visibly proven in the UI: every test case in the results table displays its **📌 Source Fact**, proving exactly which part of the requirement it was derived from.

---

## 📊 Validation Score

The **Validation Score tab** automatically:
- Scores each test case (0–100) for traceability to the requirement
- Labels each as `✅ PASS` / `⚠️ WARN` / `❌ FAIL`
- Shows which verified facts each test case is linked to

---

## 🔒 Security & Architecture (v1.2)

- **Input Sanitization:** User inputs are stripped of HTML/malicious tags before prompt injection.
- **Rate Limiting:** In-memory rate limiter caps generations to 10 requests/minute per IP.
- **CORS Protection:** Dev mode remains open, while production deployments lock down `ALLOWED_ORIGINS`.
- **Friendly Error Handling:** Secure translation of upstream errors (Quota Exceeded, Content Filters, Timeout) into user-friendly messages.
- **API Keys:** Managed via `.env` and kept strictly server-side.

---

## 👤 Author

**Bappi Chokhani** — [@bappichok](https://github.com/bappichok)

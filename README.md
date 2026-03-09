# 🧪 LocalLLMTestGenBuddy

[![GitHub](https://img.shields.io/badge/github-bappichok-181717?logo=github)](https://github.com/bappichok)

> AI-powered Jira test case generator with **Anti-Hallucination guardrails**, **PDF/Image support**, and **automated traceability scoring**.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🤖 **Multi-LLM Support** | Ollama, LM Studio, OpenAI GPT-4o, Claude 3.5, Gemini 1.5, Grok, Groq |
| 🛡️ **Anti-Hallucination** | Strict fact-verification before generating test cases |
| 📄 **PDF & Image Upload** | Attach PRDs, screenshots, or design docs as context |
| ✅ **Validation Scoring** | Automated traceability score for every test case |
| 📋 **History Tab** | Session history with one-click restore |
| 📑 **Pagination** | Clean paginated results table (10 rows per page) |
| 📋 **Copy to Clipboard** | Export test cases as a tab-separated table |

---

## 🗂️ Project Structure

```
TestCase_Generator_LocalLLM/
├── backend/               # Express + TypeScript API
│   ├── src/
│   │   ├── index.ts       # Express server, routes
│   │   └── llmService.ts  # Multi-LLM provider layer
│   ├── .env.example       # Copy to .env and fill in keys
│   └── package.json
├── frontend/              # React + Vite + TypeScript UI
│   ├── src/
│   │   ├── App.tsx        # Main application component
│   │   └── index.css      # Dark theme design system
│   └── package.json
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
| Gemini 1.5 Pro | `GEMINI_API_KEY` | Vision ✓ |
| Grok (xAI) | `GROK_API_KEY` | |
| Groq (llama-3.3-70b) | `GROQ_API_KEY` | Super fast 🚀 |

---

## 🛡️ Anti-Hallucination System

Every generation goes through a 3-step guardrail before test cases are written:
1. **Fact Extraction** — Only uses facts explicitly stated in the requirement
2. **Missing Info Detection** — Flags gaps that could lead to assumptions  
3. **Self-Validation Audit** — The LLM checks its own output before returning

---

## 📊 Validation Score

The **Validation Score tab** automatically:
- Scores each test case (0–100) for traceability to the requirement
- Labels each as `✅ PASS` / `⚠️ WARN` / `❌ FAIL`
- Shows which verified facts each test case is linked to

---

## 🔒 Security Notes

- API keys are stored in `.env` (never committed to git)
- No authentication is built-in — suitable for **internal/personal use**
- For public deployment, add User Auth (Firebase/Clerk) and rate limiting

---

## 👤 Author

**Bappi Chokhani** — [@bappichok](https://github.com/bappichok)

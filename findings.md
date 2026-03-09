# Findings

## Research & Discoveries
- **Project Name:** LocalLLMTestGenBuddy
- **Core Functionality:** Local test case generator using Ollama, LM Studio, Grok API, OpenAI, or Claude.
- **Testing Context:** API test cases and web application test cases (functional and non-functional).
- **Input Mechanism:** User provides Jira requirement and Jira ID natively through the UI via text input/chat.
- **Output Format:** Test cases created based on Jira ID + requirement in **tabular view** in Jira format.
- **Generator Tech Stack:** Backend in Node.js + TypeScript, Frontend in React.
- **LLM API Keys:** Third-party cloud providers (Claude/OpenAI) are handled via a backend `.env` injection.
- **Local LLM Prompt Coercion:** Smaller local models (like Llama3 on Ollama) must have their `system prompt` instructions injected directly into the `user prompt` block to force multi-item JSON array outputs.

## Constraints
- The tool must output test cases strictly in a **tabular Jira format**.
- **Missing Asset:** The user mentioned checking configurations and visual designs in a `design` folder multiple times, but there is no `design` folder present in the workspace (`/Users/bappichokhani/Documents/TestCase_Generator_LocalLLM`).
- **Network Boundaries:** Application must be run locally on user's machine to bridge local LLM endpoints (`localhost:11434` / `localhost:1234`).

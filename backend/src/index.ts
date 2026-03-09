import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LLMService, LLMProvider } from './llmService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '25mb' })); // Increased limit for base64 PDF/image payloads

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Main generation endpoint ──────────────────────────────────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { jiraId, requirement, provider, attachmentText, attachmentBase64, attachmentMimeType } = req.body;

    if (!jiraId || !requirement || !provider) {
      return res.status(400).json({ error: 'jiraId, requirement, and provider are required' });
    }

    // Log what we received for debugging
    if (attachmentText) {
      console.log(`[Attachment] Text: ${attachmentText.length} chars`);
    }
    if (attachmentBase64 && attachmentMimeType) {
      console.log(`[Attachment] Binary (${attachmentMimeType}): ${Math.round(attachmentBase64.length * 0.75 / 1024)} KB decoded`);
    }
    console.log(`[Generate] ${jiraId} via ${provider}`);

    const apiKeys = {
      openai: process.env.OPENAI_API_KEY || '',
      claude: process.env.CLAUDE_API_KEY || '',
      gemini: process.env.GEMINI_API_KEY || '',
      grok:   process.env.GROK_API_KEY   || '',
      groq:   process.env.GROQ_API_KEY   || ''
    };

    const endpoints = {
      ollama:   process.env.OLLAMA_ENDPOINT    || 'http://127.0.0.1:11434/api/generate',
      lmstudio: process.env.LM_STUDIO_ENDPOINT || 'http://127.0.0.1:1234/v1/chat/completions'
    };

    const result = await LLMService.generateTestCases({
      jiraId,
      requirement,
      attachmentText: attachmentText || '',
      attachmentBase64: attachmentBase64 || '',
      attachmentMimeType: attachmentMimeType || '',
      provider: provider as LLMProvider,
      apiKeys,
      endpoints
    });

    res.json({ success: true, testCases: result });

  } catch (error: any) {
    console.error('[Generate] Error:', error.message || error);
    res.status(500).json({ error: error.message || 'Internal server error during generation' });
  }
});

app.listen(PORT, () => {
  console.log(`LocalLLMTestGenBuddy Backend running on http://localhost:${PORT}`);
});

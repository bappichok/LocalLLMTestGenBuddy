import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { LLMService, LLMProvider } from './llmService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── CORS: locked in production, open in dev ────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',');
app.use(cors({
  origin: IS_PROD
    ? (origin, cb) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
        else cb(new Error(`CORS: origin ${origin} not allowed`));
      }
    : '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json({ limit: '25mb' }));

// ── In-memory rate limiter (10 req/min per IP) ─────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return next();
  }

  entry.count++;
  if (entry.count > RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    return res.status(429).json({
      error: `Too many requests. You've hit the limit of ${RATE_LIMIT} generations per minute. Please wait ${retryAfter}s and try again.`
    });
  }
  next();
}

// Purge stale entries every 5 minutes to avoid memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 5 * 60_000);

// ── Concurrency Queue ─────────────────────────────────────────────────────────
const MAX_CONCURRENT_GENERATIONS = 2;
let activeGenerations = 0;
const generationQueue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (activeGenerations < MAX_CONCURRENT_GENERATIONS) {
    activeGenerations++;
    return Promise.resolve();
  }
  return new Promise<void>(resolve => {
    generationQueue.push(() => {
      activeGenerations++;
      resolve();
    });
  });
}

function releaseSlot() {
  activeGenerations--;
  if (generationQueue.length > 0) {
    const next = generationQueue.shift();
    if (next) next();
  }
}

// ── Friendly error message translator ─────────────────────────────────────────
function friendlyError(rawMessage: string): string {
  if (rawMessage.includes('quota') || rawMessage.includes('exceeded your current quota'))
    return 'OpenAI quota exceeded. Top up credits at platform.openai.com/billing, or switch to Groq (free).';
  if (rawMessage.includes('credit balance') || rawMessage.includes('too low'))
    return 'Claude has insufficient credits. Top up at console.anthropic.com, or switch to Gemini / Groq.';
  if (rawMessage.includes('decommissioned') || rawMessage.includes('no longer supported'))
    return 'The selected model has been retired by the provider. Please update the model name in your config.';
  if (rawMessage.includes('Gemini API Key is missing'))
    return 'Gemini API Key is not set. Add GEMINI_API_KEY to your backend/.env file and restart the server.';
  if (rawMessage.includes('API Key is missing'))
    return `${rawMessage} Add the key to backend/.env and restart the backend server.`;
  if (rawMessage.includes('ECONNREFUSED'))
    return 'Cannot connect to the local LLM server. Make sure Ollama or LM Studio is running on your machine.';
  if (rawMessage.includes('timeout') || rawMessage.includes('ETIMEDOUT') || rawMessage.includes('ECONNABORTED'))
    return 'The LLM took too long to respond (60s timeout). Try a smaller requirement, or switch to a faster provider like Groq.';
  if (rawMessage.includes('invalid JSON') || rawMessage.includes('JSON format'))
    return 'The LLM returned an unexpected format. Try generating again — local models can be inconsistent. Cloud providers (Groq, Gemini) are more reliable.';
  return rawMessage;
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', version: '1.1.0', timestamp: new Date().toISOString() });
});

// ── Main generation endpoint (v1) ─────────────────────────────────────────────
app.post('/api/generate', rateLimit, async (req: Request, res: Response) => {
  try {
    const { jiraId, requirement, provider, attachmentText, attachmentBase64, attachmentMimeType, outputFormat, testCount } = req.body;

    if (!jiraId || !requirement || !provider) {
      return res.status(400).json({ error: 'jiraId, requirement, and provider are required.' });
    }

    // ── Input length limits ──────────────────────────────────────────────────
    if (requirement.length > 15_000) {
      return res.status(400).json({ error: 'Requirement text is too long (max 15,000 characters). Please shorten or paste only the relevant section.' });
    }
    if (attachmentText && attachmentText.length > 80_000) {
      return res.status(400).json({ error: 'Attachment text is too large (max 80,000 characters). Please use a shorter document.' });
    }

    // ── Sanitize inputs ──────────────────────────────────────────────────────
    const sanitize = (s: string) => s.replace(/[<>]/g, '').trim();
    const safeJiraId = sanitize(jiraId).slice(0, 50);
    const safeRequirement = sanitize(requirement);

    // Logging
    if (attachmentText) console.log(`[Attachment] Text: ${attachmentText.length} chars`);
    if (attachmentBase64 && attachmentMimeType) {
      console.log(`[Attachment] Binary (${attachmentMimeType}): ${Math.round(attachmentBase64.length * 0.75 / 1024)} KB decoded`);
    }
    console.log(`[Generate] ${safeJiraId} via ${provider} | format=${outputFormat || 'table'} | count=${testCount || 'default'}`);

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

    if (activeGenerations >= MAX_CONCURRENT_GENERATIONS) {
      console.log(`[Queue] Slots full. Waiting in queue... Active: ${activeGenerations}, Queued: ${generationQueue.length + 1}`);
    }
    await acquireSlot();

    try {
      const result = await LLMService.generateTestCases({
        jiraId: safeJiraId,
        requirement: safeRequirement,
        attachmentText: attachmentText || '',
        attachmentBase64: attachmentBase64 || '',
        attachmentMimeType: attachmentMimeType || '',
        provider: provider as LLMProvider,
        outputFormat: outputFormat || 'table',
        testCount: Number(testCount) || 10,
        apiKeys,
        endpoints
      });

      res.json({ success: true, testCases: result });
    } finally {
      releaseSlot();
    }

  } catch (error: any) {
    const rawMessage = error.message || 'Internal server error during generation';
    const friendly = friendlyError(rawMessage);
    console.error('[Generate] Error:', rawMessage);
    res.status(500).json({ error: friendly });
  }
});

app.listen(PORT, () => {
  console.log(`LocalLLMTestGenBuddy Backend running on http://localhost:${PORT} [${IS_PROD ? 'PRODUCTION' : 'DEV'}]`);
});

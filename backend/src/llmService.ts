import axios from 'axios';

export type LLMProvider = 'ollama' | 'lmstudio' | 'openai' | 'claude' | 'gemini' | 'grok' | 'groq';
export type OutputFormat = 'table' | 'gherkin';

// ── Centralized model config ───────────────────────────────────────────────────
const MODELS = {
    ollama: 'llama3.2',
    groq: 'llama-3.3-70b-versatile',
    grok: 'grok-beta',
    openai: 'gpt-4o',
    claude: 'claude-3-5-sonnet-20240620',
    gemini: 'gemini-2.0-flash',
} as const;

// 5-minute timeout for all LLM calls (local models can be very slow)
const AXIOS_TIMEOUT = 300_000;

// Vision-capable providers that can accept image/PDF as base64
const VISION_PROVIDERS: LLMProvider[] = ['openai', 'claude', 'gemini'];

interface GenerateRequest {
    jiraId: string;
    requirement: string;
    attachmentText?: string;
    attachmentBase64?: string;
    attachmentMimeType?: string;
    provider: LLMProvider;
    outputFormat?: OutputFormat;    // 'table' (default) or 'gherkin'
    testCount?: number;             // how many test cases to generate (default 10)
    apiKeys?: Record<string, string>;
    endpoints?: Record<string, string>;
}

// Full response envelope returned to the frontend
export interface LLMEnvelope {
    verifiedFacts: string[];
    missingInformation: string[];
    selfValidationCheck: string;
    testCases: TestCaseResult[];
    gherkin?: string;   // populated when outputFormat === 'gherkin'
}

interface TestCaseResult {
    id: string;
    jiraId: string;
    type: string;
    testObjective: string;   // Short description of WHAT is being tested
    testSteps: string;       // Numbered, step-by-step instructions
    expectedResult: string;  // What should happen
    actualResult: string;    // Left blank — filled by tester
    passFail: string;        // Left blank — filled by tester
    relatedDefects: string;  // Left blank — filled by tester
}

const SYSTEM_PROMPT = `
ROLE: You are an expert QA Assistant operating under strict verification rules.

SCOPE OF KNOWLEDGE:
You may ONLY use information explicitly provided in:
- The Jira Requirement Text
- The Uploaded Attachment Text / Document / Image
- Standard user input

STRICT RULES (MANDATORY):
1. DO NOT invent features, APIs, error codes, UI elements, or behavior.
2. DO NOT assume default or "typical" system behavior.
3. If information is missing or unclear, explicitly note it.
4. Every assertion must be traceable to provided input.
5. If a detail is inferred, label it explicitly as: "Inference (low confidence)".
6. Output must be deterministic and repeatable.
7. Test cases MUST NOT only follow the "happy path". 
8. You MUST include a mix of scenarios:
   - Positive/Happy path (valid inputs, expected user behavior)
   - Negative scenarios (invalid inputs, missing permissions, empty fields)
   - Edge/Boundary cases (max/min lengths, special characters)
   - System error states (timeouts, API failures, what the system does when something goes wrong)
9. Think like a real end-user and include unpredictable or mistaken user actions.

PROCESS YOU MUST FOLLOW:
Step 1: Extract verifiable facts from the input.
Step 2: List unknown or missing information.
Step 3: Generate exactly N test cases ONLY from Step 1 facts (at least 5 if unspecified).
         For each test case, write DETAILED numbered test steps (e.g., "1. Navigate to URL\n2. Click Login").
Step 4: Perform a self-check for hallucinations or contradictions.

OUTPUT FORMAT REQUIREMENTS:
You MUST output ONLY a valid JSON object. No markdown, no preamble, no \`\`\`json.
Strictly adhere to this schema:

{
  "verifiedFacts": ["Fact 1 from input", "Fact 2 from input"],
  "missingInformation": ["What is unknown"],
  "selfValidationCheck": "[Pass/Fail] Justification.",
  "testCases": [
    {
      "id": "1",
      "jiraId": "PROJ-123",
      "type": "Functional",
      "testObjective": "Short description of WHAT is being tested",
      "testSteps": "1. Go to the application URL\n2. Enter valid credentials\n3. Click the Submit button",
      "expectedResult": "User is redirected to the dashboard",
      "actualResult": "",
      "passFail": "",
      "relatedDefects": ""
    }
  ]
}

IMPORTANT:
- testSteps MUST be a single string with numbered steps separated by \\n
- actualResult, passFail, relatedDefects MUST always be empty strings (filled by tester)
- Ensure output is valid JSON parseable by JSON.parse(). DO NOT wrap testCases at the root level.
`;

// ── BDD / Gherkin system prompt ────────────────────────────────────────────────
const GHERKIN_SYSTEM_PROMPT = `
ROLE: You are an expert BDD QA Assistant. Generate Gherkin feature files strictly from provided input.

STRICT RULES:
1. Only use facts explicitly stated in the requirement/attachment.
2. Do NOT invent steps, fields, or behaviour.
3. Use proper Gherkin keywords: Feature, Scenario, Given, When, Then, And, But.
4. Each Scenario should be independent and testable.
5. Scenarios MUST NOT only follow the "happy path". Include positive, negative (invalid input), edge cases, and error states (like timeouts and system failures). Think like a real, unpredictable user.

OUTPUT FORMAT: Valid JSON only. No markdown, no preamble.

{
  "verifiedFacts": ["Fact 1"],
  "missingInformation": ["What is unknown"],
  "selfValidationCheck": "[Pass/Fail] Justification.",
  "gherkin": "Feature: <title>\n\n  Scenario: <name>\n    Given <precondition>\n    When <action>\n    Then <expected outcome>\n\n  Scenario: ..."
}
`;

// ─── Shared OpenAI-compatible helper (used by OpenAI, Grok, Groq, LM Studio) ─
async function callOpenAICompatible(
    endpoint: string,
    apiKey: string | undefined,
    model: string,
    userPrompt: string,
    activeSystemPrompt: string = SYSTEM_PROMPT,
    imageBase64?: string,
    imageMimeType?: string
): Promise<string> {
    const userContent: any[] = [{ type: 'text', text: userPrompt }];

    if (imageBase64 && imageMimeType && imageMimeType.startsWith('image/')) {
        userContent.push({
            type: 'image_url',
            image_url: { url: `data:${imageMimeType};base64,${imageBase64}` }
        });
    }

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    const response = await axios.post(endpoint, {
        model,
        messages: [
            { role: 'system', content: activeSystemPrompt },
            { role: 'user', content: userContent.length === 1 ? userContent[0].text : userContent }
        ],
        temperature: 0.2
    }, { headers, timeout: AXIOS_TIMEOUT });

    return response.data.choices[0].message.content;
}

// ─── Main Service ─────────────────────────────────────────────────────────────
export class LLMService {

    static async generateTestCases(req: GenerateRequest): Promise<LLMEnvelope> {
        const isGherkin = req.outputFormat === 'gherkin';
        const activePrompt = isGherkin ? GHERKIN_SYSTEM_PROMPT : SYSTEM_PROMPT;

        // Build user prompt
        const count = Math.min(Math.max(req.testCount || 10, 1), 30);
        let userPrompt = `Jira ID: ${req.jiraId}\nRequirement: ${req.requirement}\n\nGenerate exactly ${count} test cases.`;
        if (req.attachmentText) {
            userPrompt += `\n\nATTACHED DOCUMENT/LOGS/PRD:\n${req.attachmentText}`;
        }
        if (req.attachmentBase64 && req.attachmentMimeType && !VISION_PROVIDERS.includes(req.provider)) {
            userPrompt += `\n\n[NOTE: A file (${req.attachmentMimeType}) was uploaded but this provider does not support vision/PDF. Analyse based on the requirement text only.]`;
        }

        let rawResponse = '';

        try {
            switch (req.provider) {
                case 'ollama':
                    rawResponse = await this.callOllama(userPrompt, req.endpoints?.ollama, activePrompt);
                    break;
                case 'lmstudio':
                    rawResponse = await callOpenAICompatible(
                        req.endpoints?.lmstudio || 'http://127.0.0.1:1234/v1/chat/completions',
                        undefined, 'local-model', userPrompt, activePrompt
                    );
                    break;
                case 'openai':
                    rawResponse = await this.callOpenAI(userPrompt, req.apiKeys?.openai, activePrompt, req.attachmentBase64, req.attachmentMimeType);
                    break;
                case 'claude':
                    rawResponse = await this.callClaude(userPrompt, req.apiKeys?.claude, activePrompt, req.attachmentBase64, req.attachmentMimeType);
                    break;
                case 'gemini':
                    rawResponse = await this.callGemini(userPrompt, req.apiKeys?.gemini, activePrompt, req.attachmentBase64, req.attachmentMimeType);
                    break;
                case 'grok':
                    rawResponse = await callOpenAICompatible(
                        'https://api.x.ai/v1/chat/completions',
                        req.apiKeys?.grok, MODELS.grok, userPrompt, activePrompt,
                        req.attachmentBase64, req.attachmentMimeType
                    );
                    break;
                case 'groq':
                    rawResponse = await callOpenAICompatible(
                        'https://api.groq.com/openai/v1/chat/completions',
                        req.apiKeys?.groq, MODELS.groq, userPrompt, activePrompt
                    );
                    break;
                default:
                    throw new Error(`Unsupported provider: ${req.provider}`);
            }

            return this.parseResponse(rawResponse, isGherkin);
        } catch (error: any) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            console.error(`[LLMService] Error calling ${req.provider}:`, errorMessage);
            throw new Error(errorMessage);
        }
    }

    private static parseResponse(responseStr: string, isGherkin = false): LLMEnvelope {
        let cleanStr = responseStr.trim();

        // Strip markdown code fences if any
        const jsonMatch = cleanStr.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            cleanStr = jsonMatch[1].trim();
        } else {
            if (cleanStr.startsWith('```json')) cleanStr = cleanStr.slice(7);
            else if (cleanStr.startsWith('```')) cleanStr = cleanStr.slice(3);
            if (cleanStr.endsWith('```')) cleanStr = cleanStr.slice(0, -3);
        }
        cleanStr = cleanStr.trim();

        const emptyEnvelope: LLMEnvelope = {
            verifiedFacts: [],
            missingInformation: [],
            selfValidationCheck: '',
            testCases: []
        };

        try {
            const parsed = JSON.parse(cleanStr);
            if (!parsed || typeof parsed !== 'object') return emptyEnvelope;

            // Gherkin mode: expect { gherkin: string, verifiedFacts, ... }
            if (isGherkin && typeof parsed.gherkin === 'string') {
                return {
                    verifiedFacts: Array.isArray(parsed.verifiedFacts) ? parsed.verifiedFacts : [],
                    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
                    selfValidationCheck: typeof parsed.selfValidationCheck === 'string' ? parsed.selfValidationCheck : '',
                    testCases: [],
                    gherkin: parsed.gherkin
                };
            }

            // Full anti-hallucination envelope (table mode)
            if (parsed.testCases && Array.isArray(parsed.testCases)) {
                return {
                    verifiedFacts: Array.isArray(parsed.verifiedFacts) ? parsed.verifiedFacts : [],
                    missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
                    selfValidationCheck: typeof parsed.selfValidationCheck === 'string' ? parsed.selfValidationCheck : '',
                    testCases: parsed.testCases
                };
            }

            if (Array.isArray(parsed)) return { ...emptyEnvelope, testCases: parsed };

            // Fixed: check testObjective (new field), not legacy description
            if (parsed.id || parsed.jiraId || parsed.testObjective) {
                return { ...emptyEnvelope, testCases: [parsed] };
            }

            return emptyEnvelope;
        } catch (e) {
            console.error('[LLMService] Failed to parse JSON from LLM:', cleanStr.substring(0, 200));
            throw new Error('LLM returned an invalid JSON format. Please try again.');
        }
    }

    // ── Ollama (local, small model — inject system prompt into user prompt) ────
    private static async callOllama(prompt: string, endpoint = 'http://127.0.0.1:11434/api/generate', activeSystemPrompt = SYSTEM_PROMPT) {
        const combinedPrompt = `${activeSystemPrompt}\n\nUSER REQUEST:\n${prompt}`;
        const response = await axios.post(endpoint, {
            model: MODELS.ollama,
            prompt: combinedPrompt,
            stream: false,
            format: 'json'
        }, { timeout: AXIOS_TIMEOUT });
        return response.data.response;
    }

    // ── OpenAI GPT-4o with optional image vision ───────────────────────────────
    private static async callOpenAI(prompt: string, apiKey?: string, activeSystemPrompt = SYSTEM_PROMPT, base64?: string, mimeType?: string) {
        if (!apiKey) throw new Error('OpenAI API Key is missing');

        const userContent: any[] = [{ type: 'text', text: prompt }];
        if (base64 && mimeType && mimeType.startsWith('image/')) {
            userContent.push({ type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } });
        }

        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: MODELS.openai,
            messages: [
                { role: 'system', content: activeSystemPrompt },
                { role: 'user', content: userContent.length === 1 ? userContent[0].text : userContent }
            ],
            temperature: 0.2,
        }, { headers: { Authorization: `Bearer ${apiKey}` }, timeout: AXIOS_TIMEOUT });

        return response.data.choices[0].message.content;
    }

    // ── Claude with optional image/PDF vision ─────────────────────────────────
    private static async callClaude(prompt: string, apiKey?: string, activeSystemPrompt = SYSTEM_PROMPT, base64?: string, mimeType?: string) {
        if (!apiKey) throw new Error('Claude API Key is missing');

        const userContent: any[] = [{ type: 'text', text: prompt }];
        if (base64 && mimeType) {
            if (mimeType.startsWith('image/')) {
                userContent.push({ type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } });
            } else if (mimeType === 'application/pdf') {
                userContent.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: base64 } });
            }
        }

        const response = await axios.post('https://api.anthropic.com/v1/messages', {
            model: MODELS.claude,
            max_tokens: 4096,
            system: activeSystemPrompt,
            messages: [{ role: 'user', content: userContent }],
            temperature: 0.2
        }, {
            headers: {
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-beta': 'pdfs-2024-09-25'
            },
            timeout: AXIOS_TIMEOUT
        });
        return response.data.content[0].text;
    }

    // ── Gemini with optional image vision ─────────────────────────────────────
    private static async callGemini(prompt: string, apiKey?: string, activeSystemPrompt = SYSTEM_PROMPT, base64?: string, mimeType?: string) {
        if (!apiKey) throw new Error('Gemini API Key is missing');

        const parts: any[] = [{ text: prompt }];
        if (base64 && mimeType) {
            parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
        }

        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${MODELS.gemini}:generateContent?key=${apiKey}`,
            {
                systemInstruction: { parts: [{ text: activeSystemPrompt }] },
                contents: [{ parts }],
                generationConfig: { temperature: 0.2, responseMimeType: 'application/json' }
            },
            { timeout: AXIOS_TIMEOUT }
        );
        return response.data.candidates[0].content.parts[0].text;
    }
}

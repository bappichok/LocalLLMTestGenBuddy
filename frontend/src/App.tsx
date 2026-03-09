import { useState, useMemo, useCallback } from 'react'
import { Sparkles, Server, Loader2, Copy, Check, ShieldCheck, FileText, Image, Github, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import './index.css'

// ─── Types ────────────────────────────────────────────────────────────────────
export type LLMProvider = 'ollama' | 'lmstudio' | 'openai' | 'claude' | 'gemini' | 'grok' | 'groq';

const VISION_PROVIDERS: LLMProvider[] = ['openai', 'claude', 'gemini'];
const PAGE_SIZE = 10;

interface TestCase {
  id: string;
  jiraId: string;
  type: string;
  description: string;
  expected: string;
}

interface LLMEnvelope {
  verifiedFacts: string[];
  missingInformation: string[];
  selfValidationCheck: string;
  testCases: TestCase[];
}

interface ValidationResult {
  testCaseId: string;
  score: number;
  status: 'PASS' | 'WARN' | 'FAIL';
  matchedFacts: string[];
  unlinkedReason: string;
}

interface AttachmentInfo {
  file: File;
  type: 'text' | 'pdf' | 'image';
  textContent?: string;
  base64?: string;
  dataUrl?: string;
  mimeType: string;
}

interface HistoryEntry {
  id: string;
  jiraId: string;
  requirement: string;
  provider: LLMProvider;
  timestamp: string;
  envelope: LLMEnvelope;
}

// ─── Validation Engine ────────────────────────────────────────────────────────
function validateTestCases(testCases: TestCase[], facts: string[], requirement: string): ValidationResult[] {
  const stopWords = new Set(['a','an','the','is','are','to','of','in','for','with','and','or','not','that','this','be','on','at','by','as','it','its']);
  const extractKeywords = (text: string): string[] =>
    text.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w));

  const requirementKeywords = new Set(extractKeywords(requirement));
  const factKeywords = facts.flatMap(f => extractKeywords(f));
  const allKnownKeywords = new Set([...requirementKeywords, ...factKeywords]);

  return testCases.map(tc => {
    const tcText = `${tc.description} ${tc.expected}`.toLowerCase();
    const tcWords = extractKeywords(tcText);

    const matchedFacts = facts.filter(fact => {
      const factWords = extractKeywords(fact);
      return factWords.filter(w => tcText.includes(w)).length >= Math.min(2, factWords.length);
    });

    const unknownWords = tcWords.filter(w => !allKnownKeywords.has(w) && w.length > 4);
    let score = 100;
    if (matchedFacts.length === 0) score -= 50;
    score -= Math.min(40, unknownWords.length * 10);
    score = Math.max(0, Math.min(100, score));

    const status: 'PASS' | 'WARN' | 'FAIL' = score >= 70 ? 'PASS' : score >= 40 ? 'WARN' : 'FAIL';
    const unlinkedReason = status !== 'PASS'
      ? (matchedFacts.length === 0
          ? 'No verified facts matched. May be inferring behavior.'
          : `Possibly invented terms: "${unknownWords.slice(0, 3).join('", "')}"`)
      : '';
    return { testCaseId: tc.id, score, status, matchedFacts, unlinkedReason };
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function detectFileType(file: File): 'text' | 'pdf' | 'image' {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('image/')) return 'image';
  return 'text';
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e: ProgressEvent<FileReader>) => resolve(e.target?.result as string || '');
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsText(file);
  });
}

function readFileAsBase64(file: File): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = (e: ProgressEvent<FileReader>) => {
      const dataUrl = e.target?.result as string;
      const base64 = dataUrl.split(',')[1];
      resolve({ base64, dataUrl });
    };
    r.onerror = () => reject(new Error('Failed to read file'));
    r.readAsDataURL(file);
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function App() {
  const [jiraId, setJiraId] = useState('');
  const [requirement, setRequirement] = useState('');
  const [llmProvider, setLlmProvider] = useState<LLMProvider>('ollama');
  const [envelope, setEnvelope] = useState<LLMEnvelope | null>(null);
  const [attachment, setAttachment] = useState<AttachmentInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'results' | 'validation' | 'history'>('results');
  const [currentPage, setCurrentPage] = useState(1);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // ── File Handler ───────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (file: File | null) => {
    if (!file) { setAttachment(null); return; }
    const type = detectFileType(file);
    try {
      if (type === 'text') {
        const textContent = await readFileAsText(file);
        setAttachment({ file, type, textContent, mimeType: file.type || 'text/plain' });
      } else {
        const { base64, dataUrl } = await readFileAsBase64(file);
        setAttachment({ file, type, base64, dataUrl, mimeType: file.type });
      }
    } catch {
      setError('Could not read the selected file.');
    }
  }, []);

  // ── Generate Handler ───────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setEnvelope(null);
    setActiveTab('results');
    setCurrentPage(1);

    const isVisionProvider = VISION_PROVIDERS.includes(llmProvider);
    const attachmentIsMedia = attachment && (attachment.type === 'pdf' || attachment.type === 'image');

    if (attachmentIsMedia && !isVisionProvider) {
      setError(`⚠️ Provider "${llmProvider}" does not support PDF/image uploads. Switch to OpenAI, Claude, or Gemini, or upload a .txt file instead.`);
      setLoading(false);
      return;
    }

    try {
      const body: Record<string, string> = { jiraId, requirement, provider: llmProvider };
      if (attachment?.type === 'text') body.attachmentText = attachment.textContent || '';
      else if (attachment?.type === 'pdf' || attachment?.type === 'image') {
        body.attachmentBase64 = attachment.base64 || '';
        body.attachmentMimeType = attachment.mimeType;
      }

      const response = await fetch('http://localhost:4000/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to generate test cases.');

      const env: LLMEnvelope = data.testCases || { verifiedFacts: [], missingInformation: [], selfValidationCheck: '', testCases: [] };
      setEnvelope(env);

      // Add to session history (max 20)
      const entry: HistoryEntry = {
        id: Date.now().toString(),
        jiraId,
        requirement: requirement.slice(0, 100),
        provider: llmProvider,
        timestamp: new Date().toLocaleTimeString(),
        envelope: env,
      };
      setHistory(prev => [entry, ...prev].slice(0, 20));

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected network error occurred.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTable = () => {
    if (!envelope?.testCases.length) return;
    const headers = 'Test ID\tJira ID\tType\tDescription\tExpected Result\n';
    const rows = envelope.testCases.map(r =>
      `${r.id}\t${r.jiraId}\t${r.type}\t${r.description.replace(/\n/g, ' ')}\t${r.expected.replace(/\n/g, ' ')}`
    ).join('\n');
    navigator.clipboard.writeText(headers + rows);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const loadHistoryEntry = (entry: HistoryEntry) => {
    setEnvelope(entry.envelope);
    setJiraId(entry.jiraId);
    setCurrentPage(1);
    setActiveTab('results');
  };

  // ── Derived ────────────────────────────────────────────────────────────────
  const results = envelope?.testCases || [];
  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pagedResults = results.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const validationResults = useMemo(() =>
    results.length > 0 ? validateTestCases(results, envelope?.verifiedFacts || [], requirement) : [],
    [results, envelope, requirement]
  );

  const overallScore = validationResults.length > 0
    ? Math.round(validationResults.reduce((s, v) => s + v.score, 0) / validationResults.length)
    : 0;
  const passCount = validationResults.filter(v => v.status === 'PASS').length;
  const warnCount = validationResults.filter(v => v.status === 'WARN').length;
  const failCount = validationResults.filter(v => v.status === 'FAIL').length;

  const isVisionProvider = VISION_PROVIDERS.includes(llmProvider);

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-title">
          <Server size={28} color="#00d2ff" />
          <h1>LocalLLMTestGenBuddy</h1>
        </div>
        <p>AI-Powered Jira Test Case Generator · Anti-Hallucination Mode</p>
        <a
          href="https://github.com/bappichok"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          <Github size={16} />
          bappichok
        </a>
      </header>

      <div className="layout-grid">
        {/* ── Left: Input Panel (sticky generate button) ── */}
        <main className="input-panel">
          <div className="input-group">
              <label>LLM Provider</label>
              <select value={llmProvider} onChange={e => setLlmProvider(e.target.value as LLMProvider)}>
                <option value="ollama">Ollama (Local)</option>
                <option value="lmstudio">LM Studio (Local)</option>
                <option value="openai">OpenAI GPT-4o (Vision ✓)</option>
                <option value="claude">Claude 3.5 Sonnet (Vision + PDF ✓)</option>
                <option value="gemini">Gemini 1.5 Pro (Vision ✓)</option>
                <option value="grok">Grok (xAI)</option>
                <option value="groq">Groq — llama-3.3-70b</option>
              </select>
            </div>

            <div className="input-group">
              <label>Jira Ticket ID</label>
              <input type="text" placeholder="e.g. PROJ-1234" value={jiraId} onChange={e => setJiraId(e.target.value)} />
            </div>

            <div className="input-group">
              <label>Requirement / Description</label>
              <textarea
                rows={6}
                placeholder="Paste your Jira user story, acceptance criteria, or requirement here..."
                value={requirement}
                onChange={e => setRequirement(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>
                Attachment
                {isVisionProvider
                  ? ' (Text, PDF, Images supported ✓)'
                  : ' (Text files only — switch to Claude/OpenAI/Gemini for PDF & images)'}
              </label>
              <input
                type="file"
                className="file-input"
                accept=".txt,.csv,.log,.md,.pdf,.png,.jpg,.jpeg,.webp"
                onChange={e => handleFileChange(e.target.files?.[0] || null)}
              />
              {attachment && (
                <div className="file-preview">
                  <div className="file-preview-header">
                    <span>
                      {attachment.type === 'image' ? <Image size={14} /> : <FileText size={14} />}
                      &nbsp;{attachment.file.name}
                    </span>
                    <span className="file-preview-meta">
                      {(attachment.file.size / 1024).toFixed(1)} KB · {attachment.type.toUpperCase()}
                    </span>
                  </div>
                  {attachment.type === 'image' && attachment.dataUrl && (
                    <img src={attachment.dataUrl} alt="Preview" className="file-preview-image" />
                  )}
                  {attachment.type === 'pdf' && (
                    <div className="file-preview-pdf">
                      <FileText size={28} color="#38bdf8" />
                      <span>PDF loaded — {(attachment.file.size / 1024).toFixed(0)} KB</span>
                      {isVisionProvider
                        ? <span className="badge-ok">Will be sent as native document ✓</span>
                        : <span className="badge-warn">Switch to Claude/OpenAI/Gemini to use PDF</span>}
                    </div>
                  )}
                  {attachment.type === 'text' && attachment.textContent && (
                    <pre className="file-preview-content">
                      {attachment.textContent.slice(0, 500)}
                      {attachment.textContent.length > 500 ? `\n\n... (+${attachment.textContent.length - 500} more chars)` : ''}
                    </pre>
                  )}
                </div>
              )}
              {!attachment && (
                <p className="hint-text">Upload PRD, logs, screenshots, or PDF to prevent hallucination.</p>
              )}
            </div>

          {error && <div className="error-message">{error}</div>}
          <button
            className="generate-btn"
            onClick={handleGenerate}
            disabled={loading || !jiraId || !requirement}
          >
            {loading ? <Loader2 size={18} className="spinner" /> : <Sparkles size={18} />}
            {loading ? 'Generating...' : 'Generate Test Cases'}
          </button>
        </main>

        {/* ── Right: Results Panel ── */}
        <aside className="results-panel">
          <div className="results-header">
            <div className="tab-bar">
              <button className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
                Generated Test Cases
                {results.length > 0 && <span className="tab-count">{results.length}</span>}
              </button>
              <button
                className={`tab-btn ${activeTab === 'validation' ? 'active' : ''}`}
                onClick={() => setActiveTab('validation')}
                disabled={results.length === 0}
              >
                <ShieldCheck size={14} />
                Validation Score
                {results.length > 0 && (
                  <span className={`tab-count ${overallScore >= 70 ? 'pass' : overallScore >= 40 ? 'warn' : 'fail'}`}>
                    {overallScore}%
                  </span>
                )}
              </button>
              <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
                <Clock size={14} />
                History
                {history.length > 0 && <span className="tab-count">{history.length}</span>}
              </button>
            </div>
            {activeTab === 'results' && results.length > 0 && (
              <button className="copy-btn" onClick={handleCopyTable}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'Copied!' : 'Copy Table'}
              </button>
            )}
          </div>

          {/* ─── Scrollable content area ─── */}
          <div className="results-scroll-area">

          {/* ─── Empty / Loading ─── */}
          {!envelope && !loading && activeTab !== 'history' && (
            <div className="empty-state">
              <p>Enter a Jira ID and requirement, then click generate.</p>
            </div>
          )}
          {loading && (
            <div className="empty-state loading">
              <Loader2 size={32} className="spinner" color="#00d2ff" />
              <p>Verifying facts and writing test cases...</p>
            </div>
          )}

          {/* ─── Results Tab ─── */}
          {!loading && activeTab === 'results' && envelope && (
            <>
              {envelope.verifiedFacts.length > 0 && (
                <div className="anti-hallucination-panel">
                  <div className="fact-box">
                    <h4>✅ Verified Facts Used</h4>
                    <ul>{envelope.verifiedFacts.map((f, i) => <li key={i}>{f}</li>)}</ul>
                  </div>
                  {envelope.missingInformation.length > 0 && (
                    <div className="fact-box missing">
                      <h4>⚠️ Missing Information</h4>
                      <ul>{envelope.missingInformation.map((m, i) => <li key={i}>{m}</li>)}</ul>
                    </div>
                  )}
                  {envelope.selfValidationCheck && (
                    <div className="fact-box validation">
                      <h4>🛡️ Self-Validation Audit</h4>
                      <p>{envelope.selfValidationCheck}</p>
                    </div>
                  )}
                </div>
              )}

              {results.length > 0 ? (
                <>
                  <div className="table-wrapper">
                    <table className="results-table">
                      <thead>
                        <tr>
                          <th>Test ID</th><th>Jira ID</th><th>Type</th>
                          <th>Description</th><th>Expected Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagedResults.map((tc, i) => (
                          <tr key={i}>
                            <td>{tc.id}</td>
                            <td><span className="badge">{tc.jiraId}</span></td>
                            <td>
                              <span className={`type-badge ${tc.type.toLowerCase().includes('non') ? 'non-func' : 'func'}`}>
                                {tc.type}
                              </span>
                            </td>
                            <td>{tc.description}</td>
                            <td>{tc.expected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* ─── Pagination ─── */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button
                        className="page-btn"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="page-info">
                        Page {currentPage} of {totalPages}
                        <span className="page-total"> ({results.length} total)</span>
                      </span>
                      <button
                        className="page-btn"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <p>The LLM returned a response but no test cases were extracted. Try a different provider.</p>
                </div>
              )}
            </>
          )}

          {/* ─── Validation Tab ─── */}
          {!loading && activeTab === 'validation' && validationResults.length > 0 && (
            <div className="validation-panel">
              <div className="score-card">
                <div className="score-circle-wrapper">
                  <div className={`score-circle ${overallScore >= 70 ? 'pass' : overallScore >= 40 ? 'warn' : 'fail'}`}>
                    <span className="score-number">{overallScore}</span>
                    <span className="score-label">/ 100</span>
                  </div>
                </div>
                <div className="score-breakdown">
                  <h3>Overall Traceability Score</h3>
                  <p>Measures how well each test case traces back to facts extracted from your requirement.</p>
                  <div className="score-summary">
                    <span className="pill pass">✅ PASS: {passCount}</span>
                    <span className="pill warn">⚠️ WARN: {warnCount}</span>
                    <span className="pill fail">❌ FAIL: {failCount}</span>
                  </div>
                </div>
              </div>
              <div className="table-wrapper">
                <table className="results-table">
                  <thead>
                    <tr><th>ID</th><th>Status</th><th>Score</th><th>Linked Facts</th><th>Issue</th></tr>
                  </thead>
                  <tbody>
                    {validationResults.map((vr, i) => (
                      <tr key={i} className={`validation-row ${vr.status.toLowerCase()}`}>
                        <td><span className="badge">{vr.testCaseId}</span></td>
                        <td>
                          <span className={`type-badge ${vr.status === 'PASS' ? 'func' : vr.status === 'WARN' ? 'warn-badge' : 'non-func'}`}>
                            {vr.status === 'PASS' ? '✅ PASS' : vr.status === 'WARN' ? '⚠️ WARN' : '❌ FAIL'}
                          </span>
                        </td>
                        <td>
                          <div className="score-bar-wrapper">
                            <div className={`score-bar ${vr.score >= 70 ? 'pass' : vr.score >= 40 ? 'warn' : 'fail'}`} style={{ width: `${vr.score}%` }} />
                            <span>{vr.score}%</span>
                          </div>
                        </td>
                        <td className="linked-facts-cell">
                          {vr.matchedFacts.length > 0
                            ? <ul>{vr.matchedFacts.map((f, j) => <li key={j}>{f}</li>)}</ul>
                            : <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>No facts matched</span>}
                        </td>
                        <td style={{ color: vr.status === 'PASS' ? '#4ade80' : '#fbbf24', fontSize: '0.85rem' }}>
                          {vr.status === 'PASS' ? 'Traceable ✓' : vr.unlinkedReason}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ─── History Tab ─── */}
          {!loading && activeTab === 'history' && (
            <div className="history-panel">
              {history.length === 0 ? (
                <div className="empty-state">
                  <p>No generations yet this session. Run a generation to start tracking history.</p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="results-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Jira ID</th>
                        <th>Provider</th>
                        <th>Requirement</th>
                        <th>Test Cases</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((entry) => (
                        <tr key={entry.id}>
                          <td className="history-time">{entry.timestamp}</td>
                          <td><span className="badge">{entry.jiraId}</span></td>
                          <td>
                            <span className="type-badge func">{entry.provider}</span>
                          </td>
                          <td className="history-req">{entry.requirement}{entry.requirement.length >= 100 ? '...' : ''}</td>
                          <td>
                            <span className="tab-count">{entry.envelope.testCases.length}</span>
                          </td>
                          <td>
                            <button className="load-btn" onClick={() => loadHistoryEntry(entry)}>
                              Load
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
          </div>{/* end results-scroll-area */}
        </aside>

      </div>
    </div>
  );
}

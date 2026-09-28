/**
 * llmService.js
 * -----------------
 * All LLM calls go through this file (Google Gemini — free tier available at
 * aistudio.google.com). Two jobs:
 *
 *  1. assessNovelty()         — compares a proposal against known past projects and
 *                               returns a structured, explainable JSON verdict.
 *  2. extractProposalFields() — reads an uploaded proposal and pulls out title,
 *                               institution, budget (in ₹ lakhs) and duration (months)
 *                               so the form can be pre-filled.
 *
 * WHY structured JSON: judges will ask "how does it decide novelty?" — a score with
 * overlap %, closest match and reasoning is explainable, not a black box.
 */

const PAST_PROPOSALS_REFERENCE = require('../db/pastProposalsReference');

const MAX_PROPOSAL_CHARS = 20000; // keep prompts small for very long documents
const ATTEMPT_TIMEOUT_MS = 25000; // give up on a slow model after 25s
const COOLDOWN_MS = 3 * 60 * 1000; // skip a busy model for 3 minutes
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// model -> timestamp until which we skip it (busy / rate-limited / retired)
const cooldownUntil = new Map();

function friendlyError(status, body) {
  if (status === 429) return 'Gemini free-tier rate limit reached — wait a minute and try again.';
  if (status === 503 || status === 502 || status === 500 || status === 504) {
    return 'Gemini is overloaded right now (a temporary Google-side issue) — try again in a minute.';
  }
  if (status === 400 || status === 403) return `Gemini rejected the request (${status}) — check GEMINI_API_KEY in .env. ${String(body).slice(0, 120)}`;
  if (status === 404) return 'Gemini model not found (it may be retired) — check GEMINI_MODEL / GEMINI_FALLBACK_MODELS in .env.';
  return `Gemini API error ${status}: ${String(body).slice(0, 150)}`;
}

/**
 * Keep "thinking" low: this app only needs a short JSON answer.
 * Per Google's docs: Flash-Lite defaults to minimal thinking (and rejects medium/high),
 * 3.x Flash defaults to medium and rejects "minimal" — so we ask Flash for "low".
 */
function thinkingFor(model) {
  if (/flash-lite/.test(model)) return undefined; // default is already minimal
  if (/^gemini-3/.test(model)) return { thinkingLevel: 'low' };
  return undefined;
}

function buildBody(model, systemPrompt, userPrompt, withThinking = true) {
  const generationConfig = { maxOutputTokens: 2048, temperature: 0.3, responseMimeType: 'application/json' };
  const thinking = withThinking ? thinkingFor(model) : undefined;
  if (thinking) generationConfig.thinkingConfig = thinking;
  return JSON.stringify({
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig
  });
}

/** Single request to one model. Throws an Error with .status and .retryable. */
async function requestModel(model, apiKey, body) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body,
      signal: AbortSignal.timeout(ATTEMPT_TIMEOUT_MS)
    });
  } catch (netErr) {
    const timedOut = netErr.name === 'TimeoutError';
    throw Object.assign(new Error(timedOut ? `Gemini (${model}) took too long to answer.` : `Could not reach Gemini (${netErr.message}).`), {
      status: timedOut ? 504 : 0,
      retryable: true
    });
  }
  if (response.ok) return response.json();
  const text = await response.text();
  throw Object.assign(new Error(friendlyError(response.status, text)), {
    status: response.status,
    retryable: [429, 500, 502, 503, 504].includes(response.status),
    thinkingRejected: response.status === 400 && /thinking/i.test(text)
  });
}

/**
 * Model order: GEMINI_MODEL first, then GEMINI_FALLBACK_MODELS (comma-separated).
 * Defaults (Sept 2026): fast Flash-Lite first, bigger Flash models as backup.
 * Older ids such as the 2.5 family return 404 for new API keys and are skipped.
 */
function modelChain() {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS || 'gemini-3.6-flash,gemini-3.8-flash')
    .split(',').map((m) => m.trim()).filter(Boolean);
  return [...new Set([primary, ...fallbacks])];
}

/**
 * Shared Gemini call. Walks the model chain, moving on IMMEDIATELY when a model
 * is busy (5xx/429/timeout) or retired (404) instead of waiting on it. Busy models
 * are skipped for a few minutes. Only if every model fails do we wait and retry once.
 */
async function callGeminiJson(systemPrompt, userPrompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in your .env file');
  }

  const now = Date.now();
  const chain = modelChain();
  const available = chain.filter((m) => (cooldownUntil.get(m) || 0) <= now);
  const order = available.length ? available : chain; // if all are cooling down, try anyway

  let data;
  let lastErr;
  for (let round = 0; round < 2 && !data; round++) {
    if (round === 1) {
      if (!lastErr?.retryable) break;
      await sleep(3000); // everything was busy — one short pause, then one more pass
    }
    for (const model of order) {
      const started = Date.now();
      try {
        try {
          data = await requestModel(model, apiKey, buildBody(model, systemPrompt, userPrompt));
        } catch (err) {
          if (!err.thinkingRejected) throw err;
          // Model didn't accept our thinking setting — retry once without it
          data = await requestModel(model, apiKey, buildBody(model, systemPrompt, userPrompt, false));
        }
        cooldownUntil.delete(model);
        console.log(`[llm] ${model} answered in ${((Date.now() - started) / 1000).toFixed(1)}s`);
        break;
      } catch (err) {
        lastErr = err;
        if (!(err.retryable || err.status === 404)) throw err; // e.g. bad API key — no point trying others
        cooldownUntil.set(model, Date.now() + (err.status === 404 ? 24 * 60 * 60 * 1000 : COOLDOWN_MS));
        console.warn(`[llm] ${model} skipped after ${((Date.now() - started) / 1000).toFixed(1)}s: ${err.message}`);
      }
    }
  }
  if (!data) throw lastErr;

  const candidate = data?.candidates?.[0];
  const rawText = (candidate?.content?.parts || []).map((p) => p.text || '').join('').trim();

  if (!rawText) {
    const reason = data?.promptFeedback?.blockReason || candidate?.finishReason || 'unknown';
    throw new Error(`Gemini returned an empty response (${reason})`);
  }

  const cleaned = rawText.replace(/```json|```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const err = new Error('Model response could not be parsed as JSON');
    err.raw = rawText.slice(0, 200);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// 1. Novelty assessment
// ---------------------------------------------------------------------------
async function assessNovelty(proposalText) {
  const systemPrompt = `You are an expert R&D proposal evaluator for NaCCER (the R&D arm of Coal India Limited).
Your job is to assess the NOVELTY of a submitted research proposal by comparing it against
a reference list of past/known funded projects in the coal sector.

Reference list of past/existing projects:
${PAST_PROPOSALS_REFERENCE.map((p, i) => `${i + 1}. ${p}`).join('\n')}

Respond with ONLY a raw JSON object (no markdown fences, no preamble) in exactly this shape:
{
  "novelty_score": <integer 1-10, where 10 = completely novel, 1 = near-duplicate of an existing project>,
  "closest_match": "<name/description of the most similar past project, or 'None' if fully novel>",
  "overlap_percentage": <integer 0-100, estimated conceptual overlap with the closest match>,
  "reasoning": "<2-3 sentence explanation of why this score was given>"
}

In "reasoning", refer to reference projects by a short description of their topic
(e.g. "the stockpile thermal-imaging project"), never by list number.`;

  try {
    return await callGeminiJson(
      systemPrompt,
      `Evaluate this proposal:\n\n${proposalText.slice(0, MAX_PROPOSAL_CHARS)}`
    );
  } catch (e) {
    if (e.raw !== undefined) {
      // Parsing failed — return a neutral fallback so the demo never crashes
      return {
        novelty_score: 5,
        closest_match: 'Unable to parse',
        overlap_percentage: 50,
        reasoning: 'The model response could not be parsed as JSON. Raw response: ' + e.raw
      };
    }
    throw e;
  }
}

// ---------------------------------------------------------------------------
// 2. Field extraction from an uploaded proposal
// ---------------------------------------------------------------------------
async function extractProposalFields(proposalText) {
  const systemPrompt = `You extract structured fields from an R&D project proposal document.

Respond with ONLY a raw JSON object (no markdown fences) in exactly this shape:
{
  "title": "<project title, or null if not found>",
  "proposer": "<proposing institution/organization, or null if not found>",
  "budget_lakhs": <total requested budget as a NUMBER in Indian rupees LAKHS, or null if not stated>,
  "duration_months": <project duration as a NUMBER of months, or null if not stated>
}

Rules:
- Convert budgets to LAKHS: 1 crore = 100 lakhs; ₹1,00,000 = 1 lakh; ₹50,00,000 = 50 lakhs; ₹5,00,00,000 = 500 lakhs.
- If several budget figures appear, use the TOTAL project cost (not yearly or per-item amounts).
- Convert durations to months: 2 years = 24 months.
- Never guess. If a value is not clearly stated in the document, use null.`;

  const result = await callGeminiJson(
    systemPrompt,
    `Extract the fields from this proposal:\n\n${proposalText.slice(0, MAX_PROPOSAL_CHARS)}`
  );

  const toNumber = (v) => (typeof v === 'number' && isFinite(v) && v > 0 ? v : null);
  return {
    title: typeof result.title === 'string' ? result.title : null,
    proposer: typeof result.proposer === 'string' ? result.proposer : null,
    budget_lakhs: toNumber(result.budget_lakhs),
    duration_months: toNumber(result.duration_months)
  };
}

module.exports = { assessNovelty, extractProposalFields };

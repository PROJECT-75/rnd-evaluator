/**
 * fieldExtractor.js
 * -----------------
 * Rule-based (no AI) backup for pulling title / institution / budget / duration
 * out of a proposal's text. Used when Gemini is unavailable, and to fill any
 * field Gemini leaves empty — so auto-fill still works during a live demo even
 * if Google's API is overloaded.
 */

// Labels that commonly start a new field in a proposal form — used to know
// where a multi-line title or institution name ends.
const LABELS = [
  'project title', 'title of the project', 'title', 'proposing institution', 'institution',
  'organisation', 'organization', 'principal investigator', 'co-investigator', 'implementing agency',
  'total project cost', 'project cost', 'total cost', 'total budget', 'budget', 'project duration',
  'duration', 'abstract', 'summary', 'background', 'introduction', 'objectives', 'executive summary'
];
const LABEL_RE = new RegExp(`^\\s*(?:\\d+\\.\\s*)?(?:${LABELS.map((l) => l.replace(/[-\s]/g, '[-\\s]')).join('|')})\\b`, 'i');

function clean(s) {
  return s.replace(/\s+/g, ' ').replace(/^[\s:–—-]+|[\s:.]+$/g, '').trim();
}

/**
 * Value after a label. Handles three layouts:
 *   "Project Title: X"                    (same line)
 *   "Project Title X\n...wrapped rest"    (PDF tables: value wraps onto short follow-up lines)
 *   "Project Title\n\nX"                  (DOCX tables: each cell on its own paragraph)
 * Continuation lines are only accepted if they look like a wrapped fragment
 * (short, no full stop) — so a following sentence isn't swallowed.
 */
function valueAfterLabel(lines, labelRe, { maxWrapLen = 60 } = {}) {
  const isFragment = (l) => l && !LABEL_RE.test(l) && l.length <= maxWrapLen && !/[.!?]$/.test(l);

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(labelRe);
    if (!m || m.index > 3) continue; // label must start the line
    let first = lines[i].slice(m.index + m[0].length).trim();
    let j = i + 1;

    // Value not on the label line → take the next non-empty line (DOCX layout)
    if (!first) {
      while (j < lines.length && !lines[j]) j++;
      if (j >= lines.length || LABEL_RE.test(lines[j])) continue;
      first = lines[j];
      j++;
    }

    const parts = [first];
    for (let k = 0; k < 3 && j < lines.length && isFragment(lines[j]); k++, j++) parts.push(lines[j]);

    const value = clean(parts.join(' '));
    if (value.length >= 3 && value.length <= 250) return value;
  }
  return null;
}

/** Next non-empty line after index i (budget figures often sit in the next table cell). */
function nextNonEmpty(lines, i) {
  for (let j = i + 1; j < lines.length && j <= i + 3; j++) if (lines[j]) return lines[j];
  return null;
}

/** Parse an amount like "85,00,000", "1.25 crore", "85 lakh" into lakhs. */
function amountToLakhs(str) {
  const crore = str.match(/(\d+(?:\.\d+)?)\s*(?:crores?|cr\b)/i);
  if (crore) return +(parseFloat(crore[1]) * 100).toFixed(2);

  const lakh = str.match(/(\d+(?:\.\d+)?)\s*(?:lakhs?|lacs?|lakh\b|l\b)/i);
  if (lakh) return parseFloat(lakh[1]);

  // Plain rupee figure, Indian (85,00,000) or western (8,500,000) grouping
  const rupees = str.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d+)?)/i) || str.match(/\b(\d{1,3}(?:,\d{2,3})+(?:\.\d+)?)\b/);
  if (rupees) {
    const value = parseFloat(rupees[1].replace(/,/g, ''));
    if (value >= 10000) return +(value / 100000).toFixed(2);
  }
  return null;
}

function findBudget(lines) {
  // Prefer lines that talk about the TOTAL cost, then any budget/cost line.
  const priorities = [
    /total\s+(?:project\s+)?(?:cost|budget|outlay)|project\s+cost|budget\s+requested|amount\s+requested/i,
    /\b(?:budget|cost|outlay|funding)\b/i
  ];
  for (const re of priorities) {
    for (let i = 0; i < lines.length; i++) {
      if (!re.test(lines[i])) continue;
      // amount may be on the same line or the next one (PDF tables often split)
      const next = nextNonEmpty(lines, i);
      const lakhs = amountToLakhs(lines[i]) ?? (next ? amountToLakhs(next) : null);
      if (lakhs && lakhs > 0) return lakhs;
    }
  }
  return null;
}

function findDuration(text) {
  const flat = text.replace(/\s+/g, ' ');
  const m = flat.match(/(?:duration|period|timeline|tenure)[^.]{0,40}?(\d+(?:\.\d+)?)\s*(months?|years?|yrs?)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return /^y/i.test(m[2]) ? Math.round(n * 12) : n;
}

function extractFieldsLocally(text) {
  const lines = text.split('\n').map((l) => l.trim());
  return {
    title: valueAfterLabel(lines, /(?:project\s+title|title\s+of\s+the\s+project|^\s*title)\s*[:\-–]?/i),
    proposer: valueAfterLabel(lines, /(?:proposing\s+institution|institution|organi[sz]ation)\s*[:\-–]?/i, { maxWrapLen: 30 }),
    budget_lakhs: findBudget(lines),
    duration_months: findDuration(text)
  };
}

module.exports = { extractFieldsLocally, amountToLakhs };

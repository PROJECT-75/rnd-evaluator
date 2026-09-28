/**
 * keywordSimilarity.js
 * --------------------
 * Deterministic (no AI) novelty check: cosine similarity between the proposal's
 * keywords and each reference project. Used as a backup when Gemini is
 * unavailable, so an evaluation never fails during a demo.
 */
const REFERENCE = require('../db/pastProposalsReference');

const STOPWORDS = new Set(`a an the and or of for to in on at by with from into over under using use used based
this that these those is are was were be been will would can could should may might it its their our we you
project proposal proposes propose proposed system systems study development develop new approach method methods
also such than then which who whom whose what when where how all any each other more most very through via per`.split(/\s+/));

function tokens(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .map((w) => (w.length > 4 && /ies$/.test(w) ? w.slice(0, -3) + 'y'
      : w.length > 4 && /[^su]s$/.test(w) && !/(ous|is)$/.test(w) ? w.slice(0, -1) : w)); // light plural stemming
}

function vector(words) {
  const v = new Map();
  for (const w of words) v.set(w, (v.get(w) || 0) + 1);
  return v;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  for (const [, x] of a) na += x * x;
  for (const [, y] of b) nb += y * y;
  for (const [k, x] of a) if (b.has(k)) dot += x * b.get(k);
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function keywordNovelty(proposalText) {
  // Reference entries are short, so compare against a binary keyword set of the proposal
  const proposalSet = new Map([...new Set(tokens(proposalText))].map((w) => [w, 1]));
  let best = { match: 'None', sim: 0, shared: [] };

  for (const ref of REFERENCE) {
    const refVec = vector(tokens(ref));
    const sim = cosine(proposalSet, refVec);
    if (sim > best.sim) {
      best = { match: ref, sim, shared: [...refVec.keys()].filter((k) => proposalSet.has(k)) };
    }
  }

  // Map similarity (0..~0.6) onto a 1-10 novelty score: more overlap → less novel
  const overlap = Math.min(100, Math.round(best.sim * 160));
  const novelty = Math.max(1, Math.min(10, Math.round(10 - overlap / 11)));

  return {
    novelty_score: novelty,
    closest_match: best.sim > 0.05 ? best.match : 'None',
    overlap_percentage: overlap,
    reasoning:
      best.sim > 0.05
        ? `Backup keyword check (AI unavailable): shares the keywords "${best.shared.slice(0, 6).join(', ')}" with the closest reference project. Re-run later for a full AI assessment.`
        : 'Backup keyword check (AI unavailable): no significant keyword overlap with any reference project. Re-run later for a full AI assessment.',
    method: 'keyword-backup'
  };
}

module.exports = { keywordNovelty };

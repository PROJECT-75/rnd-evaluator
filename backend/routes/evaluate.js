const express = require('express');
const router = express.Router();
const store = require('../db/store');
const { assessNovelty } = require('../services/llmService');
const { checkFinancials } = require('../services/financialCheck');
const { keywordNovelty } = require('../services/keywordSimilarity');

// Weights for the combined score — tune to what NaCCER cares about most
const NOVELTY_WEIGHT = 0.6;
const FINANCIAL_WEIGHT = 0.4;

// Convert the financial flag into a 0-10 sub-score for combining with novelty
function financialFlagToScore(flag) {
  switch (flag) {
    case 'REASONABLE': return 10;
    case 'OVER_BUDGETED': return 4;
    case 'UNDER_BUDGETED': return 5;
    default: return 5;
  }
}

router.post('/evaluate', async (req, res) => {
  try {
    const { title, proposer, proposalText, requestedBudgetLakhs, durationMonths } = req.body;

    if (!title || !proposalText) {
      return res.status(400).json({ error: 'title and proposalText are required' });
    }

    // 1. Novelty check via LLM — if Gemini is down, use the deterministic keyword
    //    backup so the evaluation still completes (clearly labelled in the UI)
    let novelty;
    try {
      novelty = { ...(await assessNovelty(proposalText)), method: 'ai' };
    } catch (llmErr) {
      console.warn('[evaluate] Gemini unavailable, using keyword backup:', llmErr.message);
      novelty = { ...keywordNovelty(proposalText), aiError: llmErr.message };
    }

    // 2. Financial sanity check (rule-based, deterministic)
    const financial = checkFinancials(Number(requestedBudgetLakhs), Number(durationMonths));

    // 3. Combine into an overall score (0-10 scale)
    const noveltySubScore = novelty.novelty_score || 5;
    const financialSubScore = financialFlagToScore(financial.flag);
    const overallScore = (
      noveltySubScore * NOVELTY_WEIGHT +
      financialSubScore * FINANCIAL_WEIGHT
    ).toFixed(1);

    // 4. Save to DB
    const id = store.insert({
      title,
      proposer: proposer || 'Unknown',
      proposal_text: proposalText,
      requested_budget: requestedBudgetLakhs || null,
      scope_summary: `${durationMonths || '?'} months`,
      novelty_score: noveltySubScore,
      novelty_reasoning: novelty.reasoning,
      financial_flag: financial.flag,
      financial_reasoning: financial.reasoning,
      overall_score: Number(overallScore)
    });

    res.json({
      id,
      title,
      novelty,
      financial,
      overallScore: Number(overallScore),
      breakdown: {
        noveltyWeight: NOVELTY_WEIGHT,
        financialWeight: FINANCIAL_WEIGHT,
        noveltySubScore,
        financialSubScore
      }
    });
  } catch (err) {
    console.error('Evaluation error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

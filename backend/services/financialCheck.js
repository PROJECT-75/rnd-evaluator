/**
 * financialCheck.js
 * -----------------
 * Deterministic, rule-based budget sanity check — intentionally NOT an LLM call.
 * Judges will ask "how do you verify the budget is reasonable?" and "the LLM
 * decided" is a weak answer. A transparent rule is easier to defend.
 *
 * The benchmark ranges below are ILLUSTRATIVE demo thresholds, not NaCCER data.
 * A real system would derive them from historical NaCCER funding per category.
 */

const BUDGET_BENCHMARKS = {
  small: { maxMonths: 12, minLakhs: 5, maxLakhs: 40 },
  medium: { maxMonths: 24, minLakhs: 30, maxLakhs: 120 },
  large: { maxMonths: 48, minLakhs: 100, maxLakhs: 400 }
};

function classifyScale(durationMonths) {
  if (durationMonths <= BUDGET_BENCHMARKS.small.maxMonths) return 'small';
  if (durationMonths <= BUDGET_BENCHMARKS.medium.maxMonths) return 'medium';
  return 'large';
}

function checkFinancials(requestedBudgetLakhs, durationMonths) {
  if (!requestedBudgetLakhs || !durationMonths) {
    return {
      flag: 'INSUFFICIENT_DATA',
      reasoning: 'Budget or duration not clearly specified in the proposal — manual review recommended.',
      expectedRange: 'N/A'
    };
  }

  const scale = classifyScale(durationMonths);
  const benchmark = BUDGET_BENCHMARKS[scale];
  const expectedRange = `₹${benchmark.minLakhs}L - ₹${benchmark.maxLakhs}L`;
  const range = { min: benchmark.minLakhs, max: benchmark.maxLakhs, scale, requested: requestedBudgetLakhs, months: durationMonths };

  if (requestedBudgetLakhs < benchmark.minLakhs) {
    return {
      flag: 'UNDER_BUDGETED',
      range,
      reasoning: `Requested ₹${requestedBudgetLakhs}L is below the typical range (${expectedRange}) for a ${scale}-scale, ${durationMonths}-month project. May indicate an unrealistic scope or missing cost items.`,
      expectedRange
    };
  }

  if (requestedBudgetLakhs > benchmark.maxLakhs) {
    return {
      flag: 'OVER_BUDGETED',
      range,
      reasoning: `Requested ₹${requestedBudgetLakhs}L exceeds the typical range (${expectedRange}) for a ${scale}-scale, ${durationMonths}-month project. Recommend a detailed cost breakdown review.`,
      expectedRange
    };
  }

  return {
    flag: 'REASONABLE',
    range,
    reasoning: `Requested ₹${requestedBudgetLakhs}L falls within the expected range (${expectedRange}) for a ${scale}-scale, ${durationMonths}-month project.`,
    expectedRange
  };
}

module.exports = { checkFinancials };

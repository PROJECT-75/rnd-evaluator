// Shared scoring vocabulary so every screen describes a result the same way.
// Status colours always travel with an icon + a text label (never colour alone).

export const STATUS = {
  good: { dot: 'bg-viz-good', text: 'text-emerald-800', soft: 'bg-emerald-50 border-emerald-200', hex: '#0ca30c' },
  warning: { dot: 'bg-viz-warning', text: 'text-amber-800', soft: 'bg-amber-50 border-amber-200', hex: '#fab219' },
  critical: { dot: 'bg-viz-critical', text: 'text-red-800', soft: 'bg-red-50 border-red-200', hex: '#d03b3b' },
  neutral: { dot: 'bg-slate-400', text: 'text-slate-700', soft: 'bg-slate-50 border-slate-200', hex: '#94a3b8' }
};

export const DUPLICATE_NOVELTY = 3; // novelty at or below this = too close to existing work

export function verdictFor(score, novelty) {
  if (novelty != null && novelty <= DUPLICATE_NOVELTY) {
    return { status: 'critical', label: 'Not recommended — overlaps existing work', short: 'Duplicate risk', icon: 'x', gated: true };
  }
  if (score >= 7.5) return { status: 'good', label: 'Recommended for funding', short: 'Recommended', icon: 'check' };
  if (score >= 5) return { status: 'warning', label: 'Consider with revisions', short: 'Revise', icon: 'alert' };
  return { status: 'critical', label: 'Not recommended', short: 'Not recommended', icon: 'x' };
}

export const BUDGET_FLAGS = {
  REASONABLE: { status: 'good', label: 'Within range', icon: 'check' },
  UNDER_BUDGETED: { status: 'warning', label: 'Under-budgeted', icon: 'alert' },
  OVER_BUDGETED: { status: 'critical', label: 'Over-budgeted', icon: 'x' },
  INSUFFICIENT_DATA: { status: 'neutral', label: 'Insufficient data', icon: 'minus' }
};

export const FLAG_SCORE = { REASONABLE: 10, UNDER_BUDGETED: 5, OVER_BUDGETED: 4, INSUFFICIENT_DATA: 5 };

export const formatLakhs = (v) => {
  const n = Number(v);
  if (!isFinite(n)) return '—';
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}L`; // lakhs everywhere, matching the form
};

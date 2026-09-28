import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { verdictFor, BUDGET_FLAGS, STATUS, formatLakhs } from '../lib/verdict.js';
import { PrintIcon, AlertIcon } from './Icons.jsx';

/** 0-10 meter: fill and track are two steps of the same blue ramp. */
function Meter({ value, max = 10, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="h-2 w-full rounded-full bg-viz-blueTrack"
      role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}
      title={`${label}: ${value} / ${max}`}
    >
      <div className="h-2 rounded-full bg-viz-blue transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

/**
 * Budget range bar: the grey band is the expected range for this project's
 * scale; the marker is the requested amount (off-scale requests are pinned to
 * the edge and labelled). Status colour + icon + label, never colour alone.
 */
function BudgetRangeBar({ range, flag }) {
  if (!range) return null;
  const { min, max, requested } = range;
  const axisMax = Math.max(max * 1.6, Math.min(requested, max * 3) * 1.1);
  const offScale = requested > axisMax;
  const pos = (v) => `${Math.max(0, Math.min(100, (v / axisMax) * 100))}%`;
  const s = STATUS[BUDGET_FLAGS[flag]?.status || 'neutral'];

  return (
    <div className="mt-4" aria-label={`Requested ${formatLakhs(requested)}; expected ${formatLakhs(min)} to ${formatLakhs(max)}`}>
      <div className="relative h-10">
        <div className="absolute inset-x-0 top-4 h-2 rounded-full bg-slate-100" />
        <div
          className="absolute top-4 h-2 rounded-full bg-slate-300"
          style={{ left: pos(min), width: `calc(${pos(max)} - ${pos(min)})` }}
          title={`Expected range: ${formatLakhs(min)} – ${formatLakhs(max)}`}
        />
        <div className="absolute top-0 -translate-x-1/2 flex flex-col items-center" style={{ left: offScale ? '100%' : pos(requested) }}
          title={`Requested: ${formatLakhs(requested)}${offScale ? ' (beyond chart scale)' : ''}`}>
          <span className="h-10 w-[3px] rounded-full ring-2 ring-white" style={{ background: s.hex }} />
        </div>
      </div>
      <div className="relative mt-1 h-4 text-[11px] text-slate-500">
        {min / axisMax > 0.14 && <span className="absolute left-0">₹0</span>}
        <span className="absolute -translate-x-1/2" style={{ left: pos(min) }}>{formatLakhs(min)}</span>
        <span className="absolute -translate-x-1/2" style={{ left: pos(max) }}>{formatLakhs(max)}</span>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="inline-flex items-center gap-1.5"><span className="inline-block h-2 w-4 rounded-full bg-slate-300" /> Expected for a {range.scale}-scale, {range.months}-month project</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block h-3 w-[3px] rounded-full" style={{ background: s.hex }} />
          Requested {formatLakhs(requested)}{offScale && ' (off scale →)'}
        </span>
      </p>
    </div>
  );
}

export default function ScoreDashboard({ result, proposer }) {
  const { title, novelty, financial, overallScore, breakdown } = result;
  const v = verdictFor(overallScore, novelty.novelty_score);
  const flag = BUDGET_FLAGS[financial.flag] || BUDGET_FLAGS.INSUFFICIENT_DATA;
  const isBackup = novelty.method === 'keyword-backup';

  return (
    <article className="card overflow-hidden print-full">
      <header className="border-b border-slate-100 p-6">
        <p className="eyebrow">Evaluation report</p>
        <h2 className="mt-1 text-lg font-semibold leading-snug text-slate-900">{title}</h2>
        {proposer && <p className="mt-0.5 text-sm text-slate-500">{proposer}</p>}

        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Overall recommendation score</p>
            <p className="mt-1 flex items-baseline gap-1">
              <span className="text-6xl font-bold tracking-tight text-slate-900">{overallScore}</span>
              <span className="text-xl font-medium text-slate-400">/ 10</span>
            </p>
          </div>
          <StatusBadge status={v.status} icon={v.icon} size="lg">{v.label}</StatusBadge>
        </div>

        {/* The score maths, spelled out */}
        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
          <span>Novelty <b className="text-slate-900">{breakdown.noveltySubScore}</b> × {breakdown.noveltyWeight * 100}%</span>
          <span className="text-slate-400">+</span>
          <span>Budget <b className="text-slate-900">{breakdown.financialSubScore}</b> × {breakdown.financialWeight * 100}%</span>
          <span className="text-slate-400">=</span>
          <b className="text-slate-900">{overallScore}</b>
        </div>
        {v.gated && (
          <p className="mt-2 text-xs text-red-800">
            Novelty is {novelty.novelty_score}/10 (3 or below), so the proposal is not recommended regardless of budget — it largely repeats existing work.
          </p>
        )}
      </header>

      <div className="grid divide-y divide-slate-100 lg:grid-cols-2 lg:divide-x lg:divide-y-0">
        <section className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900">Novelty</h3>
            <span className="text-sm font-semibold text-slate-900">{novelty.novelty_score}<span className="text-slate-400"> / 10</span></span>
          </div>
          <div className="mt-2"><Meter value={novelty.novelty_score} label="Novelty score" /></div>

          {isBackup && (
            <p className="mt-3 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <AlertIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              AI was busy, so this score comes from the built-in keyword check. Re-run later for the full AI assessment.
            </p>
          )}

          <p className="mt-3 text-sm leading-relaxed text-slate-700">{novelty.reasoning}</p>

          {novelty.closest_match && novelty.closest_match !== 'None' && (
            <div className="mt-4 rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-medium text-slate-500">Closest existing project</p>
              <p className="mt-0.5 text-sm text-slate-800">{novelty.closest_match}</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-slate-100" title={`${novelty.overlap_percentage}% estimated overlap`}>
                  <div className="h-1.5 rounded-full bg-slate-500" style={{ width: `${novelty.overlap_percentage}%` }} />
                </div>
                <span className="text-xs text-slate-600">{novelty.overlap_percentage}% overlap</span>
              </div>
            </div>
          )}
        </section>

        <section className="p-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900">Budget check</h3>
            <StatusBadge status={flag.status} icon={flag.icon}>{flag.label}</StatusBadge>
          </div>
          <BudgetRangeBar range={financial.range} flag={financial.flag} />
          <p className="mt-3 text-sm leading-relaxed text-slate-700">{financial.reasoning}</p>
          <p className="mt-2 text-xs text-slate-500">Rule-based check against scale benchmarks (demo thresholds).</p>
        </section>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-3 no-print">
        <p className="text-xs text-slate-500">A decision-support score — final funding decisions rest with NaCCER reviewers.</p>
        <button type="button" onClick={() => window.print()} className="btn-ghost py-1.5 text-xs">
          <PrintIcon className="h-3.5 w-3.5" /> Print report
        </button>
      </footer>
    </article>
  );
}

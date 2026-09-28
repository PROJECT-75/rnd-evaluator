import React, { useEffect, useState } from 'react';
import StatusBadge from './StatusBadge.jsx';
import { verdictFor, BUDGET_FLAGS, formatLakhs } from '../lib/verdict.js';
import { ChevronIcon, TrashIcon, ChartIcon, SpinnerIcon } from './Icons.jsx';

function StatTile({ label, value, note }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
      {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
    </div>
  );
}

function ScoreCell({ score }) {
  return (
    <div className="flex items-center gap-2" title={`Overall score ${score} / 10`}>
      <div className="h-1.5 w-16 rounded-full bg-viz-blueTrack">
        <div className="h-1.5 rounded-full bg-viz-blue" style={{ width: `${Math.min(100, score * 10)}%` }} />
      </div>
      <span className="font-semibold tabular-nums text-slate-900">{Number(score).toFixed(1)}</span>
    </div>
  );
}

function Details({ p, f }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="eyebrow mb-1">Novelty reasoning · {p.novelty_score}/10</p>
        <p className="text-sm leading-relaxed text-slate-700">{p.novelty_reasoning}</p>
      </div>
      <div>
        <p className="eyebrow mb-1 flex flex-wrap items-center gap-2">Budget <span className="normal-case tracking-normal"><StatusBadge status={f.status} icon={f.icon}>{f.label}</StatusBadge></span></p>
        <p className="text-sm leading-relaxed text-slate-700">{p.financial_reasoning}</p>
        <p className="mt-2 text-xs text-slate-500">
          Requested {formatLakhs(p.requested_budget)} · {p.scope_summary} · evaluated {new Date(String(p.created_at).replace(' ', 'T') + 'Z').toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
        </p>
      </div>
    </div>
  );
}

export default function ProposalList({ onCountChange }) {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/proposals');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load evaluations');
      setProposals(data);
      onCountChange?.(data.length);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function remove(p) {
    if (!window.confirm(`Delete the evaluation for "${p.title}"?`)) return;
    await fetch(`/api/proposals/${p.id}`, { method: 'DELETE' });
    load();
  }

  if (loading) return <p className="flex items-center gap-2 text-sm text-slate-500"><SpinnerIcon /> Loading evaluations…</p>;
  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (proposals.length === 0) {
    return (
      <div className="card flex flex-col items-center px-6 py-14 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500"><ChartIcon className="h-6 w-6" /></span>
        <p className="mt-4 font-medium text-slate-900">No evaluations yet</p>
        <p className="mt-1 max-w-sm text-sm text-slate-500">Evaluate a proposal (or load a sample) and it will appear here, ranked against the others.</p>
      </div>
    );
  }

  const sorted = [...proposals].sort((a, b) => b.overall_score - a.overall_score);
  const avg = sorted.reduce((s, p) => s + p.overall_score, 0) / sorted.length;
  const recommended = sorted.filter((p) => verdictFor(p.overall_score, p.novelty_score).status === 'good').length;
  const flagged = sorted.filter((p) => p.financial_flag === 'OVER_BUDGETED' || p.financial_flag === 'UNDER_BUDGETED').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Proposals evaluated" value={sorted.length} />
        <StatTile label="Average score" value={avg.toFixed(1)} note="out of 10" />
        <StatTile label="Recommended" value={recommended} note="score 7.5+ and not a duplicate" />
        <StatTile label="Budget flags" value={flagged} note="over or under benchmark" />
      </div>

      <div className="card hidden overflow-x-auto md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 w-12">#</th>
              <th className="px-4 py-3">Proposal</th>
              <th className="hidden px-4 py-3 md:table-cell">Novelty</th>
              <th className="hidden px-4 py-3 md:table-cell">Budget</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Verdict</th>
              <th className="px-4 py-3 w-20"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p, i) => {
              const v = verdictFor(p.overall_score, p.novelty_score);
              const f = BUDGET_FLAGS[p.financial_flag] || BUDGET_FLAGS.INSUFFICIENT_DATA;
              const isOpen = open === p.id;
              return (
                <React.Fragment key={p.id}>
                  <tr className={`border-b border-slate-100 transition hover:bg-slate-50 cursor-pointer ${isOpen ? 'bg-slate-50' : ''}`}
                    onClick={() => setOpen(isOpen ? null : p.id)}>
                    <td className="px-4 py-3 font-semibold tabular-nums text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900 line-clamp-2">{p.title}</p>
                      <p className="text-xs text-slate-500">{p.proposer}</p>
                    </td>
                    <td className="hidden px-4 py-3 tabular-nums text-slate-700 md:table-cell">{p.novelty_score}/10</td>
                    <td className="hidden px-4 py-3 md:table-cell"><StatusBadge status={f.status} icon={f.icon}>{f.label}</StatusBadge></td>
                    <td className="px-4 py-3"><ScoreCell score={p.overall_score} /></td>
                    <td className="px-4 py-3"><StatusBadge status={v.status} icon={v.icon}>{v.short}</StatusBadge></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" onClick={(e) => { e.stopPropagation(); remove(p); }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700" aria-label={`Delete ${p.title}`}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                        <ChevronIcon className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-90' : ''}`} />
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <td />
                      <td colSpan={6} className="px-4 pb-5 pt-1">
                        <Details p={p} f={f} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      {/* Phones: cards instead of a wide table */}
      <ul className="space-y-3 md:hidden">
        {sorted.map((p, i) => {
          const v = verdictFor(p.overall_score, p.novelty_score);
          const f = BUDGET_FLAGS[p.financial_flag] || BUDGET_FLAGS.INSUFFICIENT_DATA;
          const isOpen = open === p.id;
          return (
            <li key={p.id} className="card p-4">
              <button type="button" className="w-full text-left" onClick={() => setOpen(isOpen ? null : p.id)} aria-expanded={isOpen}>
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 text-sm font-semibold tabular-nums text-slate-400">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug text-slate-900">{p.title}</p>
                    <p className="text-xs text-slate-500">{p.proposer}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <ScoreCell score={p.overall_score} />
                      <StatusBadge status={v.status} icon={v.icon}>{v.short}</StatusBadge>
                    </div>
                  </div>
                  <ChevronIcon className={`mt-1 h-4 w-4 shrink-0 text-slate-400 transition ${isOpen ? 'rotate-90' : ''}`} />
                </div>
              </button>
              {isOpen && (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <Details p={p} f={f} />
                  <button type="button" onClick={() => remove(p)} className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-red-700">
                    <TrashIcon className="h-3.5 w-3.5" /> Delete evaluation
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-slate-500">Ranked by overall score. Click an entry to see the reasoning.</p>
    </div>
  );
}

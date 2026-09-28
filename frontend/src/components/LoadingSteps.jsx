import React, { useEffect, useState } from 'react';
import { CheckIcon, SpinnerIcon } from './Icons.jsx';

const STEPS = [
  'Reading the proposal',
  'Comparing against 30 reference projects',
  'Checking budget against benchmarks',
  'Computing the recommendation score'
];

// Visual progress while the backend works. The last step keeps spinning until
// the real result arrives, so we never claim to be done early.
export default function LoadingSteps() {
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActive((a) => Math.min(a + 1, STEPS.length - 1)), 1100);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card p-6" role="status" aria-live="polite">
      <p className="eyebrow mb-4">Evaluating</p>
      <ol className="space-y-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex items-center gap-3 text-sm">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
              i < active ? 'bg-emerald-600 text-white' : i === active ? 'bg-ink-950 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
              {i < active ? <CheckIcon className="h-3.5 w-3.5" strokeWidth="3" /> : i === active ? <SpinnerIcon className="h-3.5 w-3.5" /> : <span className="text-xs">{i + 1}</span>}
            </span>
            <span className={i <= active ? 'text-slate-800' : 'text-slate-400'}>{s}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

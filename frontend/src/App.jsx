import React, { useEffect, useRef, useState } from 'react';
import UploadForm from './components/UploadForm.jsx';
import ScoreDashboard from './components/ScoreDashboard.jsx';
import ProposalList from './components/ProposalList.jsx';
import ReferenceList from './components/ReferenceList.jsx';
import LoadingSteps from './components/LoadingSteps.jsx';
import { Logo, SparkIcon, ChartIcon, DatabaseIcon, AlertIcon } from './components/Icons.jsx';

const EMPTY_FORM = { title: '', proposer: '', budget: '', duration: '', text: '', fileName: null, uploadInfo: null };

const TABS = [
  { id: 'evaluate', label: 'Evaluate', icon: SparkIcon },
  { id: 'compare', label: 'Compare', icon: ChartIcon },
  { id: 'reference', label: 'Reference database', short: 'Reference', icon: DatabaseIcon }
];

function EmptyResult() {
  return (
    <div className="card flex h-full min-h-[320px] flex-col items-center justify-center px-8 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ember-50 text-ember-600"><SparkIcon className="h-6 w-6" /></span>
      <p className="mt-4 font-medium text-slate-900">Your evaluation report will appear here</p>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Novelty is judged by AI against 30 reference projects; the budget is checked against scale benchmarks.
        Both combine into one explainable score.
      </p>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('evaluate');
  // Form + result live here so switching tabs never loses them
  const [form, setForm] = useState(EMPTY_FORM);
  const [result, setResult] = useState(null);
  const [resultProposer, setResultProposer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(null);
  const [maxUploadMb, setMaxUploadMb] = useState(4);
  const resultRef = useRef(null);

  useEffect(() => {
    fetch('/api/health').then((r) => r.json()).then((h) => h?.maxUploadMb && setMaxUploadMb(h.maxUploadMb)).catch(() => {});
    fetch('/api/proposals').then((r) => r.json()).then((d) => Array.isArray(d) && setCount(d.length)).catch(() => {});
  }, []);

  async function handleEvaluate(payload) {
    setLoading(true);
    setError(null);
    setResult(null);
    // On phones the report sits below the form — bring it into view
    if (window.innerWidth < 1024) setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({ error: `Server error (HTTP ${res.status}). Please try again.` }));
      if (!res.ok) throw new Error(data.error || 'Evaluation failed');
      setResult(data);
      setResultProposer(payload.proposer);
      setCount((c) => (c ?? 0) + 1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setForm(EMPTY_FORM);
    setResult(null);
    setError(null);
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="bg-ink-950 text-white no-print">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-ember-500 text-white shadow-lift">
              <Logo className="h-5 w-5" strokeWidth="2.2" />
            </span>
            <div>
              <h1 className="text-base font-semibold leading-tight sm:text-lg">R&amp;D Proposal Evaluator</h1>
              <p className="text-xs text-slate-400 sm:text-sm">NaCCER · Ministry of Coal, Government of India</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-white/15 px-2.5 py-1 text-slate-300">SIH25180</span>
            <span className="hidden rounded-full bg-white/10 px-2.5 py-1 text-slate-200 sm:inline">AI-assisted · decision support</span>
          </div>
        </div>

        {/* Tabs */}
        <nav className="mx-auto max-w-6xl px-4 sm:px-6" aria-label="Sections">
          <div className="flex gap-1 overflow-x-auto">
            {TABS.map((t) => {
              const active = tab === t.id;
              const I = t.icon;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)} aria-current={active ? 'page' : undefined}
                  className={`relative inline-flex items-center gap-1.5 whitespace-nowrap px-2.5 py-3 text-sm sm:gap-2 sm:px-3 font-medium transition ${
                    active ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}>
                  <I className="h-4 w-4" />
                  {t.short ? <><span className="sm:hidden">{t.short}</span><span className="hidden sm:inline">{t.label}</span></> : t.label}
                  {t.id === 'compare' && count > 0 && (
                    <span className={`rounded-full px-1.5 text-[11px] font-semibold ${active ? 'bg-ember-500 text-ink-950' : 'bg-white/10 text-slate-300'}`}>{count}</span>
                  )}
                  {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-ember-500" />}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {tab === 'evaluate' && (
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <UploadForm form={form} setForm={setForm} onSubmit={handleEvaluate} onClear={clearAll} loading={loading} maxUploadMb={maxUploadMb} />
            </div>
            <div ref={resultRef} className="scroll-mt-4 lg:col-span-7 print-full">
              <div className="space-y-4">
                {error && (
                  <div role="alert" className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                    <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div><p className="font-medium">Evaluation failed</p><p className="mt-0.5">{error}</p></div>
                  </div>
                )}
                {loading && <LoadingSteps />}
                {result && !loading && <ScoreDashboard result={result} proposer={resultProposer} />}
                {!result && !loading && !error && <EmptyResult />}
              </div>
            </div>
          </div>
        )}
        {tab === 'compare' && <ProposalList onCountChange={setCount} />}
        {tab === 'reference' && <ReferenceList />}
      </main>

      <footer className="border-t border-slate-200 bg-white no-print">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 text-xs text-slate-500 sm:px-6">
          <p>AI-assisted decision support for NaCCER reviewers — scores assist, they don't replace, expert review.</p>
          <p>Reference projects and budget benchmarks are illustrative demo data.</p>
        </div>
      </footer>
    </div>
  );
}

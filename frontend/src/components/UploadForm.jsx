import React, { useState } from 'react';
import { SAMPLES } from '../samples.js';
import { UploadIcon, FileIcon, SparkIcon, SpinnerIcon, RefreshIcon } from './Icons.jsx';

const infoStyles = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  error: 'bg-red-50 border-red-200 text-red-800'
};

function StepLabel({ n, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink-950 text-[11px] font-semibold text-white">{n}</span>
      <span className="text-sm font-semibold text-slate-800">{children}</span>
    </div>
  );
}

/**
 * Controlled form: its values live in App, so switching tabs never loses them.
 */
export default function UploadForm({ form, setForm, onSubmit, onClear, loading }) {
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const busy = uploading || loading;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function handleFile(file) {
    if (!file) return;
    setUploading(true);
    setForm((f) => ({ ...f, uploadInfo: null }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      const fl = data.fields || {};
      const missing = [];
      if (!fl.title) missing.push('title');
      if (!fl.budget_lakhs) missing.push('budget');
      if (!fl.duration_months) missing.push('duration');
      const needs = missing.length
        ? ` Couldn't find: ${missing.join(', ')} — please enter ${missing.length > 1 ? 'them' : 'it'} below.`
        : ' Please check the details below.';

      let info;
      if (data.warning) info = { type: 'warning', text: `Read ${file.name} with the backup reader (AI auto-fill is busy).${needs}` };
      else if (missing.length) info = { type: 'warning', text: `Read ${file.name}.${needs}` };
      else info = { type: 'success', text: `Read ${file.name} — details auto-filled.${needs}` };
      if (data.truncated) info.text += ' Only the first 50,000 characters were loaded.';

      setForm((f) => ({
        ...f,
        text: data.text,
        title: fl.title || f.title,
        proposer: fl.proposer || f.proposer,
        budget: fl.budget_lakhs ? String(fl.budget_lakhs) : f.budget,
        duration: fl.duration_months ? String(fl.duration_months) : f.duration,
        fileName: file.name,
        uploadInfo: info
      }));
    } catch (err) {
      setForm((f) => ({ ...f, uploadInfo: { type: 'error', text: err.message } }));
    } finally {
      setUploading(false);
    }
  }

  function loadSample(id) {
    const s = SAMPLES.find((x) => x.id === id);
    if (!s) return;
    setForm({
      title: s.title, proposer: s.proposer, budget: s.budget, duration: s.duration, text: s.text,
      fileName: null, uploadInfo: { type: 'success', text: `Sample loaded — expected: ${s.expect.toLowerCase()}.` }
    });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      title: form.title.trim(),
      proposer: form.proposer.trim(),
      proposalText: form.text,
      requestedBudgetLakhs: form.budget,
      durationMonths: form.duration
    });
  }

  const hasContent = form.title || form.text || form.budget;

  return (
    <form onSubmit={handleSubmit} className="card p-6 no-print">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Submit a proposal</h2>
          <p className="text-sm text-slate-500 mt-0.5">Upload a document, pick a sample, or type the details.</p>
        </div>
        {hasContent && (
          <button type="button" onClick={onClear} disabled={busy}
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50">
            <RefreshIcon className="h-3.5 w-3.5" /> Clear
          </button>
        )}
      </div>

      {/* Step 1 — source */}
      <StepLabel n={1}>Add the proposal</StepLabel>
      <label
        onDragOver={(e) => { e.preventDefault(); if (!busy) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); if (!busy) handleFile(e.dataTransfer.files?.[0]); }}
        className={`group flex items-center gap-4 rounded-xl border-2 border-dashed px-4 py-4 transition ${
          busy ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${dragging ? 'border-ember-500 bg-ember-50' : 'border-slate-300 bg-slate-50/60 hover:border-slate-400 hover:bg-slate-50'}`}
      >
        <input type="file" accept=".pdf,.docx,.txt" className="hidden" disabled={busy}
          onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-slate-600 shadow-card ring-1 ring-slate-200">
          {uploading ? <SpinnerIcon className="h-5 w-5" /> : form.fileName ? <FileIcon className="h-5 w-5" /> : <UploadIcon className="h-5 w-5" />}
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-medium text-slate-800 truncate">
            {uploading ? 'Reading document…' : form.fileName ? form.fileName : 'Upload proposal document'}
          </span>
          <span className="block text-xs text-slate-500 mt-0.5">
            {form.fileName ? 'Click or drop to replace' : 'PDF, DOCX or TXT · max 10 MB'}
          </span>
        </span>
      </label>

      <div className="mt-3 flex items-center gap-2">
        <SparkIcon className="h-4 w-4 shrink-0 text-ember-600" />
        <select className="input py-1.5 text-sm" value="" disabled={busy} onChange={(e) => loadSample(e.target.value)} aria-label="Load a sample proposal">
          <option value="" disabled>Try a sample proposal…</option>
          {SAMPLES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {form.uploadInfo && (
        <p role="status" className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-relaxed ${infoStyles[form.uploadInfo.type]}`}>
          {form.uploadInfo.text}
        </p>
      )}

      {/* Step 2 — details */}
      <div className="mt-6"><StepLabel n={2}>Check the details</StepLabel></div>
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="title">Project title</label>
          <input id="title" type="text" required value={form.title} onChange={set('title')} className="input"
            placeholder="e.g. AI-based coal seam mapping using satellite imagery" />
        </div>
        <div>
          <label className="label" htmlFor="proposer">Proposing institution</label>
          <input id="proposer" type="text" value={form.proposer} onChange={set('proposer')} className="input" placeholder="e.g. IIT (ISM) Dhanbad" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="budget">Budget <span className="font-normal text-slate-400">(₹ lakhs)</span></label>
            <input id="budget" type="number" step="any" min="0" required value={form.budget} onChange={set('budget')} className="input" placeholder="45" />
          </div>
          <div>
            <label className="label" htmlFor="duration">Duration <span className="font-normal text-slate-400">(months)</span></label>
            <input id="duration" type="number" step="any" min="1" required value={form.duration} onChange={set('duration')} className="input" placeholder="18" />
          </div>
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="label" htmlFor="text">Proposal text / abstract</label>
            {form.text && <span className="text-xs text-slate-400">{form.text.length.toLocaleString('en-IN')} chars</span>}
          </div>
          <textarea id="text" required rows={7} value={form.text} onChange={set('text')} className="input resize-y leading-relaxed"
            placeholder="Paste the proposal abstract or full description…" />
        </div>
      </div>

      {/* Step 3 — run */}
      <div className="mt-6"><StepLabel n={3}>Evaluate</StepLabel></div>
      <button type="submit" disabled={busy} className="btn-primary w-full py-3">
        {loading ? <><SpinnerIcon /> Evaluating…</> : 'Run evaluation'}
      </button>
    </form>
  );
}

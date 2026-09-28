import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon, SpinnerIcon } from './Icons.jsx';

export default function ReferenceList() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    fetch('/api/reference')
      .then((r) => { if (!r.ok) throw new Error('Failed to load the reference database'); return r.json(); })
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const groups = useMemo(() => {
    if (!data) return [];
    const term = q.trim().toLowerCase();
    return data.groups
      .map((g) => ({ ...g, projects: g.projects.filter((p) => !term || p.toLowerCase().includes(term)) }))
      .filter((g) => g.projects.length);
  }, [data, q]);

  if (error) return <p className="text-sm text-red-700">{error}</p>;
  if (!data) return <p className="flex items-center gap-2 text-sm text-slate-500"><SpinnerIcon /> Loading reference database…</p>;

  const shown = groups.reduce((s, g) => s + g.projects.length, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-base font-semibold text-slate-900">Reference project database</h2>
          <p className="mt-1 text-sm text-slate-500">
            Every proposal's novelty is judged against these {data.total} past and existing coal-sector R&amp;D topics.
            The report names the closest match and the estimated overlap.
          </p>
        </div>
        <label className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input pl-9" placeholder="Search topics…" aria-label="Search reference projects" />
        </label>
      </div>

      {shown === 0 ? (
        <p className="card px-6 py-10 text-center text-sm text-slate-500">No reference projects match “{q}”.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {groups.map((g) => (
            <section key={g.category} className="card p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{g.category}</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">{g.projects.length}</span>
              </div>
              <ul className="mt-3 space-y-2">
                {g.projects.map((p) => (
                  <li key={p} className="flex gap-2 text-sm leading-snug text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-300" />{p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-slate-500">Demo reference set — in production this would be loaded from NaCCER's own funded-project records.</p>
    </div>
  );
}

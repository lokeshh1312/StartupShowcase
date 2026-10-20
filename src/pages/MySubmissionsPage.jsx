import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, LoaderCircle } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const statusClasses = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export const MySubmissionsPage = () => {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user) { setLoading(false); return () => { active = false; }; }
    apiRequest('/api/me/submissions')
      .then(({ items: submissions }) => { if (active) setItems(submissions); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  useEffect(() => { if (!user) openAuthModal('login'); }, [user, openAuthModal]);

  return (
    <main className="mx-auto min-h-[65vh] max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-7 flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><ClipboardList className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold text-slate-900">My submissions</h1><p className="text-sm text-slate-500">Track review status for your startup listings.</p></div></div>
      {loading ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading submissions…</div>
        : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
          : items.length ? <div className="space-y-3">{items.map((startup) => <article key={startup.id} className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-semibold text-slate-900">{startup.name}</h2><p className="mt-1 text-sm text-slate-500">{startup.ideaTitle} · {startup.category}</p><p className="mt-1 text-xs text-slate-400">Submitted {new Date(startup.createdAt).toLocaleDateString()}</p></div><span className={`w-fit rounded-full border px-3 py-1 text-xs font-semibold capitalize ${statusClasses[startup.status] || ''}`}>{startup.status}</span></article>)}</div>
            : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="font-semibold text-slate-900">No submissions yet</h2><p className="mt-2 text-sm text-slate-500">Share a startup with the community for review.</p><Link to="/submit" className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Submit a startup</Link></div>}
    </main>
  );
};

import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, CircleAlert, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { apiRequest, jsonBody } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export const AdminPage = () => {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');

  const loadPending = useCallback(async () => {
    try {
      const { items: pending } = await apiRequest('/api/admin/startups?status=pending');
      setItems(pending);
      setError('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (user?.role === 'admin') loadPending(); else setLoading(false); }, [user, loadPending]);
  useEffect(() => { if (!user) openAuthModal('login'); }, [user, openAuthModal]);

  const review = async (startupId, status) => {
    setBusyId(startupId);
    setError('');
    try {
      await apiRequest(`/api/admin/startups/${encodeURIComponent(startupId)}/status`, {
        method: 'PATCH', body: jsonBody({ status }),
      });
      setItems((current) => current.filter((startup) => startup.id !== startupId));
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId('');
    }
  };

  if (loading) return <main className="mx-auto max-w-5xl px-4 py-16 text-sm text-slate-500">Loading review queue…</main>;
  if (user?.role !== 'admin') return <main className="mx-auto min-h-[60vh] max-w-3xl px-4 py-16 text-center"><CircleAlert className="mx-auto h-8 w-8 text-amber-500" /><h1 className="mt-3 text-xl font-bold text-slate-900">Admin access required</h1><p className="mt-2 text-sm text-slate-500">Sign in with an administrator account to review submissions.</p><Link to="/" className="mt-5 inline-block text-sm font-semibold text-blue-600">Back to directory</Link></main>;

  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-blue-600"><ShieldCheck className="h-5 w-5" /></div><div><h1 className="text-2xl font-bold text-slate-900">Submission review</h1><p className="text-sm text-slate-500">Approve listings before they are visible to the public.</p></div></div><Link to="/submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Add a listing</Link></div>
      {error && <p role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {items.length === 0 ? <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="font-semibold text-slate-900">Review queue is clear</h2><p className="mt-2 text-sm text-slate-500">New founder submissions will appear here.</p></div>
        : <div className="space-y-4">{items.map((startup) => <article key={startup.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{startup.category} · {startup.location} · {startup.stage}</p><h2 className="mt-1 text-lg font-bold text-slate-900">{startup.name}</h2><p className="text-sm font-medium text-slate-700">{startup.ideaTitle}</p><p className="mt-2 text-sm leading-relaxed text-slate-600">{startup.description}</p><p className="mt-3 text-xs text-slate-500">Founder: {startup.founder?.name || 'Not provided'} · Submitted {new Date(startup.createdAt).toLocaleDateString()}</p>{startup.websiteUrl && <a href={startup.websiteUrl} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-600">Review website ↗</a>}</div><div className="flex gap-2"><button disabled={busyId === startup.id} onClick={() => review(startup.id, 'rejected')} className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"><X className="h-4 w-4" />Reject</button><button disabled={busyId === startup.id} onClick={() => review(startup.id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{busyId === startup.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Approve</button></div></div></article>)}</div>}
    </main>
  );
};

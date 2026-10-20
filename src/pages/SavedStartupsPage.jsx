import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, LoaderCircle } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { LeaderboardTable } from '../components/startup/LeaderboardTable';
import { useAuth } from '../context/AuthContext';

export const SavedStartupsPage = () => {
  const { user, openAuthModal } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!user) {
      setLoading(false);
      setItems([]);
      return () => { active = false; };
    }
    apiRequest('/api/me/saved')
      .then(({ items: saved }) => { if (active) setItems(saved); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [user]);

  useEffect(() => { if (!user) openAuthModal('login'); }, [user, openAuthModal]);

  return (
    <main className="mx-auto min-h-[65vh] max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-blue-50 p-3 text-blue-600"><Bookmark className="h-5 w-5" /></div>
        <div><h1 className="text-2xl font-bold text-slate-900">Saved startups</h1><p className="text-sm text-slate-500">Startups you’ve bookmarked.</p></div>
      </div>
      {loading ? <div className="flex items-center gap-2 py-12 text-sm text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" />Loading saved startups…</div>
        : error ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
          : items.length ? <LeaderboardTable startups={items} />
            : <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center"><h2 className="font-semibold text-slate-900">No saved startups yet</h2><p className="mt-2 text-sm text-slate-500">Browse the directory and use the bookmark icon to save a startup.</p><Link to="/" className="mt-4 inline-block text-sm font-semibold text-blue-600">Explore startups</Link></div>}
    </main>
  );
};

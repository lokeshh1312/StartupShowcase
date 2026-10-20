import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useStartups } from '../context/StartupsContext';
import { StartupCard } from '../components/startup/StartupCard';
import { User, Mail, Calendar, ShieldCheck, Heart, Bookmark, Rocket, LogOut, Edit3, Check } from 'lucide-react';
import { Link } from 'react-router-dom';

export const UserProfilePage = () => {
  const { user, isLoggedIn, logout, openAuthModal } = useAuth();
  const { startups, savedStartups } = useStartups();

  const [activeTab, setActiveTab] = useState('saved'); // 'saved' | 'upvoted' | 'submissions'
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioText, setBioText] = useState(user?.bio || 'Early-stage tech enthusiast. Exploring local LLMs, developer tools, and spatial interfaces.');

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-center text-teal-400 mx-auto">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-white">Sign In to View Your Profile</h2>
        <p className="text-xs text-slate-400">
          Track your bookmarked startups, upvoted products, and submitted software across sessions.
        </p>
        <button
          onClick={() => openAuthModal('login')}
          className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  // Get upvoted startups
  const upvotedStartups = startups.filter(s => s.isUpvoted);
  // Get user-submitted startups
  const userSubmissions = startups.filter(s => s.isUserSubmitted);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#101625] via-[#0E1321] to-[#0A0D15] border border-slate-800 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          
          <div className="flex items-center gap-5">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-teal-500/40 shadow-xl"
            />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
                  {user.name}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-500/15 text-teal-300 border border-teal-500/30">
                  {user.role}
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                {user.email}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Member since {user.joinedDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
            <button
              onClick={logout}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

        </div>

        {/* Bio Edit */}
        <div className="mt-6 pt-5 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">About</span>
            <button
              onClick={() => setIsEditingBio(!isEditingBio)}
              className="text-xs text-teal-400 hover:underline flex items-center gap-1"
            >
              {isEditingBio ? <Check className="w-3 h-3" /> : <Edit3 className="w-3 h-3" />}
              {isEditingBio ? 'Done' : 'Edit Bio'}
            </button>
          </div>
          {isEditingBio ? (
            <textarea
              rows={2}
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">{bioText}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('saved')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'saved'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved Bookmarks ({savedStartups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('upvoted')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'upvoted'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Heart className="w-3.5 h-3.5" />
          <span>Upvoted Products ({upvotedStartups.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
            activeTab === 'submissions'
              ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          <span>My Submissions ({userSubmissions.length})</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'saved' && (
        <div className="space-y-4">
          {savedStartups.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No saved startups.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedStartups.map(s => <StartupCard key={s.id} startup={s} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'upvoted' && (
        <div className="space-y-4">
          {upvotedStartups.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">No upvoted startups yet. Explore and upvote your favorites!</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {upvotedStartups.map(s => <StartupCard key={s.id} startup={s} />)}
            </div>
          )}
        </div>
      )}

      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {userSubmissions.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
              <p className="text-xs text-slate-400">You haven’t submitted any startups to LaunchSpace yet.</p>
              <Link
                to="/submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
              >
                <Rocket className="w-3.5 h-3.5" />
                <span>Submit Your Startup</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {userSubmissions.map(s => <StartupCard key={s.id} startup={s} />)}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

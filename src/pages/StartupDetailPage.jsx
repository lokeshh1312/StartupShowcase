import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Heart, 
  Bookmark,
  Eye, 
  MapPin, 
  Calendar, 
  Share2, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare, 
  Send,
  Building,
  Award,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useStartups } from '../context/StartupsContext';
import { useAuth } from '../context/AuthContext';
import { StartupLogo } from '../components/common/StartupLogo';
import { CategoryBadge, StageBadge } from '../components/common/Badges';
import { formatMetric } from '../components/startup/LeaderboardTable';

export const StartupDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { toggleLike, toggleSave, startups, commentsMap, addComment, loadStartup } = useStartups();
  const { user } = useAuth();
  const [startup, setStartup] = useState(null);
  const [loadingStartup, setLoadingStartup] = useState(true);

  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoadingStartup(true);
    loadStartup(slug)
      .then((record) => { if (active) setStartup(record); })
      .catch(() => { if (active) setStartup(null); })
      .finally(() => { if (active) setLoadingStartup(false); });
    return () => { active = false; };
  }, [slug, user, loadStartup]);

  if (loadingStartup) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-center text-sm text-slate-500">Loading startup profile…</div>;
  }

  if (!startup) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          🔍
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Startup Not Found</h2>
        <p className="text-slate-500 mb-6">
          The startup you are looking for does not exist or may have been removed.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Leaderboard
        </Link>
      </div>
    );
  }

  const listedStartup = startups.find((item) => item.id === startup.id) || startup;
  const liked = listedStartup.isLiked;
  const saved = listedStartup.isSaved;
  const startupComments = commentsMap[startup.slug] || commentsMap[startup.id] || [];

  // Related startups from same category or month
  const relatedStartups = startups
    .filter(s => s.id !== startup.id && s.category === startup.category)
    .slice(0, 3);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (commentText.trim()) {
      setCommentError('');
      try {
        await addComment(startup.slug, commentText.trim());
        setCommentText('');
      } catch (error) {
        setCommentError(error.message);
      }
    }
  };

  const handleLike = async () => {
    const result = await toggleLike(startup.id);
    if (result) setStartup((current) => ({ ...current, likes: result.likes, isLiked: result.liked }));
  };

  const handleSave = async () => {
    const result = await toggleSave(startup.id);
    if (result) setStartup((current) => ({ ...current, isSaved: result.saved }));
  };

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-24">
      {/* Top Breadcrumb & Navigation */}
      <div className="border-b border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5 text-slate-500" />
              {copied ? 'Copied Link!' : 'Share'}
            </button>

            {startup.websiteUrl && (
              <a
                href={startup.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white transition-colors"
              >
                <span>Visit Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        
        {/* Startup Hero Header Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
          {/* Cover image banner */}
          <div className="relative h-48 sm:h-64 md:h-72 w-full bg-slate-900">
            <img
              src={startup.coverImage || startup.thumbnail}
              alt={startup.name}
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
            
            {/* Rank badge on hero */}
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-slate-900 shadow-sm">
                Rank #{startup.rank || 1} • {startup.monthLabel || 'October 2026'}
              </span>
            </div>
          </div>

          {/* Profile bar */}
          <div className="p-6 sm:p-8 relative">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              
              {/* Left Logo + Titles */}
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white border border-slate-200 shadow-sm p-3 flex items-center justify-center flex-shrink-0 -mt-12 sm:-mt-14 relative z-10">
                  <StartupLogo startup={startup} size="lg" showName={false} />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {startup.name}
                    </h1>
                    <CategoryBadge category={startup.category} />
                    <StageBadge stage={startup.stage} />
                  </div>

                  <p className="text-sm sm:text-base font-medium text-slate-700">
                    {startup.ideaTitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{startup.location}, India</span>
                    </div>
                    <div className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Featured in {startup.monthLabel || 'October 2026'} Leaderboard</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Stats & Like Button */}
              <div className="flex flex-wrap items-center gap-2 self-start">
                <button
                  type="button"
                  onClick={handleSave}
                  aria-label={saved ? 'Remove from saved startups' : 'Save startup'}
                  className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors ${saved ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'}`}
                >
                  <Bookmark className={`h-4 w-4 ${saved ? 'fill-blue-600 text-blue-600' : ''}`} />
                  <span className="sr-only">{saved ? 'Saved' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleLike}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm border transition-all cursor-pointer active:scale-95 shadow-xs ${
                    liked
                      ? 'bg-red-50 border-red-200 text-red-600'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Heart className={`w-4 h-4 ${liked ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                  <span>{formatMetric(listedStartup.likes)} Likes</span>
                </button>

                <div className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-600">
                  <Eye className="w-4 h-4 text-slate-400" />
                  <span>{formatMetric(listedStartup.views)} Views</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main 2-column description */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview & Pitch */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Startup Pitch & Overview
              </h2>
              <p className="text-sm leading-relaxed text-slate-700 font-normal">
                {startup.fullStory || startup.description}
              </p>
            </div>

            {/* Problem & Solution Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-red-100 p-5 shadow-xs space-y-2 bg-gradient-to-br from-red-50/20 to-transparent">
                <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider">
                  The Problem
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {startup.problem || 'Current conventional processes are costly, fragmented, and unavailable to underserved demographics.'}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-emerald-100 p-5 shadow-xs space-y-2 bg-gradient-to-br from-emerald-50/20 to-transparent">
                <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                  The Solution
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {startup.solution || 'A specialized, cost-effective platform built directly around local Indian field conditions and user behaviors.'}
                </p>
              </div>
            </div>

            {/* Key Features */}
            {startup.keyFeatures && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600" />
                  Key Innovations & Features
                </h2>
                <div className="grid grid-cols-1 gap-3">
                  {startup.keyFeatures.map((feat, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs sm:text-sm text-slate-700 font-medium">
                        {feat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Community Feedback & Comments */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-7 shadow-xs space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  Ecosystem Discussion ({startupComments.length})
                </h2>
                <span className="text-xs text-slate-500">Community discussion</span>
              </div>

              {/* Add comment form */}
              <form onSubmit={handleCommentSubmit} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                {user ? <p className="text-xs text-slate-500">Commenting as <strong>{user.name}</strong></p> : <p className="text-xs text-slate-500">Sign in to post a comment.</p>}
                {commentError && <p role="alert" className="text-xs text-red-600">{commentError}</p>}
                <textarea
                  rows={3}
                  placeholder="Share constructive feedback, partnership opportunities, or questions for the founders..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Post Comment
                  </button>
                </div>
              </form>

              {/* Comments list */}
              <div className="space-y-4">
                {startupComments.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-2 text-center">
                    No comments yet. Be the first to share your thoughts on this idea!
                  </p>
                ) : (
                  startupComments.map((cmt) => (
                    <div key={cmt.id} className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-100 bg-white shadow-2xs">
                      <div aria-hidden="true" className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{cmt.author?.slice(0, 1)?.toUpperCase() || '?'}</div>
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900">{cmt.author}</h4>
                          <span className="text-[10px] text-slate-400">{cmt.date}</span>
                        </div>
                        <p className="text-[11px] text-blue-600 font-medium">{cmt.role}</p>
                        <p className="text-xs text-slate-700 font-normal pt-1">
                          {cmt.content}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            
            {/* Founder Spotlight Card */}
            {startup.founder && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Founder Spotlight
                </h3>
                <div className="flex items-center gap-3">
                  {startup.founder.avatar ? <img src={startup.founder.avatar} alt={startup.founder.name} className="h-12 w-12 rounded-full object-cover ring-2 ring-blue-500/20" /> : <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 font-bold text-blue-700">{startup.founder.name?.slice(0, 1)?.toUpperCase() || '?'}</div>}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {startup.founder.name}
                    </h4>
                    <p className="text-xs text-blue-600 font-medium">
                      {startup.founder.role}
                    </p>
                  </div>
                </div>
                {startup.founder.quote && (
                  <blockquote className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic border-l-2 border-blue-600">
                    "{startup.founder.quote}"
                  </blockquote>
                )}
              </div>
            )}

            {/* Traction & Highlights */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Traction & Deployment
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">
                {startup.traction || 'Active pilot phase with target deployment in Tier-2/3 Indian cities.'}
              </p>
            </div>

            {/* Technology Stack */}
            {startup.techStack && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Technology Stack
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {startup.techStack.map((tech, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Related Startups in same Category */}
            {relatedStartups.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Related in {startup.category}
                </h3>
                <div className="space-y-2">
                  {relatedStartups.map((rel) => (
                    <Link
                      key={rel.id}
                      to={`/startup/${rel.slug}`}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 group"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                        <img
                          src={rel.thumbnail}
                          alt={rel.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                          {rel.name}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {rel.ideaTitle}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { STARTUP_JOBS } from '../data/jobs';
import { Briefcase, MapPin, DollarSign, Clock, ArrowRight, X, CheckCircle2, Building, Sparkles } from 'lucide-react';

export const JobsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [applied, setApplied] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');

  const categories = ['All', 'Engineering', 'Design', 'Security', 'Marketing'];

  const filteredJobs = selectedCategory === 'All'
    ? STARTUP_JOBS
    : STARTUP_JOBS.filter(j => j.category === selectedCategory);

  const handleApplySubmit = (e) => {
    e.preventDefault();
    if (!applicantName.trim() || !applicantEmail.includes('@')) {
      setFormError('Please provide your name and a valid email address.');
      return;
    }
    setFormError('');
    setApplied(true);
  };

  const closeApplyModal = () => {
    setSelectedJob(null);
    setApplied(false);
    setApplicantName('');
    setApplicantEmail('');
    setPortfolioUrl('');
    setNote('');
    setFormError('');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="space-y-3 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold">
          <Briefcase className="w-3.5 h-3.5" />
          <span>LaunchSpace Career Board</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif]">
          Join Early-Stage Breakout Startups
        </h1>

        <p className="text-sm text-slate-300 leading-relaxed">
          High-impact founding engineer, product design, and growth roles at high-momentum tech startups featured on LaunchSpace.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors ${
              selectedCategory === cat
                ? 'bg-teal-500 text-slate-950 font-semibold'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Jobs Listings */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="p-6 rounded-2xl bg-[#0E1321] border border-slate-800/80 hover:border-teal-500/30 transition-all space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-bold text-white">{job.title}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-300 border border-teal-500/25">
                    {job.company}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {job.postedDate}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    {job.location}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono text-emerald-400 font-medium">
                    <DollarSign className="w-3.5 h-3.5" />
                    {job.salary}
                  </span>
                  <span>•</span>
                  <span>{job.type}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedJob(job)}
                className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs tracking-tight transition-colors self-start sm:self-auto shrink-0 flex items-center gap-1.5"
              >
                <span>Quick Apply</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {job.description}
            </p>

            {/* Tags & perks */}
            <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-800/60 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {job.tags.map(t => (
                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                    {t}
                  </span>
                ))}
              </div>

              <div className="text-[11px] text-slate-400">
                Perks: {job.benefits[0]}, {job.benefits[1]}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* QUICK APPLY MODAL */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-lg w-full rounded-2xl bg-[#0F1523] border border-slate-800 shadow-2xl p-6 sm:p-7 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">Apply to {selectedJob.title}</h3>
                <p className="text-xs text-teal-400 font-medium">{selectedJob.company}</p>
              </div>
              <button
                onClick={closeApplyModal}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {applied ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-teal-400 mx-auto" />
                <h4 className="font-bold text-white">Application Recorded!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  [Frontend Sandbox]: Application simulated for <strong className="text-teal-300">{applicantName}</strong>. The hiring team at {selectedJob.company} has been simulated as notified.
                </p>
                <button
                  onClick={closeApplyModal}
                  className="px-5 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplySubmit} className="space-y-4">
                {formError && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                    {formError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={applicantName}
                    onChange={(e) => setApplicantName(e.target.value)}
                    placeholder="Alex Vance"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={applicantEmail}
                    onChange={(e) => setApplicantEmail(e.target.value)}
                    placeholder="alex@domain.com"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">GitHub / Portfolio URL</label>
                  <input
                    type="text"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/alexvance"
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Why are you interested? (Optional note)</label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Briefly describe what excites you about this startup..."
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeApplyModal}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs"
                  >
                    Submit Application
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

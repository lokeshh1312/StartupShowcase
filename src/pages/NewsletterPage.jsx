import React, { useState } from 'react';
import { Mail, Check, Sparkles, Send, Bell, ArrowRight, ShieldCheck, Star } from 'lucide-react';

export const NewsletterPage = () => {
  const [email, setEmail] = useState('');
  const [frequency, setFrequency] = useState('weekly');
  const [topics, setTopics] = useState(['ai', 'devtools']);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleTopic = (t) => {
    setTopics(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.includes('@')) {
      setIsSubmitted(true);
    }
  };

  const sampleEditions = [
    {
      issue: 'Issue #142',
      date: 'October 13, 2026',
      title: 'Autonomous Drift Detection & Spatial Canvas Engineering',
      desc: 'How PulseFlow is reducing production regressions, plus 4 new developer tools you should test this week.',
      reads: '48.2k readers'
    },
    {
      issue: 'Issue #141',
      date: 'October 6, 2026',
      title: 'The Rise of On-Device Local LLM Speech Recorders',
      desc: 'Why VoxScribe and local transcription models are replacing cloud meeting bots in enterprise boardrooms.',
      reads: '46.9k readers'
    },
    {
      issue: 'Issue #140',
      date: 'September 29, 2026',
      title: 'Zero-Cold-Start Edge Databases with Beamline',
      desc: 'Deep dive into event-sourcing SQLite runtimes inside Cloudflare Workers and Deno Deploy.',
      reads: '45.1k readers'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold">
          <Mail className="w-3.5 h-3.5" />
          <span>The LaunchSpace Radar</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
          The Early Adopter’s Edge
        </h1>

        <p className="text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
          Join 48,000+ founders, engineers, and tech executives who read LaunchSpace to spot breakthrough early-stage products before the mainstream.
        </p>
      </div>

      {/* Subscription Card */}
      <div className="p-8 sm:p-10 rounded-3xl bg-[#0E1321] border border-slate-800 shadow-2xl space-y-6">
        {isSubmitted ? (
          <div className="text-center py-8 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-lg shadow-teal-500/20">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Subscription Confirmed!</h3>
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              [Mock Simulation]: You are subscribed as <strong className="text-teal-300">{email}</strong>. Look out for the next dispatch on Tuesday morning at 8:00 AM EST.
            </p>
            <button
              onClick={() => { setIsSubmitted(false); setEmail(''); }}
              className="text-xs text-slate-400 hover:text-white underline pt-2"
            >
              Subscribe another email address
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Your Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@foundry.io"
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500 focus:outline-none text-sm text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            {/* Topics checkboxes */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Curate Your Interests:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {[
                  { id: 'ai', label: 'AI & Agents' },
                  { id: 'devtools', label: 'Developer Tools' },
                  { id: 'productivity', label: 'Productivity' },
                  { id: 'security', label: 'Security & Auth' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleTopic(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      topics.includes(item.id)
                        ? 'bg-teal-500/15 border-teal-500/40 text-teal-300 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-teal-500/20 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <span>Subscribe to The Radar</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 text-center">
              <span>● No spam ever</span>
              <span>● One-click unsubscribe</span>
              <span>● Read by engineers at Stripe, Vercel & OpenAI</span>
            </div>
          </form>
        )}
      </div>

      {/* Past Issues Preview */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
          Recent Editions Archive
        </h3>
        <div className="space-y-3">
          {sampleEditions.map((ed) => (
            <div
              key={ed.issue}
              className="p-5 rounded-2xl bg-[#0E1321] border border-slate-800/80 hover:border-slate-700 space-y-1.5 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span className="text-teal-400 font-semibold">{ed.issue}</span>
                <span>{ed.date} • {ed.reads}</span>
              </div>
              <h4 className="text-sm font-semibold text-white">{ed.title}</h4>
              <p className="text-xs text-slate-300">{ed.desc}</p>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

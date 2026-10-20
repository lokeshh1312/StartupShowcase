import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Lightbulb, 
  Trophy, 
  Target, 
  Users, 
  ShieldCheck, 
  TrendingUp, 
  ArrowRight, 
  MapPin, 
  Sparkles,
  HelpCircle,
  Rocket
} from 'lucide-react';

export const AboutPage = () => {
  const pillars = [
    {
      icon: <Trophy className="w-6 h-6 text-amber-500" />,
      title: 'Transparent Monthly Leaderboards',
      desc: 'Explore approved early-stage ideas and products. Community votes and visits help people discover the projects attracting attention.'
    },
    {
      icon: <Target className="w-6 h-6 text-blue-600" />,
      title: 'Bharat & Grassroots Focus',
      desc: 'Spotlighting innovations tackling genuine challenges across agriculture, healthcare, clean energy, education, and rural livelihoods in Indian states.'
    },
    {
      icon: <Users className="w-6 h-6 text-emerald-600" />,
      title: 'Early Adopter & Investor Feedback',
      desc: 'Founders can share their work, while visitors can explore listings, save projects, and leave feedback.'
    }
  ];

  const stages = [
    {
      name: 'Idea Stage',
      badge: 'Idea Stage',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Conceptual blueprint, market problem research, and architectural feasibility models seeking initial feedback and co-founders.'
    },
    {
      name: 'Prototype',
      badge: 'Prototype',
      badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
      description: 'Working lab models, hardware breadboards, or alpha software builds validated with initial test subjects in controlled settings.'
    },
    {
      name: 'MVP (Minimum Viable Product)',
      badge: 'MVP',
      badgeClass: 'bg-blue-50 text-blue-600 border-blue-100',
      description: 'Functional release deployed to early pilot users, demonstrating measurable retention, unit economics, or clinical/field efficacy.'
    }
  ];

  const faqs = [
    {
      q: 'How does the monthly leaderboard ranking work?',
      a: 'Approved startups are grouped by launch month. Visitors can sort by community votes or views; each vote is tied to a signed-in account.'
    },
    {
      q: 'Is there any fee to submit an early-stage startup?',
      a: 'No. Startup Showcase is 100% free for founders, students, and independent creators at any stage of development.'
    },
    {
      q: 'Can hardware or rural physical startups submit?',
      a: 'Absolutely. We actively encourage AgriTech, CleanTech, HealthTech hardware, and deep tech prototypes solving tangible real-world problems.'
    },
    {
      q: 'How does the demo submission feature work?',
      a: 'Sign in with a founder account and submit the startup profile. It stays private while pending review, then appears in the directory after an administrator approves it.'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-24">
      {/* Hero Banner */}
      <section className="bg-white border-b border-slate-200/80 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            Discovering Next-Gen Indian Innovations
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            About <span className="text-blue-600">Startup Showcase</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Startup Showcase is a modern discovery and monthly leaderboard platform highlighting high-impact early-stage innovations, prototypes, and MVPs from across India.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-xs"
            >
              <Rocket className="w-4 h-4" />
              Submit Your Startup
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all shadow-xs"
            >
              Explore Leaderboard
            </Link>
          </div>
        </div>
      </section>

      {/* Main Pillars */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-16">
        
        {/* Core Pillars */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Why Startup Showcase?</h2>
            <p className="text-sm text-slate-500 max-w-xl mx-auto">
              Early-stage founders struggle for visibility before they have massive marketing budgets. We provide a clean, meritocratic leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillars.map((pillar, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-3 hover:border-blue-200 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center">
                  {pillar.icon}
                </div>
                <h3 className="text-base font-bold text-slate-900">{pillar.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                  {pillar.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Development Stages Explained */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-slate-900">Development Stages Explained</h2>
            <p className="text-xs text-slate-500">
              How we categorize maturity levels on the monthly leaderboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stages.map((stg, i) => (
              <div key={i} className="p-5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2.5">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${stg.badgeClass}`}>
                  {stg.badge}
                </span>
                <h4 className="text-sm font-bold text-slate-900">{stg.name}</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {stg.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Frequently Asked Questions */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
            <p className="text-xs text-slate-500">Everything you need to know about the platform.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-2">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 pl-6 leading-relaxed font-normal">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

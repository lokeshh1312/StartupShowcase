import React, { useState, useMemo } from 'react';
import { FAQ_ITEMS } from '../data/faqs';
import { HelpCircle, ChevronDown, Search, MessageSquare, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const FAQPage = () => {
  const [search, setSearch] = useState('');
  const [openIndex, setOpenIndex] = useState('0-0'); // opens first item by default

  const toggleAccordion = (id) => {
    setOpenIndex(prev => prev === id ? null : id);
  };

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return FAQ_ITEMS;
    const q = search.toLowerCase();
    return FAQ_ITEMS.map(cat => ({
      ...cat,
      questions: cat.questions.filter(item => 
        item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      )
    })).filter(cat => cat.questions.length > 0);
  }, [search]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Knowledge Base</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif]">
          Frequently Asked Questions
        </h1>

        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Everything you need to know about discovering products, upvoting, launch rankings, and submitting your startup.
        </p>

        {/* Search */}
        <div className="max-w-md mx-auto pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions (e.g. 'submit', 'ranking', 'free')..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-teal-500 focus:outline-none text-xs text-white placeholder:text-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-8">
        {filteredCategories.map((cat, catIdx) => (
          <div key={cat.category} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-teal-400 px-1">
              {cat.category}
            </h2>

            <div className="space-y-2.5">
              {cat.questions.map((item, qIdx) => {
                const id = `${catIdx}-${qIdx}`;
                const isOpen = openIndex === id;
                return (
                  <div
                    key={item.q}
                    className="rounded-2xl bg-[#0E1321] border border-slate-800/80 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleAccordion(id)}
                      className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 text-xs sm:text-sm font-semibold text-white hover:text-teal-300 transition-colors"
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-teal-400' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 sm:px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-3 animate-in fade-in duration-150">
                        {item.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {filteredCategories.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
            No FAQs found matching &quot;{search}&quot;. Still have questions? Contact support below.
          </div>
        )}
      </div>

      {/* Support CTA */}
      <div className="p-6 rounded-2xl bg-[#0D121F] border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white">Have a specific question not covered here?</h3>
          <p className="text-xs text-slate-400">Our community team is happy to help with verification or listings.</p>
        </div>
        <Link
          to="/support"
          className="px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shrink-0 transition-colors flex items-center gap-1.5"
        >
          <span>Contact Support</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </div>
  );
};

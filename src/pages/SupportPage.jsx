import React, { useState } from 'react';
import { LifeBuoy, Mail, Send, CheckCircle2, MessageSquare, ShieldCheck } from 'lucide-react';

export const SupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    topic: 'general',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [ticketId, setTicketId] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required.';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required.';
    if (!formData.subject.trim()) newErrors.subject = 'Subject is required.';
    if (!formData.message.trim()) newErrors.message = 'Message details are required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const generatedTicket = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(generatedTicket);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      topic: 'general',
      subject: '',
      message: ''
    });
    setTicketId(null);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-400 text-xs font-semibold">
          <LifeBuoy className="w-3.5 h-3.5" />
          <span>LaunchSpace Support</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white font-['Plus_Jakarta_Sans',sans-serif]">
          How Can We Help You?
        </h1>

        <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
          Need help editing a startup listing, reporting an issue, or inquiring about editorial curation? Reach out directly.
        </p>
      </div>

      {/* Form Container */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0E1321] border border-slate-800 shadow-xl">
        {ticketId ? (
          <div className="text-center py-8 space-y-4 animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-400 mx-auto shadow-lg shadow-teal-500/20">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white">Support Ticket Created</h3>
            <div className="inline-block px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-teal-300">
              Reference: {ticketId}
            </div>
            <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
              [Mock Simulation]: Your inquiry regarding &quot;<strong className="text-white">{formData.subject}</strong>&quot; has been logged. In a production deployment, our community team would respond within 1 business day.
            </p>
            <div className="pt-2">
              <button
                onClick={resetForm}
                className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs hover:bg-teal-400 transition-colors"
              >
                Submit Another Inquiry
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Alex Vance"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Your Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="alex@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Inquiry Topic</label>
                <select
                  name="topic"
                  value={formData.topic}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  <option value="general">General Question</option>
                  <option value="submission">Startup Submission Assistance</option>
                  <option value="curation">Editorial Feature Request</option>
                  <option value="bug">Bug Report / Technical Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="e.g. Updating links for PulseFlow AI"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500"
                />
                {errors.subject && <p className="text-xs text-rose-400 mt-1">{errors.subject}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Message</label>
              <textarea
                rows={5}
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Provide as much detail as possible so we can assist promptly..."
                className="w-full p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-teal-500 resize-none"
              />
              {errors.message && <p className="text-xs text-rose-400 mt-1">{errors.message}</p>}
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                <span>Frontend demonstration form</span>
              </span>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </form>
        )}
      </div>

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Rocket, 
  Sparkles, 
  CheckCircle2, 
  ArrowLeft, 
  Upload, 
  MapPin, 
  Building2, 
  Globe, 
  User, 
  Tag, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useStartups } from '../context/StartupsContext';
import { CATEGORIES_LIST, STAGES_LIST, INDIAN_STATES } from '../data/startups';
import { useAuth } from '../context/AuthContext';

const PRESET_THUMBNAILS = [
  { label: 'Drone / Agri', url: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=300&q=80' },
  { label: 'Healthcare Device', url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80' },
  { label: 'Eco Packaging', url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&w=300&q=80' },
  { label: 'EdTech Laptop', url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=300&q=80' },
  { label: 'Food / Culinary', url: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=300&q=80' },
  { label: 'Solar Roofing', url: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=300&q=80' }
];

export const SubmitStartupPage = () => {
  const { submitStartup, activeMonth, availableMonths } = useStartups();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    ideaTitle: '',
    tagline: '',
    description: '',
    fullStory: '',
    category: 'AgriTech',
    location: 'Maharashtra',
    stage: 'MVP',
    websiteUrl: '',
    founderName: '',
    founderRole: 'Founder & CEO',
    problem: '',
    solution: '',
    thumbnail: PRESET_THUMBNAILS[0].url,
    month: activeMonth
  });

  const [errors, setErrors] = useState({});
  const [submittedStartup, setSubmittedStartup] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (user) setSubmitError(''); }, [user]);

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Startup name is required';
    if (!formData.ideaTitle.trim()) errs.ideaTitle = 'Startup idea title is required';
    if (!formData.description.trim()) errs.description = 'Short description is required';
    if (!formData.founderName.trim()) errs.founderName = 'Founder name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const newCreated = await submitStartup({
        ...formData,
        monthLabel: availableMonths.find((month) => month.id === formData.month)?.label || formData.month,
      });
      setSubmittedStartup(newCreated);
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedStartup) {
    return (
      <div className="w-full min-h-screen bg-[#F8FAFC] py-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-2xl border border-slate-200/90 p-8 shadow-xs text-center space-y-6 animate-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl font-bold">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900">
              Submission received
            </h2>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">{submittedStartup.name}</strong> is awaiting review. It will appear in the directory after an administrator approves it.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Category:</span>
              <span>{submittedStartup.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Location:</span>
              <span>{submittedStartup.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Stage:</span>
              <span>{submittedStartup.stage}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-semibold text-slate-700">Review status:</span>
              <span className="capitalize">{submittedStartup.status}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Link
              to="/me/submissions"
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              Track my submissions
            </Link>
            <Link
              to="/"
              className="w-full py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition-colors"
            >
              Go to Leaderboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#F8FAFC] pb-24">
      {/* Header banner */}
      <div className="bg-white border-b border-slate-200/80 py-10">
        <div className="max-w-3xl mx-auto px-4 space-y-2">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Leaderboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Rocket className="w-7 h-7 text-blue-600" />
            Submit Your Startup Idea
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Showcase your prototype, MVP, or early-stage idea on the Startup Showcase leaderboard.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pt-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
          
          {submitError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{submitError}</p>}
          {/* Review notice pill */}
          <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Review process:</strong> Submissions are stored centrally and remain private until reviewed and approved.
            </span>
          </div>

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              1. Startup Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Startup Brand Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AgriSense"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.name && <p className="text-[11px] text-red-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Startup Idea / Product Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI-Based Crop Health Monitoring"
                  value={formData.ideaTitle}
                  onChange={(e) => setFormData({ ...formData, ideaTitle: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.ideaTitle && <p className="text-[11px] text-red-500 mt-1">{errors.ideaTitle}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Short Description (Leaderboard Summary) *
              </label>
              <input
                type="text"
                placeholder="e.g. Drone and AI-based solution for early detection of crop diseases and yield prediction."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {errors.description && <p className="text-[11px] text-red-500 mt-1">{errors.description}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Problem Statement & Proposed Solution
              </label>
              <textarea
                rows={3}
                placeholder="Describe the core problem your target users face in India and how your technology solves it..."
                value={formData.fullStory}
                onChange={(e) => setFormData({ ...formData, fullStory: e.target.value })}
                className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Categorization & Location */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              2. Classification & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {CATEGORIES_LIST.map((c) => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Location (Indian State) *
                </label>
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Development Stage *
                </label>
                <select
                  value={formData.stage}
                  onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Idea Stage">Idea Stage</option>
                  <option value="Prototype">Prototype</option>
                  <option value="MVP">MVP</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Month Leaderboard
                </label>
                <select
                  value={formData.month}
                  onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {availableMonths.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Website / Demo URL
                </label>
                <input
                  type="text"
                  placeholder="https://yourstartup.in"
                  value={formData.websiteUrl}
                  onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Founder Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              3. Founder Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Founder Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rohan Deshmukh"
                  value={formData.founderName}
                  onChange={(e) => setFormData({ ...formData, founderName: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {errors.founderName && <p className="text-[11px] text-red-500 mt-1">{errors.founderName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Founder Role
                </label>
                <input
                  type="text"
                  placeholder="e.g. Founder & Precision Agri Lead"
                  value={formData.founderRole}
                  onChange={(e) => setFormData({ ...formData, founderRole: e.target.value })}
                  className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Thumbnail Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-2">
              4. Choose Thumbnail Image
            </h3>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_THUMBNAILS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setFormData({ ...formData, thumbnail: preset.url })}
                  className={`group relative rounded-lg overflow-hidden border-2 aspect-video transition-all ${
                    formData.thumbnail === preset.url
                      ? 'border-blue-600 ring-2 ring-blue-500/30'
                      : 'border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={preset.url} alt={preset.label} className="w-full h-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 bg-slate-950/70 text-[9px] text-white py-0.5 truncate px-1">
                    {preset.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <Link
              to="/"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all shadow-xs active:scale-95 cursor-pointer disabled:opacity-60"
            >
              <Rocket className="w-4 h-4" />
              {submitting ? 'Sending…' : 'Submit for Review'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

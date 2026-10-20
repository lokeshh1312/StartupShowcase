import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Mail, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Logo } from '../components/common/Logo';

export const AuthPage = ({ initialMode = 'login' }) => {
  const isSignup = initialMode === 'signup';
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('founder');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isSignup) await register(name, email, password, role);
      else await login(email, password);
      navigate('/');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-md space-y-6 rounded-2xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <div className="space-y-3 text-center">
          <div className="flex justify-center"><Logo size="lg" /></div>
          <h1 className="text-2xl font-bold text-slate-900">{isSignup ? 'Join Startup Showcase' : 'Sign in to your account'}</h1>
          <p className="text-sm text-slate-500">{isSignup ? 'Create an account to submit startups and take part in the community.' : 'Vote for startups, save your favorites, and join discussions.'}</p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && <label className="block text-sm font-medium text-slate-700">Full name<div className="relative mt-1.5"><User className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm" placeholder="Your name" /></div></label>}
          <label className="block text-sm font-medium text-slate-700">Email<div className="relative mt-1.5"><Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm" placeholder="you@example.com" /></div></label>
          <label className="block text-sm font-medium text-slate-700">Password<div className="relative mt-1.5"><Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input required type="password" minLength={10} maxLength={128} autoComplete={isSignup ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-300 py-2.5 pl-9 pr-3 text-sm" placeholder="At least 10 characters" /></div></label>
          {isSignup && <label className="block text-sm font-medium text-slate-700">I’m here as<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="founder">Founder / builder</option><option value="investor">Investor / mentor</option><option value="community">Early adopter / community</option></select></label>}
          <button disabled={submitting} type="submit" className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{submitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}</button>
        </form>
        <p className="text-center text-sm text-slate-500">{isSignup ? 'Already have an account?' : 'New to Startup Showcase?'}{' '}<Link to={isSignup ? '/login' : '/signup'} className="font-semibold text-blue-600 hover:underline">{isSignup ? 'Sign in' : 'Create an account'}</Link></p>
        <Link to="/" className="flex items-center justify-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" />Back to the directory</Link>
      </section>
    </main>
  );
};

import React, { useState } from 'react';
import { X, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Logo } from './Logo';

export const AuthModal = () => {
  const { authModalOpen, authModalMode, setAuthModalMode, closeAuthModal, login, register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('founder');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  if (!authModalOpen) return null;
  const isLogin = authModalMode === 'login';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password, role);
      closeAuthModal();
      setPassword('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) closeAuthModal(); }}>
      <div className="relative w-full max-w-md space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button type="button" onClick={closeAuthModal} className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100" aria-label="Close"><X className="h-5 w-5" /></button>
        <div className="space-y-2 text-center">
          <div className="flex justify-center"><Logo size="sm" /></div>
          <h2 id="auth-title" className="text-xl font-bold text-slate-900">{isLogin ? 'Welcome back' : 'Create your account'}</h2>
          <p className="text-xs text-slate-500">{isLogin ? 'Sign in to vote, save startups, and join discussions.' : 'Join founders and people discovering new startups.'}</p>
        </div>
        {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && <label className="block text-xs font-semibold text-slate-700">Full name<div className="relative mt-1"><User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input required maxLength={100} autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-normal" placeholder="Your name" /></div></label>}
          <label className="block text-xs font-semibold text-slate-700">Email<div className="relative mt-1"><Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input required type="email" maxLength={254} autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-normal" placeholder="you@example.com" /></div></label>
          <label className="block text-xs font-semibold text-slate-700">Password<div className="relative mt-1"><Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" /><input required type="password" minLength={10} maxLength={128} autoComplete={isLogin ? 'current-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm font-normal" placeholder="At least 10 characters" /></div></label>
          {!isLogin && <label className="block text-xs font-semibold text-slate-700">I’m here as<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-normal"><option value="founder">Founder / builder</option><option value="investor">Investor / mentor</option><option value="community">Early adopter / community</option></select></label>}
          <button disabled={submitting} type="submit" className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}</button>
        </form>
        <p className="text-center text-xs text-slate-500">{isLogin ? 'New to Startup Showcase?' : 'Already have an account?'}{' '}<button type="button" onClick={() => { setError(''); setAuthModalMode(isLogin ? 'signup' : 'login'); }} className="font-semibold text-blue-600 hover:underline">{isLogin ? 'Create an account' : 'Sign in'}</button></p>
      </div>
    </div>
  );
};

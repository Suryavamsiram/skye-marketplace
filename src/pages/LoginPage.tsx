import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight } from '../lib/lucideIcons';
import { useNavigate } from 'react-router-dom';
import { DEMO_PROFILES } from '../lib/localState';
import type { DemoProfile } from '../lib/localState';

interface LoginPageProps {
  onLoginAsDemo: (email: string) => { success: boolean; error?: string };
  onCreateAccount: (name: string, email: string, role: 'poster' | 'finder' | 'both') => { success: boolean; error?: string };
}

export function LoginPage({ onLoginAsDemo, onCreateAccount }: LoginPageProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'demo' | 'register'>('demo');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'poster' | 'finder' | 'both'>('both');
  const [error, setError] = useState<string | null>(null);

  const handleDemoLogin = (profileEmail: string) => {
    const result = onLoginAsDemo(profileEmail);
    if (result.success) {
      window.location.href = '/';
    } else {
      setError(result.error || 'Login failed');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const result = onCreateAccount(name.trim(), email.trim(), role);
    if (result.success) {
      window.location.href = '/';
    } else {
      setError(result.error || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-4xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-3xl mb-4 shadow-lg shadow-cyan-500/30">
            <Sparkles className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Welcome to Milo</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Campus Gig Marketplace</p>
        </div>

        {/* Mode Tabs */}
        <div className="flex justify-center gap-2 mb-6">
          <button
            onClick={() => setMode('demo')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${mode === 'demo' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
          >
            Demo Profiles
          </button>
          <button
            onClick={() => setMode('register')}
            className={`px-6 py-2.5 rounded-xl font-medium transition-all ${mode === 'register' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'}`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="max-w-md mx-auto mb-4 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        {mode === 'demo' ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <h3 className="font-semibold text-slate-900 dark:text-white">Click to login instantly as a demo contractor</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">20 demo profiles available for testing</p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-800">
              {DEMO_PROFILES.map((profile) => (
                <button
                  key={profile.user_id}
                  onClick={() => handleDemoLogin(profile.email)}
                  className="p-4 flex items-center gap-3 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 transition-colors text-left"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {profile.name.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 dark:text-white truncate">{profile.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile.skills.slice(0, 2).join(' · ')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-block px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-full">
                        ${profile.balance} balance
                      </span>
                      <span className="text-xs text-slate-400 dark:text-slate-500">
                        {profile.campus_location}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-md mx-auto bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Create Your Account</h3>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">I want to...</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'poster', label: 'Post Gigs', icon: '📝' },
                    { value: 'finder', label: 'Find Gigs', icon: '🔍' },
                    { value: 'both', label: 'Both', icon: '⚡' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value as typeof role)}
                      className={`p-3 border rounded-lg transition-all ${role === option.value ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'}`}
                    >
                      <div className="text-xl mb-1">{option.icon}</div>
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-300">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
              >
                Create Account
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
              You'll start with $100 in your wallet for testing
            </p>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
          All data is stored locally in your browser for this demo
        </p>
      </div>
    </div>
  );
}

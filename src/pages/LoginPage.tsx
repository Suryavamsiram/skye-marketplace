import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface LoginPageProps {
  onLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  onDemoLogin: (email: string) => Promise<{ success: boolean; error?: string }>;
  error?: string | null;
  clearError: () => void;
}

export function LoginPage({ onDemoLogin, error, clearError }: LoginPageProps) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });

    if (loginError) {
      alert(loginError.message);
    } else {
      window.location.href = '/';
    }

    setLoading(false);
  };

  const handleDemoLogin = async (email: string) => {
    setLoading(true);
    const { success, error: demoError } = await onDemoLogin(email);

    if (success) {
      window.location.href = '/';
    } else {
      alert(demoError || 'Demo login failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4 transition-colors">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to Milo</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Campus Gig Marketplace</p>
        </div>

        {/* Login Form */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

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
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none transition-all text-slate-900 dark:text-white"
                  placeholder="Your password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Don't have an account?{' '}
              <button onClick={() => navigate('/register')} className="text-cyan-600 dark:text-cyan-400 font-medium hover:underline">
                Register
              </button>
            </p>
          </div>
        </div>

        {/* Demo Profiles */}
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-6 border border-slate-200 dark:border-slate-800">
          <h3 className="font-medium text-slate-900 dark:text-white mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-500" />
            Demo Profiles
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">Click to instantly login as a demo contractor:</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Alex Chen', email: 'alex.chen@demo.edu', skills: 'Tech/AI' },
              { name: 'Maya Patel', email: 'maya.patel@demo.edu', skills: 'Tutoring' },
              { name: 'Jordan Smith', email: 'jordan.smith@demo.edu', skills: 'Fitness' },
              { name: 'Liam Torres', email: 'liam.torres@demo.edu', skills: 'Music' },
            ].map((profile) => (
              <button
                key={profile.email}
                onClick={() => handleDemoLogin(profile.email)}
                disabled={loading}
                className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-cyan-50 dark:hover:bg-cyan-950/20 border border-slate-200 dark:border-slate-700 rounded-lg text-left transition-all"
              >
                <p className="text-sm font-medium text-slate-900 dark:text-white">{profile.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{profile.skills}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => navigate('/dev')}
            className="w-full mt-3 py-2 text-sm text-cyan-600 dark:text-cyan-400 hover:underline"
          >
            View all demo profiles
          </button>
        </div>
      </div>
    </div>
  );
}

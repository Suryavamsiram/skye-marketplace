import React, { useState } from 'react';
import { Send, HelpCircle, BookOpen, Loader2, CheckCircle2, Clock } from 'lucide-react';
import type { UrgencyLevel } from '../types/matching';
import { isRealDatabase } from '../lib/supabase';

interface MenteeRequestInterfaceProps {
  isMatchLoading: boolean;
  onSubmitRequest: (
    name: string,
    topic: string,
    description: string,
    urgency: UrgencyLevel
  ) => Promise<void>;
}

const urgencyOptions: { value: UrgencyLevel; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const topicPresets = ['SAT Math', 'SAT Verbal', 'AP Physics', 'AP Calculus', 'Essay Writing', 'College Applications'];

export function MenteeRequestInterface({ isMatchLoading, onSubmitRequest }: MenteeRequestInterfaceProps) {
  const [menteeName, setMenteeName] = useState('');
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyLevel>('medium');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menteeName || !topic || !description) return;

    await onSubmitRequest(menteeName, topic, description, urgency);

    setMenteeName('');
    setTopic('');
    setDescription('');
    setUrgency('medium');
  };

  if (!isRealDatabase) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-amber-500/10 rounded-2xl inline-block mb-4">
            <HelpCircle className="w-8 h-8 text-amber-400" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Database Not Connected</h3>
          <p className="text-slate-400 text-sm max-w-sm">
            Please configure your Supabase credentials in .env file to enable the mentoring system.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-cyan-500/10 rounded-xl">
          <HelpCircle className="w-5 h-5 text-cyan-400" />
        </div>
        <h2 className="text-xl font-semibold text-white">Request Assistance</h2>
      </div>

      {!isMatchLoading ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Your Name</label>
            <input
              type="text"
              value={menteeName}
              onChange={(e) => setMenteeName(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
              placeholder="Enter your name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subject / Topic</label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                placeholder="e.g., SAT Math"
                required
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {topicPresets.slice(0, 4).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTopic(preset)}
                  className="px-2.5 py-1 text-xs bg-slate-800/80 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Specific Problem Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all resize-none"
              placeholder="Describe the specific challenge you're facing..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Urgency Level</label>
            <div className="grid grid-cols-4 gap-2">
              {urgencyOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setUrgency(option.value)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    urgency === option.value
                      ? 'bg-slate-800 border-2 border-cyan-500 text-white'
                      : 'bg-slate-800/30 border border-slate-700/50 text-slate-400 hover:bg-slate-800/50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!menteeName || !topic || !description}
            className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg shadow-cyan-500/25 disabled:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Submit Request
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-cyan-500/30 animate-pulse"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          </div>
          <p className="text-cyan-400 font-medium mb-4">Running Deterministic Matching Matrix...</p>
          <div className="space-y-2 w-full">
            {['Request Created', 'Finding Optimal Mentors', 'Awaiting Mentor Acceptance'].map((step, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                {idx === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : idx === 1 ? (
                  <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-600 flex items-center justify-center">
                    <span className="text-xs text-slate-500">{idx + 1}</span>
                  </div>
                )}
                <span className={`text-sm ${idx === 0 ? 'text-emerald-400' : idx === 1 ? 'text-cyan-400' : 'text-slate-500'}`}>
                  {step}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

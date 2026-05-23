import React from 'react';
import { Radar, User, BookOpen, Star, CheckCircle, XCircle, Clock, Zap, Activity, Sparkles } from 'lucide-react';
import type { Mentor, MatchResult } from '../types/matching';
import { isRealDatabase } from '../lib/supabase';

interface MentorRequestRadarProps {
  currentMentor: Mentor | null;
  activeMatch: MatchResult | null;
  showRadarAlert: boolean;
  countdown: number | null;
  onAccept: () => void;
  onDecline: () => void;
}

export function MentorRequestRadar({
  currentMentor,
  activeMatch,
  showRadarAlert,
  countdown,
  onAccept,
  onDecline,
}: MentorRequestRadarProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 80) return 'text-cyan-400';
    if (score >= 70) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getCountdownColor = (time: number) => {
    if (time <= 10) return 'text-rose-400 animate-pulse';
    if (time <= 20) return 'text-amber-400';
    return 'text-cyan-400';
  };

  if (!isRealDatabase) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8 h-full flex items-center justify-center">
        <div className="text-center">
          <div className="p-4 bg-amber-500/10 rounded-2xl inline-block mb-4">
            <Radar className="w-8 h-8 text-amber-400" />
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Radar className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Request Radar</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-sm text-emerald-400">Live</span>
        </div>
      </div>

      {currentMentor && (
        <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl mb-6">
          {currentMentor.avatar_url && (
            <img
              src={currentMentor.avatar_url}
              alt={currentMentor.name}
              className="w-14 h-14 rounded-xl object-cover border-2 border-slate-700"
            />
          )}
          <div className="flex-1">
            <h3 className="text-white font-medium">{currentMentor.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-sm text-slate-400">{currentMentor.rating}</span>
              <span className="text-slate-600">|</span>
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-sm text-emerald-400">{currentMentor.status}</span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {currentMentor.specializations.slice(0, 3).map((spec) => (
                <span key={spec} className="px-2 py-0.5 text-xs bg-slate-700/50 rounded-md text-slate-300">
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {!showRadarAlert ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border border-slate-700/50 flex items-center justify-center">
              <Radar className="w-12 h-12 text-slate-600 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-20"></div>
            <div className="absolute inset-2 rounded-full border border-cyan-500/15 animate-ping opacity-15"></div>
            <div className="absolute inset-4 rounded-full border border-cyan-500/10 animate-ping opacity-10"></div>
          </div>
          <p className="mt-6 text-slate-400 text-center">Scanning for incoming requests...</p>
          <p className="mt-2 text-sm text-slate-500">You'll be notified when a mentee needs assistance</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-cyan-500/50 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">Incoming Match</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 rounded-lg">
                <Clock className={`w-4 h-4 ${getCountdownColor(countdown || 45)}`} />
                <span className={`font-mono font-bold ${getCountdownColor(countdown || 45)}`}>
                  {countdown}s
                </span>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="p-3 bg-cyan-500/20 rounded-xl">
                <User className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium text-lg">
                  {activeMatch?.mentor.name || 'Mentee'}
                </h3>
                <div className="flex items-center mt-1.5 gap-2 text-sm text-slate-400">
                  <BookOpen className="w-4 h-4" />
                  <span>{activeMatch?.reasons[0] || 'Topic'}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Compatibility Score</span>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span className={`font-bold text-lg ${getScoreColor(activeMatch?.score || 0)}`}>
                    {activeMatch?.score}%
                  </span>
                </div>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    activeMatch?.score && activeMatch.score >= 90
                      ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                      : activeMatch?.score && activeMatch.score >= 80
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-400'
                  }`}
                  style={{ width: `${activeMatch?.score || 0}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              {activeMatch?.reasons.map((reason, idx) => (
                <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{reason}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onAccept}
              className="py-3.5 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={onDecline}
              className="py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 text-slate-300 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <XCircle className="w-4 h-4" />
              Decline
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

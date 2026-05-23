import React from 'react';
import { Sparkles, Zap, Shield, Activity } from 'lucide-react';
import { MenteeRequestInterface } from './components/MenteeRequestInterface';
import { MentorRequestRadar } from './components/MentorRequestRadar';
import { useMatchingEngine } from './hooks/useMatchingEngine';

function App() {
  const {
    currentMentor,
    activeMatch,
    isMatchLoading,
    countdown,
    showRadarAlert,
    submitMenteeRequest,
    acceptMentorship,
    declineMentorship,
  } = useMatchingEngine();

  const handleSubmitRequest = async (
    name: string,
    topic: string,
    description: string,
    urgency: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    await submitMenteeRequest(name, topic, description, urgency);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-900/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 min-h-screen">
        <header className="border-b border-slate-800/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white tracking-tight">Skye</h1>
                <p className="text-xs text-slate-500 -mt-0.5">Matching Marketplace</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/50 rounded-lg border border-slate-700/50">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-slate-400">
                  <span className="text-emerald-400 font-medium">Live</span> System
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-slate-500" />
                <span className="text-xs text-slate-500">Secured</span>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">Production Dashboard</span>
            </div>
            <h2 className="text-3xl font-bold text-white">Real-Time Matching Engine</h2>
            <p className="text-slate-400 mt-2">
              Human-in-the-Loop mentoring marketplace with deterministic matching
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MenteeRequestInterface
              isMatchLoading={isMatchLoading}
              onSubmitRequest={handleSubmitRequest}
            />
            <MentorRequestRadar
              currentMentor={currentMentor}
              activeMatch={activeMatch}
              showRadarAlert={showRadarAlert}
              countdown={countdown}
              onAccept={acceptMentorship}
              onDecline={declineMentorship}
            />
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { Code, Users, RefreshCw, Play, ChevronRight, X } from '../lib/lucideIcons';
import { LocalStateManager, DEMO_PROFILES, type DemoProfile, type LocalGig } from '../lib/localState';

interface DevPanelPageProps {
  profile: DemoProfile;
  loginAsDemo: (email: string) => { success: boolean; error?: string };
}

export function DevPanelPage({ profile, loginAsDemo }: DevPanelPageProps) {
  const [activeGigs, setActiveGigs] = useState<LocalGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<DemoProfile | null>(null);
  const [generatorRunning, setGeneratorRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, [profile.user_id]);

  const loadData = () => {
    setLoading(true);
    const gigs = LocalStateManager.getGigs();
    const myGigs = gigs.filter(g => g.accepted_by_user_id === profile.user_id && !['completed', 'cancelled'].includes(g.status));
    setActiveGigs(myGigs);
    setLoading(false);
  };

  const loginAsProfile = (p: DemoProfile) => {
    const result = loginAsDemo(p.email);
    if (result.success) {
      window.location.href = '/';
    }
  };

  const triggerSampleGigs = () => {
    setGeneratorRunning(true);
    const count = Math.floor(Math.random() * 3) + 2; // 2-4 gigs
    LocalStateManager.generateSampleGigs(count);
    setGeneratorRunning(false);
    alert('Generated ' + count + ' sample gigs!');
    loadData();
  };

  const markGigComplete = (gig: LocalGig) => {
    LocalStateManager.updateGig(gig.id, { contractor_marked_complete: true, status: 'in_progress' });
    alert('Gig marked as complete! Waiting for poster approval.');
    loadData();
  };

  const releasePayment = (gig: LocalGig) => {
    if (!gig.accepted_by_user_id) return;

    LocalStateManager.releaseEscrow(gig.user_id, gig.accepted_by_user_id, gig.escrow_amount, gig.id);
    LocalStateManager.updateGig(gig.id, { escrow_released: true, status: 'completed', completed_at: new Date().toISOString() });

    alert('Payment released! $' + gig.escrow_amount + ' sent to contractor.');
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-6 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <Code className="w-7 h-7 text-purple-500" />
            Dev Panel
          </h1>

          <button onClick={triggerSampleGigs} disabled={generatorRunning} className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${generatorRunning ? 'animate-spin' : ''}`} />
            Generate Sample Gigs
          </button>
        </div>

        {/* Current User Info */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 mb-6 text-white">
          <p className="text-sm opacity-80">Currently logged in as:</p>
          <p className="text-xl font-bold mt-1">{profile.name}</p>
          <p className="text-sm opacity-80">{profile.email}</p>
          <p className="text-sm mt-2">Balance: ${profile.balance.toFixed(2)}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Gigs */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Your Active Gigs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gigs you've accepted</p>
            </div>

            {activeGigs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                <Play className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No active gigs. Accept a gig to see it here.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {activeGigs.map((gig) => (
                  <div key={gig.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium text-slate-900 dark:text-white">{gig.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Posted by: {gig.poster_name}</p>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">${gig.pay_max}</p>
                      </div>

                      {!gig.contractor_marked_complete ? (
                        <button onClick={() => markGigComplete(gig)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
                          Mark Complete
                        </button>
                      ) : (
                        <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-sm">
                          Waiting for approval
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Demo Profiles */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                Demo Profiles ({DEMO_PROFILES.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click to login as any contractor</p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {DEMO_PROFILES.map((p) => (
                  <button key={p.user_id} onClick={() => setSelectedProfile(p)} className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.skills.slice(0, 2).join(' · ')}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* posted Gigs */}
        <div className="mt-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
            <h2 className="font-semibold text-slate-900 dark:text-white">Your Posted Gigs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gigs you've posted that have been accepted</p>
          </div>

          {LocalStateManager.getMyPostedGigs(profile.user_id).filter(g => g.status === 'matched' || g.status === 'in_progress').length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">No posted gigs with matches yet</div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {LocalStateManager.getMyPostedGigs(profile.user_id).filter(g => g.status === 'matched' || g.status === 'in_progress').map((gig) => (
                <div key={gig.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 dark:text-white">{gig.title}</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Accepted by: {gig.accepted_by_name}</p>
                      <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-1">${gig.escrow_amount} held in escrow</p>
                    </div>

                    {gig.contractor_marked_complete ? (
                      <button onClick={() => releasePayment(gig)} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium">
                        Approve & Pay
                      </button>
                    ) : (
                      <span className="text-sm text-slate-500">Waiting for contractor to finish</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Detail Modal */}
        {selectedProfile && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Profile Details</h3>
                <button onClick={() => setSelectedProfile(null)} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-slate-500 dark:text-slate-400">Name</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedProfile.name}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Email</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedProfile.email}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Skills</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedProfile.skills.join(', ')}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Location</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedProfile.campus_location}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Balance</p>
                  <p className="font-medium text-green-600 dark:text-green-400">${selectedProfile.balance.toFixed(2)}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Pay Range</p>
                  <p className="font-medium text-slate-900 dark:text-white">${selectedProfile.pay_min} - ${selectedProfile.pay_max}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Bio</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedProfile.bio}</p>
                </div>
              </div>

              <button onClick={() => loginAsProfile(selectedProfile)} className="w-full mt-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg">
                Login as {selectedProfile.name.split(' ')[0]}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

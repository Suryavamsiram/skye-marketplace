import React, { useState, useEffect } from 'react';
import { Code, Users, RefreshCw, Play, ChevronRight, X } from 'lucide-react';
import { supabase, type UserProfile, type Gig } from '../lib/supabase';

interface DevPanelPageProps {
  profile: UserProfile;
}

export function DevPanelPage({ profile }: DevPanelPageProps) {
  const [demoProfiles, setDemoProfiles] = useState<UserProfile[]>([]);
  const [activeGigs, setActiveGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);
  const [generatorRunning, setGeneratorRunning] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Load demo profiles
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('*')
      .like('email', '%@demo.edu')
      .order('name');

    if (profiles) setDemoProfiles(profiles as UserProfile[]);

    // Load gigs that need action
    const { data: gigs } = await supabase
      .from('gigs')
      .select('*')
      .eq('accepted_by_user_id', profile.user_id)
      .in('status', ['matched', 'in_progress'])
      .order('created_at', { ascending: false });

    if (gigs) setActiveGigs(gigs as Gig[]);

    setLoading(false);
  };

  const loginAsProfile = async (p: UserProfile) => {
    const { user_id, email, name, auth_user_id } = p;

    // Create proper auth user structure
    const demoAuthUser = {
      id: auth_user_id || user_id,
      email,
      created_at: new Date().toISOString()
    };

    // Store in localStorage for demo persistence
    localStorage.setItem('demo_user', JSON.stringify(demoAuthUser));
    localStorage.setItem('demo_profile', JSON.stringify(p));

    // Force reload to trigger auth state change
    window.location.href = '/';
  };

  const triggerSampleGigs = async () => {
    setGeneratorRunning(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-sample-gigs`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );

      const result = await response.json();
      alert('Generated ' + result.gigs?.length + ' sample gigs!');
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to generate gigs');
    } finally {
      setGeneratorRunning(false);
    }
  };

  const markGigComplete = async (gig: Gig) => {
    await supabase
      .from('gigs')
      .update({ contractor_marked_complete: true, status: 'in_progress' })
      .eq('id', gig.id);

    // Notify poster
    await supabase.from('notifications').insert([{
      user_id: gig.user_id,
      type: 'gig_complete_request',
      title: 'Gig Marked Complete',
      message: 'A contractor has marked your gig as complete. Please approve payment or request a redo.',
      data: { gig_id: gig.id },
    }]);

    alert('Gig marked as complete! Waiting for poster approval.');
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

          <button
            onClick={triggerSampleGigs}
            disabled={generatorRunning}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generatorRunning ? 'animate-spin' : ''}`} />
            Generate Sample Gigs
          </button>
        </div>

        {/* Current User Info */}
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl p-5 mb-6 text-white">
          <p className="text-sm opacity-80">Currently logged in as:</p>
          <p className="text-xl font-bold mt-1">{profile.name}</p>
          <p className="text-sm opacity-80">{profile.email}</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Active Gigs for Current Contractor */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
              <h2 className="font-semibold text-slate-900 dark:text-white">Your Active Gigs</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Gigs you've accepted and need to complete</p>
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
                        <button
                          onClick={() => markGigComplete(gig)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium"
                        >
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
                Demo Profiles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Click to login as any contractor</p>
            </div>

            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto">
                {demoProfiles.map((p) => (
                  <button
                    key={p.user_id}
                    onClick={() => setSelectedProfile(p)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {p.name.charAt(0)}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-slate-900 dark:text-white">{p.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{p.email}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>
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
                  <p className="font-medium text-slate-900 dark:text-white">{selectedProfile.skills?.join(', ') || 'None'}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Location</p>
                  <p className="font-medium text-slate-900 dark:text-white">{selectedProfile.campus_location}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Balance</p>
                  <p className="font-medium text-green-600 dark:text-green-400">${selectedProfile.balance?.toFixed(2) || '0.00'}</p>
                </div>

                <div>
                  <p className="text-slate-500 dark:text-slate-400">Pay Range</p>
                  <p className="font-medium text-slate-900 dark:text-white">${selectedProfile.pay_min} - ${selectedProfile.pay_max}</p>
                </div>
              </div>

              <button
                onClick={() => loginAsProfile(selectedProfile)}
                className="w-full mt-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-lg"
              >
                Login as {selectedProfile.name.split(' ')[0]}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
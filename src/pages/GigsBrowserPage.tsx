import React, { useState, useEffect } from 'react';
import { Search, MapPin, DollarSign, Clock, CheckCircle, ChevronDown } from '../lib/lucideIcons';
import { LocalStateManager, type DemoProfile, type LocalGig } from '../lib/localState';

interface GigsBrowserPageProps {
  profile: DemoProfile;
}

export function GigsBrowserPage({ profile }: GigsBrowserPageProps) {
  const [gigs, setGigs] = useState<LocalGig[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ category: '', minPay: 0, maxPay: 500, location: '' });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadGigs();
  }, [profile.user_id]);

  const loadGigs = () => {
    setLoading(true);
    const availableGigs = LocalStateManager.getAvailableGigs(profile.user_id);
    setGigs(availableGigs);
    setLoading(false);
  };

  const handleAcceptGig = (gig: LocalGig) => {
    // Check balance
    const currentBalance = LocalStateManager.getUserProfile(profile.user_id)?.balance || profile.balance;
    if (currentBalance < gig.pay_max && gig.user_id !== profile.user_id) {
      alert('Insufficient balance. Add funds to wallet first.');
      return;
    }

    // Update gig
    LocalStateManager.updateGig(gig.id, {
      status: 'matched',
      accepted_by_user_id: profile.user_id,
      accepted_by_name: profile.name,
      started_at: new Date().toISOString(),
    });

    alert('Gig accepted! Check Dev Panel to manage it.');
    loadGigs();
  };

  const filteredGigs = gigs.filter((gig) => {
    if (filter.category && gig.category !== filter.category) return false;
    if (gig.pay_max < filter.minPay) return false;
    if (gig.pay_min > filter.maxPay) return false;
    if (filter.location && !gig.campus_location.toLowerCase().includes(filter.location.toLowerCase())) return false;
    return true;
  });

  const categories = [...new Set(gigs.map((g) => g.category))];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-6 transition-colors">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Find Gigs</h1>

        {/* Search and Filter */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search gigs..."
              className="flex-1 bg-transparent outline-none text-slate-900 dark:text-white"
            />
            <button onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-1 px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              Filters <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <select
                value={filter.category}
                onChange={(e) => setFilter({ ...filter, category: e.target.value })}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <input type="number" placeholder="Min Pay" value={filter.minPay || ''} onChange={(e) => setFilter({ ...filter, minPay: parseInt(e.target.value) || 0 })} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />

              <input type="number" placeholder="Max Pay" value={filter.maxPay === 500 ? '' : filter.maxPay} onChange={(e) => setFilter({ ...filter, maxPay: parseInt(e.target.value) || 500 })} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />

              <input type="text" placeholder="Location" value={filter.location} onChange={(e) => setFilter({ ...filter, location: e.target.value })} className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white" />
            </div>
          )}
        </div>

        {/* Gigs Grid */}
        {loading ? (
          <div className="text-center py-12"><p className="text-slate-500">Loading gigs...</p></div>
        ) : filteredGigs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 dark:text-slate-400">No gigs match your criteria</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Go to Dev Panel to generate sample gigs</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredGigs.map((gig) => (
              <div key={gig.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 hover:border-cyan-300 dark:hover:border-cyan-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="inline-block px-2 py-0.5 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 text-xs font-medium rounded-full mb-2">{gig.category}</span>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{gig.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{gig.content}</p>

                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-green-500" />${gig.pay_min} - ${gig.pay_max}</span>
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-500" />{gig.campus_location}</span>
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-amber-500" />{new Date(gig.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <button onClick={() => handleAcceptGig(gig)} className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Accept
                  </button>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-sm text-slate-500">
                  Posted by: {gig.poster_name}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

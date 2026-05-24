import React, { useState } from 'react';
import { Save, MapPin, DollarSign, User } from '../lib/lucideIcons';
import { LocalStateManager, DEMO_PROFILES, type DemoProfile } from '../lib/localState';

interface SettingsPageProps {
  profile: DemoProfile;
  onRefresh?: () => void;
}

export function SettingsPage({ profile, onRefresh }: SettingsPageProps) {
  const [name, setName] = useState(profile.name);
  const [campusLocation, setCampusLocation] = useState(profile.campus_location);
  const [bio, setBio] = useState(profile.bio || '');
  const [payMin, setPayMin] = useState(profile.pay_min.toString());
  const [payMax, setPayMax] = useState(profile.pay_max.toString());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const locations = ['Student Union', 'Library', 'East Hall', 'West Campus', 'North Campus', 'Engineering Quad', 'Music Building', 'Gym', 'Downtown', 'Remote'];

  const handleSave = async () => {
    setSaving(true);

    LocalStateManager.setUserProfile(profile.user_id, {
      name,
      campus_location: campusLocation,
      bio,
      pay_min: parseFloat(payMin) || 15,
      pay_max: parseFloat(payMax) || 50,
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    if (onRefresh) onRefresh();
  };

  const isDemo = profile.user_id.startsWith('demo-');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 lg:p-6 transition-colors">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-3">
          <User className="w-7 h-7 text-cyan-500" />
          Settings
        </h1>

        {isDemo && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              You're logged in as a demo profile. Some settings are read-only.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isDemo}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:opacity-60 text-slate-900 dark:text-white"
              />
            </div>

            {/* Email (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-500 dark:text-slate-400"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isDemo}
                rows={3}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:opacity-60 text-slate-900 dark:text-white resize-none"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Campus Location</label>
              <select
                value={campusLocation}
                onChange={(e) => setCampusLocation(e.target.value)}
                disabled={isDemo}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none disabled:opacity-60 text-slate-900 dark:text-white"
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Pay Range */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
                <DollarSign className="w-4 h-4" /> Pay Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  value={payMin}
                  onChange={(e) => setPayMin(e.target.value)}
                  disabled={isDemo}
                  placeholder="Min"
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-60 text-slate-900 dark:text-white"
                />
                <input
                  type="number"
                  value={payMax}
                  onChange={(e) => setPayMax(e.target.value)}
                  disabled={isDemo}
                  placeholder="Max"
                  className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg disabled:opacity-60 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Skills</label>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span key={skill} className="px-3 py-1 bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-300 text-sm rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
              {isDemo && <p className="text-xs text-slate-400 mt-1">Skills are read-only for demo profiles</p>}
            </div>

            {/* Save Button */}
            {!isDemo && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-medium rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect } from 'react';
import { LocalStateManager, DEMO_PROFILES, type DemoProfile, type LocalSession } from '../lib/localState';

export type { DemoProfile } from '../lib/localState';

export function useAuth() {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedSession = LocalStateManager.getSession();
    if (storedSession) {
      setSession(storedSession);
      const userProfile = LocalStateManager.getUserProfile(storedSession.user_id);
      if (userProfile) {
        setProfile(userProfile);
      }
    }
    setLoading(false);
  }, []);

  // Login as demo profile
  const loginAsDemo = useCallback((email: string) => {
    const demoProfile = DEMO_PROFILES.find(p => p.email === email);
    if (!demoProfile) {
      return { success: false, error: 'Demo profile not found' };
    }

    const newSession: LocalSession = {
      user_id: demoProfile.user_id,
      name: demoProfile.name,
      email: demoProfile.email,
      is_demo: true,
      created_at: new Date().toISOString(),
    };

    LocalStateManager.setSession(newSession);
    setSession(newSession);
    setProfile(demoProfile);

    return { success: true };
  }, []);

  // Create new user account
  const createAccount = useCallback((name: string, email: string, role: 'poster' | 'finder' | 'both' = 'both'): { success: boolean; error?: string } => {
    // Check if email already in use
    const demoEmailUsed = DEMO_PROFILES.some(p => p.email.toLowerCase() === email.toLowerCase());
    if (demoEmailUsed) {
      return { success: false, error: 'Email already in use by demo profile' };
    }

    const userId = 'user-' + crypto.randomUUID();
    const newProfile: DemoProfile = {
      user_id: userId,
      name,
      email,
      role,
      campus_location: 'Student Union',
      skills: [],
      skills_interests: [],
      pay_min: 15,
      pay_max: 50,
      balance: 100, // Starting balance
      total_earned: 0,
      total_spent: 0,
      bio: '',
      availability: 'flexible',
      max_walk_time_mins: 20,
    };

    const newSession: LocalSession = {
      user_id: userId,
      name,
      email,
      is_demo: false,
      created_at: new Date().toISOString(),
    };

    LocalStateManager.setUserProfile(userId, newProfile);
    LocalStateManager.setSession(newSession);

    setSession(newSession);
    setProfile(newProfile);

    return { success: true };
  }, []);

  // Logout
  const logout = useCallback(() => {
    LocalStateManager.clearSession();
    setSession(null);
    setProfile(null);
  }, []);

  // Refresh profile (get latest balance, etc.)
  const refreshProfile = useCallback(() => {
    if (!session) return;
    const latestProfile = LocalStateManager.getUserProfile(session.user_id);
    if (latestProfile) {
      setProfile(latestProfile);
    }
  }, [session]);

  // Check if logged in
  const isLoggedIn = session !== null;
  const isDemo = session?.is_demo ?? false;

  return {
    session,
    profile,
    loading,
    isLoggedIn,
    isDemo,
    loginAsDemo,
    createAccount,
    logout,
    refreshProfile,
  };
}

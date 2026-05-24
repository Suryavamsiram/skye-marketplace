import { useState, useEffect, useCallback } from 'react';
import { supabase, type UserProfile, type AuthUser } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at,
        });
        loadProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at,
        });
        loadProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (authUserId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();

    if (data) {
      setProfile(data as UserProfile);
    }
    setLoading(false);
  };

  const signUp = useCallback(async (email: string, password: string, name: string, role: 'poster' | 'finder' | 'both' = 'both') => {
    setError(null);
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return { success: false, error: authError.message };
    }

    if (!authData.user) {
      setError('Failed to create account');
      setLoading(false);
      return { success: false, error: 'Failed to create account' };
    }

    // Create user profile
    const userId = crypto.randomUUID();
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([{
        user_id: userId,
        auth_user_id: authData.user.id,
        email: email,
        name: name,
        role: role,
        campus_location: 'Student Union',
        pay_min: 15,
        pay_max: 50,
        skills_interests: [],
        skills: [],
        onboarding_complete: false,
        balance: 100,
        total_earned: 0,
        total_spent: 0,
      }]);

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return { success: false, error: profileError.message };
    }

    setUser({
      id: authData.user.id,
      email: authData.user.email || '',
      created_at: authData.user.created_at,
    });

    setLoading(false);
    return { success: true };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return { success: false, error: authError.message };
    }

    if (data.user) {
      setUser({
        id: data.user.id,
        email: data.user.email || '',
        created_at: data.user.created_at,
      });
    }

    setLoading(false);
    return { success: true };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const loginAsDemo = useCallback(async (email: string) => {
    // For demo purposes, we fetch the profile by email and set it directly
    // In production, this would use proper auth
    setError(null);
    setLoading(true);

    const { data, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (profileError || !data) {
      setError('Demo profile not found');
      setLoading(false);
      return { success: false, error: 'Demo profile not found' };
    }

    // Create a pseudo auth user for demo
    const demoAuthUser: AuthUser = {
      id: (data as UserProfile).auth_user_id || crypto.randomUUID(),
      email: (data as UserProfile).email,
      created_at: (data as UserProfile).created_at,
    };

    setUser(demoAuthUser);
    setProfile(data as UserProfile);
    setLoading(false);

    // Store in localStorage for persistence
    localStorage.setItem('demo_user', JSON.stringify(demoAuthUser));
    localStorage.setItem('demo_profile', JSON.stringify(data));

    return { success: true };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Check for demo user on mount
  useEffect(() => {
    const demoUser = localStorage.getItem('demo_user');
    const demoProfile = localStorage.getItem('demo_profile');

    if (demoUser && demoProfile) {
      setUser(JSON.parse(demoUser));
      setProfile(JSON.parse(demoProfile));
      setLoading(false);
    }
  }, []);

  return {
    user,
    profile,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    loginAsDemo,
    clearError,
    refreshProfile: user ? () => loadProfile(user.id) : undefined,
  };
}

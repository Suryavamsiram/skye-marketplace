Here's all the code as pure text:

FILE 1: /app/src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase, type UserProfile, type AuthUser } from '../lib/supabase';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check active session FIRST (before demo data)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Clear demo data if real user is authenticated
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_profile');
        
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          created_at: session.user.created_at,
        });
        loadProfile(session.user.id);
      } else {
        // Only check demo data if no real session exists
        const demoUser = localStorage.getItem('demo_user');
        const demoProfile = localStorage.getItem('demo_profile');

        if (demoUser && demoProfile) {
          setUser(JSON.parse(demoUser));
          setProfile(JSON.parse(demoProfile));
        }
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        // Clear demo data on auth change
        localStorage.removeItem('demo_user');
        localStorage.removeItem('demo_profile');
        
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

    // Clear any demo user data before real login
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_profile');

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
    // Clear demo data on logout
    localStorage.removeItem('demo_user');
    localStorage.removeItem('demo_profile');
    setUser(null);
    setProfile(null);
  }, []);

  const loginAsDemo = useCallback(async (email: string) => {
    // For demo purposes, we fetch the profile by email and set it directly
    setError(null);
    setLoading(true);

    // Clear any existing auth session first
    await supabase.auth.signOut();

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

    const profileData = data as UserProfile;

    // Create a pseudo auth user for demo
    const demoAuthUser: AuthUser = {
      id: profileData.auth_user_id || crypto.randomUUID(),
      email: profileData.email,
      created_at: profileData.created_at,
    };

    // Store in localStorage for persistence
    localStorage.setItem('demo_user', JSON.stringify(demoAuthUser));
    localStorage.setItem('demo_profile', JSON.stringify(profileData));

    setUser(demoAuthUser);
    setProfile(profileData);
    setLoading(false);

    return { success: true };
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Removed duplicate demo user check - now handled in main useEffect

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
FILE 2: /app/src/hooks/useAppState.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase, type UserProfile, type Gig, type GigMatch, type ChatMessage } from '../lib/supabase';

const ANONYMOUS_USER_KEY = 'milo_anon_user_id';

function getOrCreateAnonUserId(): string {
  let id = localStorage.getItem(ANONYMOUS_USER_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_USER_KEY, id);
  }
  return id;
}

export function useAppState() {
  const [userId] = useState<string>(getOrCreateAnonUserId);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeGigs, setActiveGigs] = useState<Gig[]>([]);
  const [matches, setMatches] = useState<GigMatch[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [profileRes, gigsRes, messagesRes] = await Promise.all([
        supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
        supabase.from('gigs').select('*').eq('user_id', userId).in('status', ['open', 'matched', 'in_progress']).order('created_at', { ascending: false }),
        supabase.from('chat_messages').select('*').eq('user_id', userId).order('created_at', { ascending: true }).limit(100),
      ]);

      if (profileRes.data) setProfile(profileRes.data as UserProfile);
      if (gigsRes.data) setActiveGigs(gigsRes.data as Gig[]);
      if (messagesRes.data) setMessages(messagesRes.data as ChatMessage[]);

      setLoading(false);
    }
    load();
  }, [userId]);

  const saveProfile = useCallback(async (data: Partial<Omit<UserProfile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    const payload = { ...data, user_id: userId };
    const { data: saved, error } = await supabase
      .from('user_profiles')
      .upsert([payload], { onConflict: 'user_id' })
      .select()
      .single();

    if (!error && saved) setProfile(saved as UserProfile);
    return { error };
  }, [userId]);

  const addMessage = useCallback(async (msg: Omit<ChatMessage, 'id' | 'user_id' | 'created_at'>) => {
    const optimistic: ChatMessage = {
      ...msg,
      id: crypto.randomUUID(),
      user_id: userId,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);

    await supabase.from('chat_messages').insert([{ ...msg, user_id: userId }]);
  }, [userId]);

  const saveGig = useCallback(async (gig: Omit<Gig, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    const { data, error } = await supabase
      .from('gigs')
      .insert([{ ...gig, user_id: userId }])
      .select()
      .single();

    if (!error && data) {
      setActiveGigs((prev) => [data as Gig, ...prev]);
      return { data: data as Gig, error: null };
    }
    return { data: null, error };
  }, [userId]);

  const saveMatches = useCallback(async (gigId: string, incomingMatches: GigMatch[]) => {
    const rows = incomingMatches.map((m) => ({ ...m, gig_id: gigId, user_id: userId }));
    await supabase.from('gig_matches').insert(rows);
    setMatches((prev) => [...incomingMatches, ...prev]);
  }, [userId]);

  const updateMatchDecision = useCallback(async (matchId: string, decision: 'accepted' | 'rejected') => {
    const match = matches.find((m) => m.id === matchId);
    
    if (decision === 'accepted' && match) {
      // Auto-decline all other matches for the same gig
      const otherMatches = matches.filter((m) => m.gig_id === match.gig_id && m.id !== matchId);
      
      // Update the accepted match
      await supabase.from('gig_matches').update({ decision: 'accepted', escrow_status: 'held' }).eq('id', matchId);
      
      // Auto-reject all other matches for this gig
      if (otherMatches.length > 0) {
        const otherMatchIds = otherMatches.map(m => m.id);
        await supabase.from('gig_matches').update({ decision: 'rejected', escrow_status: 'pending' }).in('id', otherMatchIds);
      }
      
      // Update gig status
      await supabase.from('gigs').update({ status: 'matched', escrow_held: true, escrow_amount: match.pay_max }).eq('id', match.gig_id);
      
      // Update local state - accept the selected match and reject others
      setMatches((prev) => prev.map((m) => {
        if (m.gig_id === match.gig_id) {
          if (m.id === matchId) {
            return { ...m, decision: 'accepted', escrow_status: 'held' };
          } else {
            return { ...m, decision: 'rejected', escrow_status: 'pending' };
          }
        }
        return m;
      }));
      
      setActiveGigs((prev) => prev.map((g) => 
        g.id === match.gig_id ? { ...g, status: 'matched', escrow_held: true, escrow_amount: match.pay_max } : g
      ));
    } else {
      // Just reject this single match
      await supabase.from('gig_matches').update({ decision, escrow_status: 'pending' }).eq('id', matchId);
      setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, decision, escrow_status: 'pending' } : m));
    }
  }, [matches]);

  const releaseEscrow = useCallback(async (matchId: string) => {
    await supabase.from('gig_matches').update({ escrow_status: 'released' }).eq('id', matchId);
    setMatches((prev) => prev.map((m) => m.id === matchId ? { ...m, escrow_status: 'released' } : m));
  }, []);

  const totalEscrow = activeGigs.reduce((sum, g) => sum + (g.escrow_held && !g.escrow_released ? g.escrow_amount : 0), 0);

  return {
    userId,
    profile,
    activeGigs,
    matches,
    messages,
    loading,
    totalEscrow,
    saveProfile,
    addMessage,
    saveGig,
    saveMatches,
    updateMatchDecision,
    releaseEscrow,
  };
}
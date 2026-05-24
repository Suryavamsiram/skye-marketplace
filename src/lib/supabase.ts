import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type UserProfile = {
  id: string;
  user_id: string;
  auth_user_id: string | null;
  email: string;
  name: string;
  role: 'poster' | 'finder' | 'both';
  campus_location: string;
  max_walk_time_mins: 10 | 20 | 40;
  pay_min: number;
  pay_max: number;
  skills_interests: string[];
  onboarding_complete: boolean;
  avatar_url: string | null;
  bio: string;
  latitude: number | null;
  longitude: number | null;
  skills: string[];
  availability: 'flexible' | 'mornings' | 'afternoons' | 'evenings' | 'weekends_only';
  balance: number;
  total_earned: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
};

export type Gig = {
  id: string;
  user_id: string;
  type: 'post' | 'search';
  title: string;
  content: string;
  category: string;
  pay_min: number;
  pay_max: number;
  currency: string;
  campus_location: string;
  is_remote: boolean;
  poster_name: string;
  status: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  escrow_held: boolean;
  escrow_amount: number;
  escrow_released: boolean;
  webhook_payload: Record<string, unknown> | null;
  accepted_by_user_id: string | null;
  accepted_by_name: string;
  started_at: string | null;
  completed_at: string | null;
  contractor_marked_complete: boolean;
  redeems_requested: number;
  created_at: string;
  updated_at: string;
};

export type GigMatch = {
  id: string;
  gig_id: string;
  user_id: string;
  matched_user_name: string;
  matched_user_id: string;
  matched_user_email?: string;
  match_score: number;
  score_breakdown?: {
    skills: { score: number; matched: string[]; missed: string[] };
    location: { score: number; distance: number; maxWalk: number };
    pay: { score: number; gigRange: [number, number]; contractorRange: [number, number] };
    availability: { score: number; compatibility: string };
  };
  title: string;
  category: string;
  pay_min: number;
  pay_max: number;
  campus_location: string;
  walk_time_mins: number;
  description: string;
  decision: 'accepted' | 'rejected' | null;
  escrow_status: 'pending' | 'held' | 'released' | 'disputed';
  contractor_accepted: boolean;
  contractor_accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChatMessage = {
  id: string;
  user_id: string;
  session_id: string | null;
  role: 'user' | 'agent';
  content: string;
  message_type: 'text' | 'match_cards' | 'status' | 'error' | 'telemetry';
  metadata: Record<string, unknown>;
  created_at: string;
};

export type ChatSession = {
  id: string;
  user_id: string;
  session_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
};

export type Transaction = {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'earning' | 'refund';
  amount: number;
  reference_id: string | null;
  reference_type: 'gig' | 'match' | 'deposit' | null;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  description: string;
  created_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
};

// Auth types
export type AuthUser = {
  id: string;
  email: string;
  created_at: string;
};

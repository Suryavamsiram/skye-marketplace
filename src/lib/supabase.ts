import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
const isConfigured = supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co';

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const isRealDatabase = isConfigured;

// Database Types
export type Database = {
  public: {
    Tables: {
      mentors: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          specializations: string[];
          rating: number;
          total_sessions: number;
          status: 'available' | 'busy' | 'offline';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          specializations?: string[];
          rating?: number;
          total_sessions?: number;
          status?: 'available' | 'busy' | 'offline';
          created_at?: string;
          updated_at?: string;
        };
      };
      mentees: {
        Row: {
          id: string;
          name: string;
          email: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      mentorship_requests: {
        Row: {
          id: string;
          mentee_id: string;
          mentor_id: string | null;
          topic: string;
          description: string;
          urgency: 'low' | 'medium' | 'high' | 'critical';
          status: 'pending' | 'finding_mentors' | 'awaiting_acceptance' | 'accepted' | 'active' | 'expired' | 'declined' | 'completed';
          matching_score: number | null;
          time_remaining: number;
          created_at: string;
          accepted_at: string | null;
          expires_at: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          mentee_id: string;
          mentor_id?: string | null;
          topic: string;
          description: string;
          urgency?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'pending' | 'finding_mentors' | 'awaiting_acceptance' | 'accepted' | 'active' | 'expired' | 'declined' | 'completed';
          matching_score?: number | null;
          time_remaining?: number;
          created_at?: string;
          accepted_at?: string | null;
          expires_at?: string | null;
          updated_at?: string;
        };
      };
      system_logs: {
        Row: {
          id: string;
          log_type: 'system' | 'matrix' | 'heartbeat' | 'webhook' | 'error';
          message: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          log_type: 'system' | 'matrix' | 'heartbeat' | 'webhook' | 'error';
          message: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
    };
  };
};

export type Mentor = Database['public']['Tables']['mentors']['Row'];
export type Mentee = Database['public']['Tables']['mentees']['Row'];
export type MentorshipRequest = Database['public']['Tables']['mentorship_requests']['Row'];
export type SystemLog = Database['public']['Tables']['system_logs']['Row'];

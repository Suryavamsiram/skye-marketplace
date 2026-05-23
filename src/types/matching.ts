export type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

export type RequestStatus =
  | 'pending'
  | 'finding_mentors'
  | 'awaiting_acceptance'
  | 'accepted'
  | 'active'
  | 'expired'
  | 'declined'
  | 'completed';

export type MentorStatus = 'available' | 'busy' | 'offline';

export interface MenteeRequest {
  id: string;
  mentee_id: string;
  mentee_name: string;
  topic: string;
  description: string;
  urgency: UrgencyLevel;
  status: RequestStatus;
  created_at: string;
  accepted_at?: string;
  mentor_id?: string;
  matching_score?: number;
  time_remaining?: number;
}

export interface Mentor {
  id: string;
  name: string;
  email: string;
  avatar_url: string;
  specializations: string[];
  rating: number;
  total_sessions: number;
  status: MentorStatus;
  created_at: string;
}

export interface MatchResult {
  request_id: string;
  mentor_id: string;
  mentor: Mentor;
  score: number;
  reasons: string[];
}

export interface SystemLog {
  id: string;
  log_type: 'system' | 'matrix' | 'heartbeat' | 'webhook' | 'error';
  message: string;
  created_at: string;
}

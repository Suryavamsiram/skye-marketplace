import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase, isRealDatabase } from '../lib/supabase';
import type { Mentor, MentorshipRequest } from '../lib/supabase';
import type { MatchResult, UrgencyLevel } from '../types/matching';
import type { RealtimeChannel } from '@supabase/supabase-js';

const generateId = () => crypto.randomUUID();

export function useMatchingEngine() {
  const [currentMentor, setCurrentMentor] = useState<Mentor | null>(null);
  const [activeMatch, setActiveMatch] = useState<MatchResult | null>(null);
  const [isMatchLoading, setIsMatchLoading] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showRadarAlert, setShowRadarAlert] = useState(false);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize mentor from database or show login prompt
  useEffect(() => {
    if (isRealDatabase && supabase) {
      // In production, you would fetch the current mentor based on auth
      // For now, fetch any available mentor for demo
      supabase
        .from('mentors')
        .select('*')
        .eq('status', 'available')
        .maybeSingle()
        .then(({ data }) => {
          if (data) setCurrentMentor(data);
        });

      // Subscribe to real-time changes
      const channel = supabase
        .channel('mentorship_requests')
        .on<MentorshipRequest>(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'mentorship_requests' },
          (payload) => {
            if (payload.new.mentor_id === currentMentor?.id) {
              handleIncomingRequest(payload.new);
            }
          }
        )
        .on<MentorshipRequest>(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'mentorship_requests' },
          (payload) => {
            if (payload.new.status === 'expired' && payload.new.mentor_id === currentMentor?.id) {
              setShowRadarAlert(false);
              setActiveMatch(null);
              if (countdownRef.current) clearInterval(countdownRef.current);
            }
          }
        )
        .subscribe();

      channelRef.current = channel;

      return () => {
        if (channelRef.current && supabase) {
          void supabase.removeChannel(channelRef.current);
        }
      };
    }
  }, [currentMentor?.id]);

  const handleIncomingRequest = (request: MentorshipRequest) => {
    if (!currentMentor) return;

    const matchResult: MatchResult = {
      request_id: request.id,
      mentor_id: request.mentor_id || '',
      mentor: currentMentor,
      score: request.matching_score || 0,
      reasons: ['Specialization match', `Rating: ${currentMentor.rating}`, `Experience: ${currentMentor.total_sessions} sessions`],
    };

    setActiveMatch(matchResult);
    setShowRadarAlert(true);
    setCountdown(request.time_remaining);

    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownRef.current) clearInterval(countdownRef.current);

          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const submitMenteeRequest = useCallback(
    async (
      menteeName: string,
      topic: string,
      description: string,
      urgency: UrgencyLevel
    ): Promise<MentorshipRequest | null> => {
      if (!isRealDatabase || !supabase) {
        console.warn('Database not configured. Please set up Supabase.');
        return null;
      }

      setIsMatchLoading(true);

      try {
        // Create mentee if not exists (in production, use auth)
        const { data: mentee, error: menteeError } = await supabase
          .from('mentees')
          .insert([{ name: menteeName, email: `${Date.now()}@temp.local` }])
          .select()
          .single();

        if (menteeError || !mentee) throw menteeError;

        // Create request
        const { data: request, error: requestError } = await supabase
          .from('mentorship_requests')
          .insert([{
            mentee_id: mentee.id,
            topic,
            description,
            urgency,
            status: 'pending',
          }])
          .select()
          .single();

        if (requestError || !request) throw requestError;

        // Update status to finding_mentors
        await supabase
          .from('mentorship_requests')
          .update({ status: 'finding_mentors' })
          .eq('id', request.id);

        return request;
      } catch (error) {
        console.error('Error submitting request:', error);
        return null;
      } finally {
        setIsMatchLoading(false);
      }
    },
    []
  );

  const acceptMentorship = useCallback(async () => {
    if (!isRealDatabase || !supabase || !activeMatch) return;

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setCountdown(null);
    setShowRadarAlert(false);

    await supabase
      .from('mentorship_requests')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString()
      })
      .eq('id', activeMatch.request_id);

    // Log the action
    await supabase
      .from('system_logs')
      .insert([{
        log_type: 'system',
        message: `Mentor accepted request ${activeMatch.request_id}`,
      }]);
  }, [activeMatch]);

  const declineMentorship = useCallback(async () => {
    if (!isRealDatabase || !supabase || !activeMatch) return;

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
    }
    setCountdown(null);
    setShowRadarAlert(false);

    await supabase
      .from('mentorship_requests')
      .update({ status: 'expired' })
      .eq('id', activeMatch.request_id);

    setActiveMatch(null);
  }, [activeMatch]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    currentMentor,
    activeMatch,
    isMatchLoading,
    countdown,
    showRadarAlert,
    submitMenteeRequest,
    acceptMentorship,
    declineMentorship,
  };
}

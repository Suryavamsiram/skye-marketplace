import { useState, useCallback } from 'react';
import { supabase, type ChatSession, type ChatMessage } from '../lib/supabase';

export function useChatSessions(userId: string | null) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSessions = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    const { data } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (data) {
      setSessions(data as ChatSession[]);

      // Set current session to most recent
      if (data.length > 0 && !currentSessionId) {
        const activeSession = data.find((s) => s.is_active);
        setCurrentSessionId(activeSession?.id || data[0].id);
      }
    }
    setLoading(false);
  }, [userId, currentSessionId]);

  const loadSessionMessages = useCallback(async (sessionId: string) => {
    if (!userId || !sessionId) return;

    setLoading(true);
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (data) {
      setMessages(data as ChatMessage[]);
    }
    setLoading(false);
  }, [userId]);

  const createSession = useCallback(async (sessionName?: string) => {
    if (!userId) return null;

    const timestamp = new Date().toISOString();
    const name = sessionName || 'Chat ' + new Date().toLocaleString();

    const { data, error } = await supabase
      .from('chat_sessions')
      .insert([{
        user_id: userId,
        session_name: name,
        is_active: true,
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    const newSession = data as ChatSession;
    setSessions((prev) => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMessages([]);
    return newSession;
  }, [userId]);

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!userId) return false;

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId);

    if (!error) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      if (currentSessionId === sessionId) {
        const remainingSessions = sessions.filter((s) => s.id !== sessionId);
        if (remainingSessions.length > 0) {
          setCurrentSessionId(remainingSessions[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
      return true;
    }
    return false;
  }, [userId, sessions, currentSessionId]);

  const switchSession = useCallback(async (sessionId: string) => {
    setCurrentSessionId(sessionId);
    await loadSessionMessages(sessionId);

    // Update active session
    await supabase
      .from('chat_sessions')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', sessionId);
  }, [loadSessionMessages]);

  const addMessage = useCallback(async (message: Omit<ChatMessage, 'id' | 'user_id' | 'created_at' | 'session_id'>) => {
    if (!userId || !currentSessionId) return null;

    const optimisticMessage: ChatMessage = {
      ...message,
      id: crypto.randomUUID(),
      user_id: userId,
      session_id: currentSessionId,
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    const { data, error } = await supabase
      .from('chat_messages')
      .insert([{
        user_id: userId,
        session_id: currentSessionId,
        role: message.role,
        content: message.content,
        message_type: message.message_type,
        metadata: message.metadata,
      }])
      .select()
      .single();

    if (!error && data) {
      // Update session timestamp
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', currentSessionId);

      return data as ChatMessage;
    }

    return null;
  }, [userId, currentSessionId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    sessions,
    currentSessionId,
    messages,
    loading,
    loadSessions,
    loadSessionMessages,
    createSession,
    deleteSession,
    switchSession,
    addMessage,
    clearMessages,
    setCurrentSessionId,
  };
}

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Loader2, Sparkles, MapPin, DollarSign, TrendingUp, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import { supabase, type UserProfile, type Gig, type GigMatch, type ChatSession } from '../lib/supabase';
import { useChatSessions } from '../hooks/useChatSessions';

interface ChatPageProps {
  profile: UserProfile;
  userId: string;
}

type ChatEntry = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  type: 'text' | 'telemetry' | 'match_cards' | 'status' | 'error';
  matches?: GigMatch[];
  showTelemetry?: boolean;
  timestamp: Date;
};

export function ChatPage({ profile, userId }: ChatPageProps) {
  const {
    sessions,
    currentSessionId,
    messages,
    loading: sessionLoading,
    loadSessions,
    createSession,
    deleteSession,
    switchSession,
    addMessage,
    setCurrentSessionId,
  } = useChatSessions(userId);

  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [phase, setPhase] = useState<'mode_select' | 'collecting' | 'submitted' | 'browsing_matches'>('mode_select');
  const [gigData, setGigData] = useState<any>({ mode: null, category: null, title: '', pay_min: null, pay_max: null, campus_location: '' });
  const [currentGigId, setCurrentGigId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showSessions, setShowSessions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    }
  }, [sessions, createSession]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  // Load messages from database when session changes
  useEffect(() => {
    if (currentSessionId && messages.length > 0) {
      const chatEntries: ChatEntry[] = messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        type: m.message_type as ChatEntry['type'],
        timestamp: new Date(m.created_at),
      }));
      setEntries(chatEntries.length > 0 ? chatEntries : [makeEntry('agent', "Hey " + profile.name + "! I'm Milo. I can help you post a gig (need something done) or find gigs (earn money). What sounds good?")]);
    } else if (entries.length === 0) {
      setEntries([makeEntry('agent', "Hey " + profile.name + "! I'm Milo. I can help you post a gig (need something done) or find gigs (earn money). What sounds good?")]);
    }
  }, [currentSessionId, messages, profile.name]);

  // Voice typing setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      rec.onerror = () => {
        setIsRecording(false);
      };

      setRecognition(rec);
    }
  }, []);

  function makeEntry(role: 'user' | 'agent', content: string, type: ChatEntry['type'] = 'text', extra?: Partial<ChatEntry>): ChatEntry {
    return { id: crypto.randomUUID(), role, content, type, timestamp: new Date(), ...extra };
  }

  const toggleRecording = useCallback(() => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      recognition.start();
      setIsRecording(true);
    }
  }, [recognition, isRecording]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userText = input.trim();
    setInput('');
    setEntries((prev) => [...prev, makeEntry('user', userText)]);
    await addMessage({ role: 'user', content: userText, message_type: 'text', metadata: {} });

    setIsThinking(true);
    await processUserMessage(userText);
    setIsThinking(false);
  };

  const processUserMessage = async (text: string) => {
    const lower = text.toLowerCase();

    // Detect mode
    if (phase === 'mode_select') {
      const isPost = lower.includes('post') || lower.includes('need') || lower.includes('help');
      const isSearch = lower.includes('find') || lower.includes('earn') || lower.includes('search') || lower.includes('gig');

      if (isPost) {
        setGigData({ ...gigData, mode: 'post' });
        setPhase('collecting');
        const response = "Great! What kind of help do you need? For example: tutoring, moving furniture, tech support...";
        setEntries((prev) => [...prev, makeEntry('agent', response)]);
        await addMessage({ role: 'agent', content: response, message_type: 'text', metadata: {} });
        return;
      }

      if (isSearch) {
        setGigData({ ...gigData, mode: 'search' });
        setPhase('collecting');
        const response = "Awesome! Let me find some gigs for you. What skills or categories interest you?";
        setEntries((prev) => [...prev, makeEntry('agent', response)]);
        await addMessage({ role: 'agent', content: response, message_type: 'text', metadata: {} });
        return;
      }

      const response = "I can help you post a gig (if you need something done) or find gigs (if you want to earn money). Which one?";
      setEntries((prev) => [...prev, makeEntry('agent', response)]);
      await addMessage({ role: 'agent', content: response, message_type: 'text', metadata: {} });
      return;
    }

    // Collect gig details
    if (phase === 'collecting') {
      // Extract info from text
      let newData = { ...gigData };

      // Detect category
      const categories = ['Tutoring', 'Tech Support', 'Moving', 'Furniture', 'Design', 'Photography', 'Writing', 'Editing', 'Music', 'Fitness', 'Cooking'];
      const detectedCat = categories.find((cat) => lower.includes(cat.toLowerCase()));
      if (detectedCat) {
        newData.category = detectedCat;
        newData.title = newData.title || detectedCat + ' Help';
      }

      // Detect location
      const locations = ['Student Union', 'Library', 'East Hall', 'West Campus', 'North Campus', 'Engineering Quad', 'Gym', 'Downtown'];
      const detectedLoc = locations.find((loc) => lower.includes(loc.toLowerCase()));
      if (detectedLoc) {
        newData.campus_location = detectedLoc;
      }

      // Detect pay
      const payMatch = text.match(/\$(\d+)/);
      if (payMatch) {
        const pay = parseInt(payMatch[1]);
        newData.pay_min = newData.pay_min || pay;
        newData.pay_max = newData.pay_max || pay + 20;
      }

      // Detect confirmation
      if (lower.includes('yes') || lower.includes('correct') || lower.includes('post it')) {
        setGigData(newData);
        setPhase('submitted');

        const confirmResponse = "Perfect! Let me post this and find matches for you...";
        setEntries((prev) => [...prev, makeEntry('agent', confirmResponse)]);
        await addMessage({ role: 'agent', content: confirmResponse, message_type: 'text', metadata: {} });

        await submitGig(newData);
        return;
      }

      setGigData(newData);

      // Ask for next info
      let response = '';
      if (!newData.category) {
        response = "What category does this fall under? For example: Tutoring, Tech Support, Moving, Design...";
      } else if (!newData.campus_location) {
        response = "Where on campus? For example: Student Union, Library, East Hall...";
      } else if (!newData.pay_min) {
        response = "What's your budget? Just tell me a rough amount like $30-50.";
      } else {
        response = "Let me confirm: You need help with " + newData.category + " at " + newData.campus_location + ", paying around $" + newData.pay_min + "-" + (newData.pay_max || (newData.pay_min + 20)) + ". Correct?";
      }

      setEntries((prev) => [...prev, makeEntry('agent', response)]);
      await addMessage({ role: 'agent', content: response, message_type: 'text', metadata: {} });
      return;
    }

    // Default response
    const defaultResponse = "I'm not sure I understood. Want to post a gig or find one?";
    setEntries((prev) => [...prev, makeEntry('agent', defaultResponse)]);
    await addMessage({ role: 'agent', content: defaultResponse, message_type: 'text', metadata: {} });
  };

  const submitGig = async (data: any) => {
    const gigId = crypto.randomUUID();
    setCurrentGigId(gigId);

    // Save gig to DB
    const { data: savedGig } = await supabase
      .from('gigs')
      .insert([{
        user_id: userId,
        type: 'post',
        title: data.title || data.category || 'Campus Gig',
        content: data.category + ' help needed',
        category: data.category || 'Other',
        pay_min: data.pay_min || 20,
        pay_max: data.pay_max || 40,
        currency: 'USD',
        campus_location: data.campus_location || profile.campus_location,
        is_remote: false,
        poster_name: profile.name,
        status: 'open',
      }])
      .select()
      .single();

    const resolvedId = savedGig?.id || gigId;
    setCurrentGigId(resolvedId);

    // Show telemetry
    setEntries((prev) => [...prev, makeEntry('agent', '', 'telemetry', { showTelemetry: true })]);

    // Call match-engine edge function
    try {
      const matchResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/match-engine`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            gig_id: resolvedId,
            user_id: userId,
            category: data.category || 'Other',
            title: data.title || 'Campus Gig',
            content: data.category + ' help needed',
            pay_min: data.pay_min || 20,
            pay_max: data.pay_max || 40,
            campus_location: data.campus_location || profile.campus_location,
            is_remote: false,
          }),
        }
      );

      const matchResult = await matchResponse.json();

      if (matchResult.success && matchResult.matches?.length > 0) {
        const matches = matchResult.matches as GigMatch[];

        // Save matches to DB
        await supabase.from('gig_matches').insert(
          matches.map((m) => ({
            ...m,
            gig_id: resolvedId,
            user_id: userId,
          }))
        );

        const top = matches[0];
        const matchResponse = "Found " + matches.length + " matches! Top pick: **" + top.matched_user_name + "** - " + top.match_score + "% match, " + top.walk_time_mins + " min away. Here are your options:";
        setEntries((prev) => [...prev, makeEntry('agent', matchResponse)]);
        setEntries((prev) => [...prev, makeEntry('agent', '', 'match_cards', { matches: matches.slice(0, 3) })]);
        setPhase('browsing_matches');
      } else {
        const noMatchResponse = "I couldn't find exact matches right now, but your gig has been posted! Check back soon for responses.";
        setEntries((prev) => [...prev, makeEntry('agent', noMatchResponse)]);
        setPhase('mode_select');
      }
    } catch (err) {
      console.error(err);
      const errorResponse = "Something went wrong connecting to the matching service. Your gig is saved though!";
      setEntries((prev) => [...prev, makeEntry('agent', errorResponse, 'error')]);
      setPhase('mode_select');
    }
  };

  const handleAcceptMatch = async (matchId: string, matches: GigMatch[]) => {
    const match = matches.find((m) => m.id === matchId);
    if (!match) return;

    // Check balance
    if (profile.balance < match.pay_max) {
      setEntries((prev) => [...prev, makeEntry('agent', "You need at least $" + match.pay_max + " in your wallet. Add funds first!", 'error')]);
      return;
    }

    // Update match decision
    await supabase
      .from('gig_matches')
      .update({ decision: 'accepted', escrow_status: 'held' })
      .eq('id', matchId);

    // Update gig
    await supabase
      .from('gigs')
      .update({
        status: 'matched',
        accepted_by_user_id: match.matched_user_id,
        accepted_by_name: match.matched_user_name,
        escrow_held: true,
        escrow_amount: match.pay_max,
      })
      .eq('id', match.gig_id);

    // Hold escrow (create transaction)
    await supabase.from('transactions').insert([{
      user_id: userId,
      type: 'escrow_hold',
      amount: match.pay_max,
      reference_id: match.gig_id,
      reference_type: 'gig',
      description: 'Escrow hold for ' + match.title,
    }]);

    // Update balance
    const newBalance = profile.balance - match.pay_max;
    await supabase
      .from('user_profiles')
      .update({ balance: newBalance, total_spent: profile.total_spent + match.pay_max })
      .eq('user_id', userId);

    // Notify contractor
    await supabase.from('notifications').insert([{
      user_id: match.matched_user_id,
      type: 'gig_accepted',
      title: 'You got a gig!',
      message: profile.name + ' accepted you for: ' + match.title,
      data: { gig_id: match.gig_id, match_id: matchId },
    }]);

    const response = "Payment of $" + match.pay_max + " is now held in escrow. " + match.matched_user_name + " has been notified! Your gig is in progress.";
    setEntries((prev) => [...prev, makeEntry('agent', response, 'status')]);
    setPhase('mode_select');
  };

  const handleDeclineMatch = async (matchId: string) => {
    await supabase
      .from('gig_matches')
      .update({ decision: 'rejected' })
      .eq('id', matchId);

    setEntries((prev) => [...prev, makeEntry('agent', "Declined. You can look for other matches or try again later.")]);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 transition-colors">
      {/* Session Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setShowSessions(!showSessions)}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Chats ({sessions.length})
          </button>
          <button
            onClick={() => createSession()}
            className="px-2 py-1 text-xs bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 rounded hover:bg-cyan-100 dark:hover:bg-cyan-950/40"
          >
            + New
          </button>
        </div>

        {showSessions && (
          <div className="mt-2 space-y-1">
            {sessions.map((s) => (
              <div key={s.id} className={`flex items-center justify-between px-2 py-1 rounded-lg text-sm ${currentSessionId === s.id ? 'bg-cyan-50 dark:bg-cyan-950/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <button onClick={() => switchSession(s.id)} className="flex-1 text-left truncate">
                  {s.session_name || 'Chat ' + new Date(s.created_at).toLocaleDateString()}
                </button>
                <button onClick={() => deleteSession(s.id)} className="text-red-500 hover:text-red-700 text-xs">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {entries.map((entry) => (
          <div key={entry.id} className={`flex ${entry.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {entry.type === 'match_cards' && entry.matches ? (
              <div className="w-full max-w-2xl space-y-3">
                {entry.matches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onAccept={() => handleAcceptMatch(match.id, entry.matches!)}
                    onDecline={() => handleDeclineMatch(match.id)}
                  />
                ))}
              </div>
            ) : entry.type === 'telemetry' ? (
              <TelemetryCard gigData={gigData} />
            ) : (
              <div
                className={`max-w-md px-4 py-2.5 rounded-2xl ${
                  entry.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white'
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
                }`}
              >
                <p className="whitespace-pre-wrap text-sm">{entry.content}</p>
              </div>
            )}
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-3 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
          {recognition && (
            <button
              type="button"
              onClick={toggleRecording}
              className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white min-h-[44px] max-h-32"
            rows={1}
            disabled={isThinking}
          />

          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Match Card Component
function MatchCard({ match, onAccept, onDecline }: { match: GigMatch; onAccept: () => void; onDecline: () => void }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {match.matched_user_name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{match.matched_user_name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <TrendingUp className={`w-4 h-4 ${match.match_score >= 80 ? 'text-green-500' : match.match_score >= 60 ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-sm font-medium">{match.match_score}% match</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={onAccept} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg text-sm flex items-center gap-1">
              <Check className="w-4 h-4" /> Accept
            </button>
            <button onClick={onDecline} className="px-3 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
              Decline
            </button>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <span className="flex items-center gap-1"><DollarSign className="w-4 h-4 text-green-500" />${match.pay_min}-${match.pay_max}</span>
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4 text-blue-500" />{match.campus_location}</span>
          <span className="flex items-center gap-1">Walk: {match.walk_time_mins} min</span>
        </div>

        {/* Algorithm Breakdown */}
        <button onClick={() => setShowBreakdown(!showBreakdown)} className="mt-3 text-xs text-cyan-600 dark:text-cyan-400 flex items-center gap-1">
          {showBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          View match reasoning
        </button>

        {showBreakdown && match.score_breakdown && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs space-y-2">
            <p className="font-medium text-slate-700 dark:text-slate-300">Match Score Breakdown:</p>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span>Skills Match</span>
                <span className="font-medium">{match.score_breakdown.skills.score}/40 ({match.score_breakdown.skills.matched.join(', ') || 'none'})</span>
              </div>
              <div className="flex justify-between">
                <span>Location Proximity</span>
                <span className="font-medium">{match.score_breakdown.location.score}/30 ({match.score_breakdown.location.distance} mi away)</span>
              </div>
              <div className="flex justify-between">
                <span>Pay Range Fit</span>
                <span className="font-medium">{match.score_breakdown.pay.score}/20</span>
              </div>
              <div className="flex justify-between">
                <span>Availability</span>
                <span className="font-medium">{match.score_breakdown.availability.score}/10 ({match.score_breakdown.availability.compatibility})</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Telemetry Card Component
function TelemetryCard({ gigData }: { gigData: any }) {
  return (
    <div className="max-w-md bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border border-cyan-200 dark:border-cyan-900 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-cyan-500" />
        <span className="font-medium text-cyan-700 dark:text-cyan-400">Posting Gig...</span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Category</span>
          <span className="font-medium text-slate-900 dark:text-white">{gigData.category || 'Detecting...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Location</span>
          <span className="font-medium text-slate-900 dark:text-white">{gigData.campus_location || 'Detecting...'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-600 dark:text-slate-400">Budget</span>
          <span className="font-medium text-slate-900 dark:text-white">${gigData.pay_min || '?'} - ${gigData.pay_max || '?'}</span>
        </div>
      </div>
    </div>
  );
}

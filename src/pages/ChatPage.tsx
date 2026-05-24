import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Mic, MicOff, Loader2, Sparkles, MapPin, DollarSign, TrendingUp, ChevronDown, ChevronUp, Check, X } from '../lib/lucideIcons';
import { LocalStateManager, DEMO_PROFILES, type DemoProfile, type LocalChatMessage, type LocalGig } from '../lib/localState';
import type { DemoProfile as Profile } from '../lib/localState';

interface ChatPageProps {
  profile: Profile;
  onRefresh?: () => void;
}

type ChatEntry = {
  id: string;
  role: 'user' | 'agent';
  content: string;
  type: 'text' | 'telemetry' | 'match_cards' | 'status' | 'error';
  matches?: MatchData[];
  showTelemetry?: boolean;
  timestamp: Date;
};

type MatchData = DemoProfile & {
  match_score: number;
  score_breakdown: {
    skills: { score: number; matched: string[] };
    location: { score: number; distance: number };
    pay: { score: number };
    availability: { score: number };
  };
};

// API endpoint for matching
const MATCH_API_URL = 'https://skye-web-service.onrender.com/api/milo-agent-match';

export function ChatPage({ profile, onRefresh }: ChatPageProps) {
  const [sessions, setSessions] = useState(() => LocalStateManager.getChatSessions(profile.user_id));
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const s = LocalStateManager.getChatSessions(profile.user_id);
    return s.length > 0 ? s[0].id : null;
  });
  const [entries, setEntries] = useState<ChatEntry[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [phase, setPhase] = useState<'mode_select' | 'collecting' | 'submitted' | 'browsing_matches'>('mode_select');
  const [gigData, setGigData] = useState({ mode: null as 'post' | 'search' | null, category: '', title: '', pay_min: 0, pay_max: 0, campus_location: '' });
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showSessions, setShowSessions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      const messages = LocalStateManager.getChatMessages(profile.user_id, currentSessionId);
      if (messages.length > 0) {
        const chatEntries: ChatEntry[] = messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          type: m.message_type as ChatEntry['type'],
          timestamp: new Date(m.created_at),
        }));
        setEntries(chatEntries);
      } else {
        // Welcome message
        setEntries([makeEntry('agent', "Hey " + profile.name + "! I'm Milo. I can help you post a gig (need something done) or find gigs (earn money). What sounds good?")]);
      }
    } else {
      // Create session if none exists
      const newSession = LocalStateManager.createChatSession(profile.user_id);
      setSessions([newSession, ...sessions]);
      setCurrentSessionId(newSession.id);
      setEntries([makeEntry('agent', "Hey " + profile.name + "! I'm Milo. I can help you post a gig (need something done) or find gigs (earn money). What sounds good?")]);
    }
  }, [currentSessionId, profile.user_id, profile.name]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

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

      rec.onend = () => setIsRecording(false);
      rec.onerror = () => setIsRecording(false);

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
    if (!input.trim() || isThinking || !currentSessionId) return;

    const userText = input.trim();
    setInput('');

    // Add user message
    const userEntry = makeEntry('user', userText);
    setEntries((prev) => [...prev, userEntry]);

    // Save to localStorage
    LocalStateManager.addChatMessage(profile.user_id, {
      session_id: currentSessionId,
      role: 'user',
      content: userText,
      message_type: 'text',
    });

    setIsThinking(true);
    await processUserMessage(userText);
    setIsThinking(false);
  };

  const processUserMessage = async (text: string) => {
    const lower = text.toLowerCase();

    if (phase === 'mode_select') {
      const isPost = lower.includes('post') || lower.includes('need') || lower.includes('help');
      const isSearch = lower.includes('find') || lower.includes('earn') || lower.includes('search') || lower.includes('gig');

      if (isPost) {
        setGigData({ ...gigData, mode: 'post' });
        setPhase('collecting');
        addAgentMessage("Great! What kind of help do you need? For example: tutoring, moving furniture, tech support...");
        return;
      }

      if (isSearch) {
        setGigData({ ...gigData, mode: 'search' });
        setPhase('collecting');
        addAgentMessage("Awesome! Let me find some gigs for you. What skills or categories interest you?");
        return;
      }

      addAgentMessage("I can help you post a gig (if you need something done) or find gigs (if you want to earn money). Which one?");
      return;
    }

    if (phase === 'collecting') {
      let newData = { ...gigData };

      // Extract category
      const categories = ['Tutoring', 'Tech Support', 'Moving', 'Furniture', 'Design', 'Photography', 'Writing', 'Editing', 'Music', 'Fitness', 'Cooking', 'Photography', 'Errands'];
      const detectedCat = categories.find((cat) => lower.includes(cat.toLowerCase()));
      if (detectedCat) {
        newData.category = detectedCat;
        newData.title = newData.title || detectedCat + ' Help';
      }

      // Extract location
      const locations = ['Student Union', 'Library', 'East Hall', 'West Campus', 'North Campus', 'Engineering Quad', 'Music Building', 'Gym', 'Downtown', 'Dorm', 'Remote'];
      const detectedLoc = locations.find((loc) => lower.includes(loc.toLowerCase()));
      if (detectedLoc) {
        newData.campus_location = detectedLoc;
      }

      // Extract pay
      const payMatch = text.match(/\$(\d+)/);
      if (payMatch) {
        const pay = parseInt(payMatch[1]);
        newData.pay_min = newData.pay_min || pay;
        newData.pay_max = newData.pay_max || pay + 20;
      }

      // Check confirmation
      if (lower.includes('yes') || lower.includes('correct') || lower.includes('post it') || lower.includes('looks good')) {
        setGigData(newData);
        setPhase('submitted');
        addAgentMessage("Perfect! Let me post this and find matches for you...");

        await submitGig(newData);
        return;
      }

      setGigData(newData);

      // Ask for missing info
      let response = '';
      if (!newData.category) {
        response = "What category does this fall under? For example: Tutoring, Tech Support, Moving, Design, Photography...";
      } else if (!newData.campus_location) {
        response = "Where on campus? For example: Student Union, Library, East Hall, Engineering Quad, or Remote...";
      } else if (!newData.pay_min) {
        response = "What's your budget? Just tell me a rough amount like $30-50.";
      } else {
        response = "Let me confirm: You need help with " + newData.category + " at " + newData.campus_location + ", paying around $" + newData.pay_min + "-" + (newData.pay_max || newData.pay_min + 20) + ". Sound right?";
      }

      addAgentMessage(response);
      return;
    }

    // Default
    addAgentMessage("I'm not sure I understood. Want to post a gig or find one?");
  };

  const addAgentMessage = (content: string, type: ChatEntry['type'] = 'text', extra?: Partial<ChatEntry>) => {
    const entry = makeEntry('agent', content, type, extra);
    setEntries((prev) => [...prev, entry]);

    // Save to localStorage
    if (currentSessionId) {
      LocalStateManager.addChatMessage(profile.user_id, {
        session_id: currentSessionId,
        role: 'agent',
        content,
        message_type: type,
      });
    }
  };

  const submitGig = async (data: typeof gigData) => {
    // Create gig
    const gig = LocalStateManager.createGig({
      user_id: profile.user_id,
      type: 'post',
      title: data.title || data.category || 'Campus Gig',
      content: 'Help needed with ' + (data.category || 'general task'),
      category: data.category || 'Other',
      pay_min: data.pay_min || 20,
      pay_max: data.pay_max || 40,
      campus_location: data.campus_location || profile.campus_location,
      is_remote: data.campus_location === 'Remote',
      poster_name: profile.name,
      status: 'open',
      escrow_held: false,
      escrow_amount: 0,
      escrow_released: false,
      contractor_marked_complete: false,
    });

    // Show telemetry
    addAgentMessage('', 'telemetry', { showTelemetry: true, content: JSON.stringify({ category: data.category, location: data.campus_location, pay_min: data.pay_min, pay_max: data.pay_max }) });

    // Call matching API
    try {
      let matches: MatchData[] = [];

      // Try Render API first
      try {
        const response = await fetch(MATCH_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gig_id: gig.id,
            user_id: profile.user_id,
            category: gig.category,
            title: gig.title,
            content: gig.content,
            pay_min: gig.pay_min,
            pay_max: gig.pay_max,
            campus_location: gig.campus_location,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.matches && result.matches.length > 0) {
            matches = result.matches.slice(0, 3);
          }
        }
      } catch (apiError) {
        console.log('Render API not available, using local matching');
      }

      // Fallback to local matching if no matches from API
      if (matches.length === 0) {
        const localMatches = LocalStateManager.findMatches(gig.id, profile.user_id);
        matches = localMatches.slice(0, 3) as MatchData[];
      }

      if (matches.length > 0) {
        const top = matches[0];
        addAgentMessage("Found " + matches.length + " matches! Top pick: **" + top.name + "** - " + top.match_score + "% match, available at " + top.campus_location + ". Here are your options:");
        addAgentMessage('', 'match_cards', { matches });
        setPhase('browsing_matches');
      } else {
        addAgentMessage("I couldn't find matches right now, but your gig has been posted! Check Dev Panel to generate sample gigs.");
        setPhase('mode_select');
      }
    } catch (err) {
      console.error(err);
      addAgentMessage("Something went wrong. Your gig is saved though!", 'error');
      setPhase('mode_select');
    }
  };

  const handleAcceptMatch = (match: MatchData) => {
    // Check balance
    if (profile.balance < match.pay_max) {
      addAgentMessage("You need at least $" + match.pay_max + " in your wallet. Add funds in the Wallet tab!", 'error');
      return;
    }

    // Hold escrow
    const success = LocalStateManager.holdEscrow(profile.user_id, match.pay_max, currentSessionId || 'gig');
    if (!success) {
      addAgentMessage("Insufficient balance. Add funds to your wallet first.", 'error');
      return;
    }

    // Update gig
    const gigs = LocalStateManager.getGigs();
    const latestGig = gigs.find(g => g.user_id === profile.user_id && g.status === 'open');
    if (latestGig) {
      LocalStateManager.updateGig(latestGig.id, {
        status: 'matched',
        accepted_by_user_id: match.user_id,
        accepted_by_name: match.name,
        escrow_held: true,
        escrow_amount: match.pay_max,
      });

      // Add transactions
      LocalStateManager.addTransaction(profile.user_id, {
        type: 'escrow_hold',
        amount: match.pay_max,
        description: 'Escrow for ' + match.name,
      });

      addAgentMessage("Payment of $" + match.pay_max + " is now held in escrow. " + match.name + " has been notified! Your gig is in progress. Check Dev Panel to manage it.", 'status');
      setPhase('mode_select');

      // Refresh profile to update balance
      if (onRefresh) onRefresh();
    }
  };

  const handleDeclineMatch = (matchId: string) => {
    addAgentMessage("Declined. Looking for other matches or you can try again.");
  };

  const createNewSession = () => {
    const newSession = LocalStateManager.createChatSession(profile.user_id);
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newSession.id);
    setShowSessions(false);
  };

  const deleteSession = (sessionId: string) => {
    LocalStateManager.deleteChatSession(profile.user_id, sessionId);
    const remaining = sessions.filter(s => s.id !== sessionId);
    setSessions(remaining);

    if (currentSessionId === sessionId) {
      if (remaining.length > 0) {
        setCurrentSessionId(remaining[0].id);
      } else {
        createNewSession();
      }
    }
  };

  const switchSession = (sessionId: string) => {
    setCurrentSessionId(sessionId);
    setShowSessions(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Session Tabs */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button onClick={() => setShowSessions(!showSessions)} className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
            Chats ({sessions.length})
          </button>
          <button onClick={createNewSession} className="px-2 py-1 text-xs bg-cyan-50 dark:bg-cyan-950/20 text-cyan-600 dark:text-cyan-400 rounded hover:bg-cyan-100 dark:hover:bg-cyan-950/40">
            + New
          </button>
        </div>

        {showSessions && (
          <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
            {sessions.map((s) => (
              <div key={s.id} className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-sm ${currentSessionId === s.id ? 'bg-cyan-50 dark:bg-cyan-950/20' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                <button onClick={() => switchSession(s.id)} className="flex-1 text-left truncate text-slate-700 dark:text-slate-300 text-xs">
                  {s.session_name}
                </button>
                <button onClick={() => deleteSession(s.id)} className="text-red-500 hover:text-red-700">
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
                  <MatchCard key={match.user_id} match={match} onAccept={() => handleAcceptMatch(match)} onDecline={() => handleDeclineMatch(match.user_id)} />
                ))}
              </div>
            ) : entry.type === 'telemetry' ? (
              <TelemetryCard gigData={gigData} />
            ) : (
              <div className={`max-w-md px-4 py-2.5 rounded-2xl ${entry.role === 'user' ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white' : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'}`}>
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
            <button type="button" onClick={toggleRecording} className={`p-2.5 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            placeholder="Type your message... (Shift+Enter for new line)"
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl resize-none outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-white min-h-[44px] max-h-32"
            rows={1}
            disabled={isThinking}
          />

          <button type="submit" disabled={!input.trim() || isThinking} className="p-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50">
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

// Match Card Component
function MatchCard({ match, onAccept, onDecline }: { match: MatchData; onAccept: () => void; onDecline: () => void }) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {match.name.charAt(0)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">{match.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <TrendingUp className={`w-4 h-4 ${match.match_score >= 80 ? 'text-green-500' : match.match_score >= 60 ? 'text-amber-500' : 'text-slate-400'}`} />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{match.match_score}% match</span>
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
        </div>

        <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Skills: {match.skills.slice(0, 4).join(', ')}
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
                <span className="font-medium">{match.score_breakdown.skills.score}/40 ({match.score_breakdown.skills.matched.slice(0, 2).join(', ') || 'none'})</span>
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
                <span className="font-medium">{match.score_breakdown.availability.score}/10</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700 font-medium">
                <span>Total</span>
                <span className="text-cyan-600 dark:text-cyan-400">{match.match_score}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Telemetry Card
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

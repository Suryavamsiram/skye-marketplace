// Local State Manager - Works with or without Supabase
// Handles demo profiles, user sessions, gigs, and chat persistence

export interface DemoProfile {
  user_id: string;
  name: string;
  email: string;
  role: 'poster' | 'finder' | 'both';
  campus_location: string;
  skills: string[];
  skills_interests: string[];
  pay_min: number;
  pay_max: number;
  balance: number;
  total_earned: number;
  total_spent: number;
  bio: string;
  availability: 'flexible' | 'mornings' | 'afternoons' | 'evenings' | 'weekends_only';
  max_walk_time_mins: number;
  avatar_url?: string;
}

export interface LocalSession {
  user_id: string;
  name: string;
  email: string;
  is_demo: boolean;
  created_at: string;
}

export interface LocalChatSession {
  id: string;
  user_id: string;
  session_name: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface LocalChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: 'user' | 'agent';
  content: string;
  message_type: 'text' | 'match_cards' | 'status' | 'error' | 'telemetry';
  created_at: string;
}

export interface LocalGig {
  id: string;
  user_id: string;
  type: 'post' | 'search';
  title: string;
  content: string;
  category: string;
  pay_min: number;
  pay_max: number;
  campus_location: string;
  is_remote: boolean;
  poster_name: string;
  status: 'open' | 'matched' | 'in_progress' | 'completed' | 'cancelled';
  escrow_held: boolean;
  escrow_amount: number;
  escrow_released: boolean;
  accepted_by_user_id?: string;
  accepted_by_name?: string;
  contractor_marked_complete: boolean;
  created_at: string;
}

export interface LocalTransaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'escrow_hold' | 'escrow_release' | 'earning' | 'refund';
  amount: number;
  description: string;
  created_at: string;
}

// 20 Demo Profiles
export const DEMO_PROFILES: DemoProfile[] = [
  { user_id: 'demo-001', name: 'Alex Chen', email: 'alex.chen@demo.edu', role: 'both', campus_location: 'Engineering Quad', skills: ['Tech Support', 'Computer Skills', 'Python', 'AI/ML', 'Web Development'], skills_interests: ['Tech Support', 'AI/ML'], pay_min: 30, pay_max: 80, balance: 100, total_earned: 0, total_spent: 0, bio: 'CS major specializing in machine learning. Love helping with tech setups.', availability: 'evenings', max_walk_time_mins: 20 },
  { user_id: 'demo-002', name: 'Maya Patel', email: 'maya.patel@demo.edu', role: 'both', campus_location: 'Library', skills: ['Tutoring', 'Math', 'Physics', 'Calculus', 'Statistics'], skills_interests: ['Tutoring', 'Math'], pay_min: 25, pay_max: 55, balance: 100, total_earned: 0, total_spent: 0, bio: 'Physics grad student. Patient tutor who makes complex concepts simple.', availability: 'afternoons', max_walk_time_mins: 15 },
  { user_id: 'demo-003', name: 'Jordan Smith', email: 'jordan.smith@demo.edu', role: 'both', campus_location: 'Gym', skills: ['Fitness', 'Sports', 'Personal Training', 'Nutrition', 'Weightlifting'], skills_interests: ['Fitness', 'Training'], pay_min: 20, pay_max: 45, balance: 100, total_earned: 0, total_spent: 0, bio: 'Athletic training enthusiast. Can help with workouts and sports skills.', availability: 'mornings', max_walk_time_mins: 20 },
  { user_id: 'demo-004', name: 'Liam Torres', email: 'liam.torres@demo.edu', role: 'both', campus_location: 'Music Building', skills: ['Music', 'Guitar', 'Piano', 'Audio Production', 'Singing'], skills_interests: ['Music', 'Guitar'], pay_min: 30, pay_max: 70, balance: 100, total_earned: 0, total_spent: 0, bio: 'Music producer and multi-instrumentalist. Teaching is my passion.', availability: 'flexible', max_walk_time_mins: 20 },
  { user_id: 'demo-005', name: 'Priya Rao', email: 'priya.rao@demo.edu', role: 'both', campus_location: 'Design Studio', skills: ['Design', 'Graphic Design', 'Illustration', 'Photoshop', 'Figma'], skills_interests: ['Design', 'Creative'], pay_min: 40, pay_max: 120, balance: 100, total_earned: 0, total_spent: 0, bio: 'Art student with love for visual storytelling. Logo design expert.', availability: 'evenings', max_walk_time_mins: 25 },
  { user_id: 'demo-006', name: 'Sam Williams', email: 'sam.williams@demo.edu', role: 'both', campus_location: 'Library', skills: ['Writing', 'Editing', 'Proofreading', 'Research', 'English'], skills_interests: ['Writing', 'Editing'], pay_min: 15, pay_max: 40, balance: 100, total_earned: 0, total_spent: 0, bio: 'English literature major. Expert editor and research assistant.', availability: 'flexible', max_walk_time_mins: 15 },
  { user_id: 'demo-007', name: 'Nina Kowalski', email: 'nina.kowalski@demo.edu', role: 'both', campus_location: 'North Campus', skills: ['Photography', 'Videography', 'Social Media', 'Content Creation', 'Editing'], skills_interests: ['Photography', 'Events'], pay_min: 50, pay_max: 200, balance: 100, total_earned: 0, total_spent: 0, bio: 'Photography enthusiast capturing life moments. Event specialist.', availability: 'weekends_only', max_walk_time_mins: 30 },
  { user_id: 'demo-008', name: 'David Kim', email: 'david.kim@demo.edu', role: 'both', campus_location: 'West Campus', skills: ['Cooking', 'Meal Prep', 'Baking', 'Nutrition', 'Recipe Development'], skills_interests: ['Cooking', 'Meal Prep'], pay_min: 35, pay_max: 90, balance: 100, total_earned: 0, total_spent: 0, bio: 'Self-taught chef who loves meal prep. Healthy, affordable, delicious.', availability: 'evenings', max_walk_time_mins: 20 },
  { user_id: 'demo-009', name: 'Emma Johnson', email: 'emma.johnson@demo.edu', role: 'both', campus_location: 'East Hall', skills: ['Moving', 'Heavy Lifting', 'Furniture Assembly', 'Organization', 'Packing'], skills_interests: ['Moving', 'Furniture Assembly'], pay_min: 25, pay_max: 70, balance: 100, total_earned: 0, total_spent: 0, bio: 'Strong and reliable. No job too big or small for hauling.', availability: 'weekends_only', max_walk_time_mins: 25 },
  { user_id: 'demo-010', name: 'Raj Patel', email: 'raj.patel@demo.edu', role: 'both', campus_location: 'Tech Center', skills: ['Tech Support', 'Phone Setup', 'Smart Home', 'Gaming', 'Networking'], skills_interests: ['Tech Support', 'Gaming'], pay_min: 35, pay_max: 85, balance: 100, total_earned: 0, total_spent: 0, bio: 'Tech wizard. Smart home setups, gaming rigs, networking expert.', availability: 'afternoons', max_walk_time_mins: 20 },
  { user_id: 'demo-011', name: 'Sofia Martinez', email: 'sofia.martinez@demo.edu', role: 'both', campus_location: 'Student Union', skills: ['Language Learning', 'Spanish', 'Translation', 'Conversation Practice', 'ESL'], skills_interests: ['Language Learning', 'Spanish'], pay_min: 20, pay_max: 50, balance: 100, total_earned: 0, total_spent: 0, bio: 'Native Spanish speaker. Love helping people practice languages.', availability: 'flexible', max_walk_time_mins: 15 },
  { user_id: 'demo-012', name: 'Marcus Thompson', email: 'marcus.thompson@demo.edu', role: 'both', campus_location: 'Sports Complex', skills: ['Basketball', 'Soccer', 'Coaching', 'Athletic Training', 'Team Sports'], skills_interests: ['Sports', 'Coaching'], pay_min: 25, pay_max: 60, balance: 100, total_earned: 0, total_spent: 0, bio: 'Former college athlete. Can coach basketball, soccer, or general fitness.', availability: 'mornings', max_walk_time_mins: 15 },
  { user_id: 'demo-013', name: 'Aisha Okonkwo', email: 'aisha.okonkwo@demo.edu', role: 'both', campus_location: 'Dorm Room', skills: ['Organization', 'Decluttering', 'Interior Design', 'Space Planning', 'Styling'], skills_interests: ['Organization', 'Interior Design'], pay_min: 30, pay_max: 65, balance: 100, total_earned: 0, total_spent: 0, bio: 'Professional organizer helping students maximize small spaces.', availability: 'weekends_only', max_walk_time_mins: 25 },
  { user_id: 'demo-014', name: 'Tyler Green', email: 'tyler.green@demo.edu', role: 'both', campus_location: 'Downtown', skills: ['Errands', 'Delivery', 'Shopping', 'Pickup', 'Transportation'], skills_interests: ['Errands', 'Delivery'], pay_min: 15, pay_max: 40, balance: 100, total_earned: 0, total_spent: 0, bio: 'Have a car and know the city well. Quick errands across town.', availability: 'flexible', max_walk_time_mins: 30 },
  { user_id: 'demo-015', name: 'Olivia Brown', email: 'olivia.brown@demo.edu', role: 'both', campus_location: 'Library', skills: ['Statistics', 'Data Analysis', 'Excel', 'R Programming', 'Research'], skills_interests: ['Math', 'Statistics'], pay_min: 25, pay_max: 55, balance: 100, total_earned: 0, total_spent: 0, bio: 'Statistics major who lives in spreadsheets. Data analysis expert.', availability: 'afternoons', max_walk_time_mins: 15 },
  { user_id: 'demo-016', name: 'Ethan Wright', email: 'ethan.wright@demo.edu', role: 'both', campus_location: 'Engineering Quad', skills: ['3D Printing', 'CAD Design', 'Prototyping', 'Electronics', 'Arduino'], skills_interests: ['Tech Support', 'Electronics'], pay_min: 40, pay_max: 100, balance: 100, total_earned: 0, total_spent: 0, bio: 'Engineering enthusiast with 3D printing expertise. Can prototype anything.', availability: 'evenings', max_walk_time_mins: 20 },
  { user_id: 'demo-017', name: 'Zara Ahmed', email: 'zara.ahmed@demo.edu', role: 'both', campus_location: 'Art Building', skills: ['Painting', 'Drawing', 'Art', 'Portraits', 'Creativity'], skills_interests: ['Design', 'Art'], pay_min: 35, pay_max: 80, balance: 100, total_earned: 0, total_spent: 0, bio: 'Fine arts major specializing in portraits and custom artwork.', availability: 'weekends_only', max_walk_time_mins: 25 },
  { user_id: 'demo-018', name: 'Ryan Foster', email: 'ryan.foster@demo.edu', role: 'both', campus_location: 'Health Center', skills: ['First Aid', 'CPR', 'Babysitting', 'Pet Care', 'Elderly Care'], skills_interests: ['Caregiving', 'Pet Care'], pay_min: 20, pay_max: 45, balance: 100, total_earned: 0, total_spent: 0, bio: 'CPR certified caregiver. Great with kids, pets, and elderly.', availability: 'flexible', max_walk_time_mins: 20 },
  { user_id: 'demo-019', name: 'Mia Chang', email: 'mia.chang@demo.edu', role: 'both', campus_location: 'Coffee Shop', skills: ['Event Planning', 'Social Media', 'Marketing', 'Promotion', 'Organization'], skills_interests: ['Event Planning', 'Marketing'], pay_min: 25, pay_max: 75, balance: 100, total_earned: 0, total_spent: 0, bio: 'Event planning wiz. Can organize and promote campus events.', availability: 'afternoons', max_walk_time_mins: 15 },
  { user_id: 'demo-020', name: 'Lucas Reed', email: 'lucas.reed@demo.edu', role: 'both', campus_location: 'Engineering Quad', skills: ['Mechanic', 'Car Repair', 'Bicycle Repair', 'Maintenance', 'Tools'], skills_interests: ['Mechanic', 'Repair'], pay_min: 30, pay_max: 90, balance: 100, total_earned: 0, total_spent: 0, bio: 'Mechanical genius. Car repair, bike maintenance, anything with tools.', availability: 'weekends_only', max_walk_time_mins: 30 },
];

// Storage Keys
const SESSION_KEY = 'milo_session';
const CHAT_SESSIONS_KEY = 'milo_chat_sessions';
const CHAT_MESSAGES_KEY = 'milo_chat_messages';
const GIGS_KEY = 'milo_gigs';
const TRANSACTIONS_KEY = 'milo_transactions';
const USER_PROFILE_KEY = 'milo_user_profile';

export class LocalStateManager {
  // Session Management
  static getSession(): LocalSession | null {
    const stored = localStorage.getItem(SESSION_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  static setSession(session: LocalSession): void {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  static clearSession(): void {
    localStorage.removeItem(SESSION_KEY);
  }

  static isDemoUser(userId: string): boolean {
    return userId.startsWith('demo-');
  }

  // User Profile (for real users or demo users)
  static getUserProfile(userId: string): DemoProfile | null {
    // If demo user, return from DEMO_PROFILES
    if (this.isDemoUser(userId)) {
      return DEMO_PROFILES.find(p => p.user_id === userId) || null;
    }

    // For real users, get from localStorage
    const stored = localStorage.getItem(USER_PROFILE_KEY + '_' + userId);
    return stored ? JSON.parse(stored) : null;
  }

  static setUserProfile(userId: string, profile: Partial<DemoProfile>): void {
    if (this.isDemoUser(userId)) return; // Don't modify demo profiles
    const existing = this.getUserProfile(userId) || {};
    localStorage.setItem(USER_PROFILE_KEY + '_' + userId, JSON.stringify({ ...existing, ...profile }));
  }

  // Chat Sessions
  static getChatSessions(userId: string): LocalChatSession[] {
    const stored = localStorage.getItem(CHAT_SESSIONS_KEY + '_' + userId);
    return stored ? JSON.parse(stored) : [];
  }

  static createChatSession(userId: string, name?: string): LocalChatSession {
    const sessions = this.getChatSessions(userId);
    const session: LocalChatSession = {
      id: 'session-' + crypto.randomUUID(),
      user_id: userId,
      session_name: name || 'Chat ' + new Date().toLocaleTimeString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    };
    sessions.unshift(session);
    localStorage.setItem(CHAT_SESSIONS_KEY + '_' + userId, JSON.stringify(sessions));
    return session;
  }

  static deleteChatSession(userId: string, sessionId: string): void {
    let sessions = this.getChatSessions(userId);
    sessions = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(CHAT_SESSIONS_KEY + '_' + userId, JSON.stringify(sessions));

    // Also delete messages for this session
    const messages = this.getChatMessages(userId);
    const filtered = messages.filter(m => m.session_id !== sessionId);
    localStorage.setItem(CHAT_MESSAGES_KEY + '_' + userId, JSON.stringify(filtered));
  }

  // Chat Messages
  static getChatMessages(userId: string, sessionId?: string): LocalChatMessage[] {
    const stored = localStorage.getItem(CHAT_MESSAGES_KEY + '_' + userId);
    const messages: LocalChatMessage[] = stored ? JSON.parse(stored) : [];
    return sessionId ? messages.filter(m => m.session_id === sessionId) : messages;
  }

  static addChatMessage(userId: string, message: Omit<LocalChatMessage, 'id' | 'created_at'>): LocalChatMessage {
    const messages = this.getChatMessages(userId);
    const newMessage: LocalChatMessage = {
      ...message,
      id: 'msg-' + crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    messages.push(newMessage);
    localStorage.setItem(CHAT_MESSAGES_KEY + '_' + userId, JSON.stringify(messages));
    return newMessage;
  }

  // Gigs
  static getGigs(): LocalGig[] {
    const stored = localStorage.getItem(GIGS_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  static getGig(id: string): LocalGig | null {
    const gigs = this.getGigs();
    return gigs.find(g => g.id === id) || null;
  }

  static createGig(gig: Omit<LocalGig, 'id' | 'created_at'>): LocalGig {
    const gigs = this.getGigs();
    const newGig: LocalGig = {
      ...gig,
      id: 'gig-' + crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    gigs.unshift(newGig);
    localStorage.setItem(GIGS_KEY, JSON.stringify(gigs));
    return newGig;
  }

  static updateGig(id: string, updates: Partial<LocalGig>): LocalGig | null {
    const gigs = this.getGigs();
    const index = gigs.findIndex(g => g.id === id);
    if (index === -1) return null;
    gigs[index] = { ...gigs[index], ...updates };
    localStorage.setItem(GIGS_KEY, JSON.stringify(gigs));
    return gigs[index];
  }

  static getAvailableGigs(userId: string): LocalGig[] {
    return this.getGigs().filter(g => g.status === 'open' && g.user_id !== userId);
  }

  static getMyPostedGigs(userId: string): LocalGig[] {
    return this.getGigs().filter(g => g.user_id === userId);
  }

  static getMyAcceptedGigs(userId: string): LocalGig[] {
    return this.getGigs().filter(g => g.accepted_by_user_id === userId);
  }

  // Transactions
  static getTransactions(userId: string): LocalTransaction[] {
    const stored = localStorage.getItem(TRANSACTIONS_KEY + '_' + userId);
    return stored ? JSON.parse(stored) : [];
  }

  static addTransaction(userId: string, transaction: Omit<LocalTransaction, 'id' | 'created_at'>): LocalTransaction {
    const transactions = this.getTransactions(userId);
    const newTx: LocalTransaction = {
      ...transaction,
      id: 'tx-' + crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };
    transactions.unshift(newTx);
    localStorage.setItem(TRANSACTIONS_KEY + '_' + userId, JSON.stringify(transactions));
    return newTx;
  }

  // Wallet Operations
  static addToBalance(userId: string, amount: number): number {
    const profile = this.getUserProfile(userId);
    if (!profile) return 0;

    const newBalance = profile.balance + amount;
    if (this.isDemoUser(userId)) {
      // Update in-memory (demo profiles are read-only in localStorage)
      const profileIndex = DEMO_PROFILES.findIndex(p => p.user_id === userId);
      if (profileIndex !== -1) {
        DEMO_PROFILES[profileIndex].balance = newBalance;
      }
    } else {
      this.setUserProfile(userId, { balance: newBalance });
    }

    this.addTransaction(userId, {
      type: 'deposit',
      amount,
      description: 'Added funds to wallet',
    });

    return newBalance;
  }

  static holdEscrow(userId: string, amount: number, gigId: string): boolean {
    const profile = this.getUserProfile(userId);
    if (!profile || profile.balance < amount) return false;

    const newBalance = profile.balance - amount;
    if (this.isDemoUser(userId)) {
      const profileIndex = DEMO_PROFILES.findIndex(p => p.user_id === userId);
      if (profileIndex !== -1) {
        DEMO_PROFILES[profileIndex].balance = newBalance;
      }
    } else {
      this.setUserProfile(userId, { balance: newBalance, total_spent: profile.total_spent + amount });
    }

    this.addTransaction(userId, {
      type: 'escrow_hold',
      amount,
      description: 'Escrow hold for gig ' + gigId,
    });

    return true;
  }

  static releaseEscrow(posterId: string, contractorId: string, amount: number, gigId: string): void {
    // Credit contractor
    const contractorProfile = this.getUserProfile(contractorId);
    if (contractorProfile) {
      if (this.isDemoUser(contractorId)) {
        const profileIndex = DEMO_PROFILES.findIndex(p => p.user_id === contractorId);
        if (profileIndex !== -1) {
          DEMO_PROFILES[profileIndex].balance = (DEMO_PROFILES[profileIndex].balance || 0) + amount;
          DEMO_PROFILES[profileIndex].total_earned = (DEMO_PROFILES[profileIndex].total_earned || 0) + amount;
        }
      } else {
        this.setUserProfile(contractorId, {
          balance: contractorProfile.balance + amount,
          total_earned: contractorProfile.total_earned + amount,
        });
      }
    }

    // Add transaction for both
    this.addTransaction(contractorId, {
      type: 'earning',
      amount,
      description: 'Completed gig ' + gigId,
    });

    this.addTransaction(posterId, {
      type: 'escrow_release',
      amount,
      description: 'Payment released for gig ' + gigId,
    });
  }

  // Sample Gigs Generator
  static generateSampleGigs(count: number = 3): LocalGig[] {
    const templates = [
      { category: 'Tutoring', title: 'Need Help with Calculus', pay_min: 25, pay_max: 45, location: 'Library' },
      { category: 'Tech Support', title: 'MacBook Setup Help', pay_min: 30, pay_max: 50, location: 'Dorm Room' },
      { category: 'Moving', title: 'Moving Boxes to Storage', pay_min: 40, pay_max: 70, location: 'East Hall' },
      { category: 'Design', title: 'Logo for Student Club', pay_min: 50, pay_max: 100, location: 'Remote' },
      { category: 'Photography', title: 'Graduation Photos', pay_min: 60, pay_max: 150, location: 'Outdoor Campus' },
      { category: 'Writing', title: 'Essay Proofreading', pay_min: 20, pay_max: 40, location: 'Library' },
      { category: 'Errands', title: 'Grocery Pickup', pay_min: 15, pay_max: 30, location: 'Downtown' },
      { category: 'Music', title: 'Guitar Lessons', pay_min: 30, pay_max: 60, location: 'Music Building' },
      { category: 'Fitness', title: 'Gym Training Partner', pay_min: 20, pay_max: 40, location: 'Gym' },
      { category: 'Cooking', title: 'Meal Prep for Finals', pay_min: 50, pay_max: 90, location: 'Dorm Kitchen' },
    ];

    const posterNames = ['Taylor M.', 'Casey B.', 'Jamie R.', 'Morgan K.', 'Quinn P.'];
    const createdGigs: LocalGig[] = [];

    for (let i = 0; i < count; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const gig = this.createGig({
        user_id: 'sample-' + crypto.randomUUID(),
        type: 'post',
        title: template.title,
        content: 'Looking for someone to help with ' + template.category.toLowerCase() + '.',
        category: template.category,
        pay_min: template.pay_min,
        pay_max: template.pay_max,
        campus_location: template.location,
        is_remote: template.location === 'Remote',
        poster_name: posterNames[Math.floor(Math.random() * posterNames.length)],
        status: 'open',
        escrow_held: false,
        escrow_amount: 0,
        escrow_released: false,
        contractor_marked_complete: false,
      });
      createdGigs.push(gig);
    }

    return createdGigs;
  }

  // Matching Algorithm (Local Fallback)
  static calculateMatchScore(gig: Partial<LocalGig>, contractor: DemoProfile): {
    total: number;
    breakdown: {
      skills: { score: number; matched: string[] };
      location: { score: number; distance: number };
      pay: { score: number };
      availability: { score: number };
    };
  } {
    // Skills matching (40%)
    const gigSkills = [gig.category, ...gig.title?.split(' ') || []].filter(Boolean);
    const matchedSkills = contractor.skills.filter(s =>
      gigSkills.some(gs => s.toLowerCase().includes(gs.toLowerCase()) || gs.toLowerCase().includes(s.toLowerCase()))
    );
    const skillsScore = matchedSkills.length > 0 ? Math.min(matchedSkills.length * 8, 40) : 10;

    // Location matching (30%)
    const locations = ['Student Union', 'Library', 'East Hall', 'Engineering Quad', 'Music Building', 'Gym', 'North Campus', 'West Campus', 'Downtown'];
    const locDistances: Record<string, number> = {};
    locations.forEach((loc, i) => {
      locDistances[loc] = i * 0.3;
    });
    const distance = Math.abs((locDistances[gig.campus_location || ''] || 2) - (locDistances[contractor.campus_location] || 2));
    const locationScore = gig.is_remote ? 30 : Math.max(0, 30 - distance * 10);

    // Pay matching (20%)
    const payScore = (gig.pay_max || 40) >= contractor.pay_min ? 20 : 10;

    // Availability (10%)
    const availabilityScore = contractor.availability === 'flexible' ? 10 : 7;

    const total = Math.min(99, skillsScore + Math.round(locationScore) + payScore + availabilityScore);

    return {
      total,
      breakdown: {
        skills: { score: skillsScore, matched: matchedSkills.slice(0, 3) },
        location: { score: Math.round(locationScore), distance: Math.round(distance * 10) / 10 },
        pay: { score: payScore },
        availability: { score: availabilityScore },
      },
    };
  }

  static findMatches(gigId: string, userId: string): Array<DemoProfile & { match_score: number; score_breakdown: any }> {
    const gig = this.getGig(gigId);
    if (!gig) return [];

    return DEMO_PROFILES
      .filter(p => p.user_id !== userId)
      .map(contractor => {
        const score = this.calculateMatchScore(gig, contractor);
        return {
          ...contractor,
          match_score: score.total,
          score_breakdown: score.breakdown,
        };
      })
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5);
  }
}

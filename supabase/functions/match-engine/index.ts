import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MatchRequest {
  gig_id: string;
  user_id: string;
  category: string;
  title: string;
  content: string;
  pay_min: number;
  pay_max: number;
  campus_location: string;
  is_remote: boolean;
  skills_required?: string[];
}

interface MatchScore {
  total: number;
  breakdown: {
    skills: { score: number; matched: string[]; missed: string[] };
    location: { score: number; distance: number; maxWalk: number };
    pay: { score: number; gigRange: [number, number]; contractorRange: [number, number] };
    availability: { score: number; compatibility: string };
  };
}

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Distance calculation between campus locations (in miles)
const campusDistances: Record<string, Record<string, number>> = {
  "Student Union": { "Student Union": 0, "Library": 0.3, "East Hall": 0.5, "Engineering Quad": 0.8, "Music Building": 0.4, "Gym": 0.6, "North Campus": 1.2, "West Campus": 1.5, "Downtown": 2.0 },
  "Library": { "Student Union": 0.3, "Library": 0, "East Hall": 0.2, "Engineering Quad": 0.5, "Music Building": 0.3, "Gym": 0.4, "North Campus": 1.0, "West Campus": 1.3, "Downtown": 1.8 },
  "East Hall": { "Student Union": 0.5, "Library": 0.2, "East Hall": 0, "Engineering Quad": 0.3, "Music Building": 0.2, "Gym": 0.3, "North Campus": 0.8, "West Campus": 1.1, "Downtown": 1.6 },
  "Engineering Quad": { "Student Union": 0.8, "Library": 0.5, "East Hall": 0.3, "Engineering Quad": 0, "Music Building": 0.6, "Gym": 0.5, "North Campus": 0.5, "West Campus": 1.0, "Downtown": 1.5 },
  "Music Building": { "Student Union": 0.4, "Library": 0.3, "East Hall": 0.2, "Engineering Quad": 0.6, "Music Building": 0, "Gym": 0.5, "North Campus": 0.9, "West Campus": 1.2, "Downtown": 1.7 },
  "Gym": { "Student Union": 0.6, "Library": 0.4, "East Hall": 0.3, "Engineering Quad": 0.5, "Music Building": 0.5, "Gym": 0, "North Campus": 0.7, "West Campus": 1.0, "Downtown": 1.5 },
  "North Campus": { "Student Union": 1.2, "Library": 1.0, "East Hall": 0.8, "Engineering Quad": 0.5, "Music Building": 0.9, "Gym": 0.7, "North Campus": 0, "West Campus": 0.6, "Downtown": 1.2 },
  "West Campus": { "Student Union": 1.5, "Library": 1.3, "East Hall": 1.1, "Engineering Quad": 1.0, "Music Building": 1.2, "Gym": 1.0, "North Campus": 0.6, "West Campus": 0, "Downtown": 0.8 },
  "Downtown": { "Student Union": 2.0, "Library": 1.8, "East Hall": 1.6, "Engineering Quad": 1.5, "Music Building": 1.7, "Gym": 1.5, "North Campus": 1.2, "West Campus": 0.8, "Downtown": 0 },
  "Remote": { "Student Union": 0, "Library": 0, "East Hall": 0, "Engineering Quad": 0, "Music Building": 0, "Gym": 0, "North Campus": 0, "West Campus": 0, "Downtown": 0 },
};

function getDistance(loc1: string, loc2: string): number {
  if (loc1 === "Remote" || loc2 === "Remote") return 0;
  return campusDistances[loc1]?.[loc2] ?? campusDistances[loc2]?.[loc1] ?? 2.5;
}

function calculateMatchScore(
  gig: MatchRequest,
  contractor: {
    user_id: string;
    name: string;
    skills: string[];
    skills_interests: string[];
    campus_location: string;
    pay_min: number;
    pay_max: number;
    availability: string;
    max_walk_time_mins: number;
  },
  maxWalkMins: number = 20
): MatchScore {
  // Skills matching (40% weight)
  const gigSkills = gig.skills_required || extractSkillsFromText(gig.content + " " + gig.title + " " + gig.category);
  const contractorSkills = [...contractor.skills, ...contractor.skills_interests];
  const matchedSkills = gigSkills.filter((s: string) =>
    contractorSkills.some((cs) => cs.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(cs.toLowerCase()))
  );
  const missedSkills = gigSkills.filter((s: string) => !matchedSkills.includes(s));
  const skillsScore = gigSkills.length > 0 ? (matchedSkills.length / gigSkills.length) * 40 : 20;

  // Location matching (30% weight)
  const distance = getDistance(gig.campus_location, contractor.campus_location);
  const maxDistance = (maxWalkMins / 20) * 1.5; // Assume 1.5 miles = 20 min walk
  let locationScore = 0;
  if (gig.is_remote) {
    locationScore = 30; // Perfect score for remote gigs
  } else if (distance <= maxDistance) {
    locationScore = 30 * (1 - distance / maxDistance);
  } else {
    locationScore = Math.max(0, 30 - (distance - maxDistance) * 5);
  }

  // Pay matching (20% weight)
  const gigPayMin = gig.pay_min;
  const gigPayMax = gig.pay_max;
  const contractorPayMin = contractor.pay_min;
  const contractorPayMax = contractor.pay_max;
  let payScore = 0;
  if (gigPayMin >= contractorPayMin && gigPayMax <= contractorPayMax) {
    payScore = 20; // Gig pay is within contractor's range
  } else if (gigPayMax >= contractorPayMin && gigPayMin <= contractorPayMax) {
    // Partial overlap
    const overlap = Math.min(gigPayMax, contractorPayMax) - Math.max(gigPayMin, contractorPayMin);
    const range = Math.max(gigPayMax - gigPayMin, contractorPayMax - contractorPayMin);
    payScore = (overlap / range) * 20;
  } else {
    payScore = 5; // Some score even if no overlap
  }

  // Availability matching (10% weight)
  const availabilityCompats: Record<string, string> = {
    flexible: "Perfect match",
    mornings: "Available mornings",
    afternoons: "Available afternoons",
    evenings: "Available evenings",
    weekends_only: "Available weekends",
  };
  const availabilityScore = contractor.availability === "flexible" ? 10 : 7;

  const total = Math.round(skillsScore + locationScore + payScore + availabilityScore);

  return {
    total: Math.min(99, Math.max(0, total)),
    breakdown: {
      skills: { score: Math.round(skillsScore), matched: matchedSkills, missed: missedSkills },
      location: { score: Math.round(locationScore), distance: Math.round(distance * 10) / 10, maxWalk: maxWalkMins },
      pay: { score: Math.round(payScore), gigRange: [gigPayMin, gigPayMax], contractorRange: [contractorPayMin, contractorPayMax] },
      availability: { score: availabilityScore, compatibility: availabilityCompats[contractor.availability] || "Compatible" },
    },
  };
}

function extractSkillsFromText(text: string): string[] {
  const skillKeywords = [
    "tutoring", "math", "physics", "chemistry", "biology", "english", "writing", "editing",
    "tech support", "computer", "web development", "python", "java", "programming",
    "design", "graphic design", "illustration", "photoshop", "creative",
    "photography", "video", "content creation",
    "music", "guitar", "piano", "audio", "production",
    "fitness", "sports", "training", "coaching", "gym",
    "cooking", "meal prep", "baking", "nutrition",
    "moving", "furniture", "lifting", "assembly",
    "errands", "delivery", "shopping", "pickup",
    "organization", "cleaning", "decluttering",
  ];

  const lower = text.toLowerCase();
  return skillKeywords.filter((skill) => lower.includes(skill));
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const payload: MatchRequest = await req.json();

    // Fetch all contractor profiles (excluding the poster)
    const { data: contractors, error: contractorError } = await supabase
      .from("user_profiles")
      .select("user_id, name, skills, skills_interests, campus_location, pay_min, pay_max, availability, max_walk_time_mins, email")
      .eq("onboarding_complete", true)
      .neq("user_id", payload.user_id);

    if (contractorError) throw contractorError;

    // Calculate match scores
    const matches = (contractors || [])
      .map((contractor: any) => {
        const score = calculateMatchScore(payload, contractor, 20);
        return {
          id: crypto.randomUUID(),
          matched_user_name: contractor.name,
          matched_user_id: contractor.user_id,
          matched_user_email: contractor.email,
          match_score: score.total,
          score_breakdown: score.breakdown,
          title: payload.title,
          category: payload.category,
          pay_min: payload.pay_min,
          pay_max: payload.pay_max,
          campus_location: contractor.campus_location,
          walk_time_mins: Math.round(score.breakdown.location.distance * 15), // Rough estimate: 15 min/mile
          description: `Skills: ${contractor.skills?.slice(0, 3).join(", ") || "Various"}. Available ${contractor.availability}.`,
        };
      })
      .filter((m) => m.match_score >= 30) // Only return reasonable matches
      .sort((a, b) => b.match_score - a.match_score)
      .slice(0, 5); // Top 5 matches

    return new Response(
      JSON.stringify({ success: true, matches }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

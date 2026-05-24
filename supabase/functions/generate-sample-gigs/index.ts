import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const posterNames = [
  "Taylor Morgan",
  "Casey Brooks",
  "Jamie Rivera",
  "Morgan Reed",
  "Riley Cooper",
  "Quinn Parker",
  "Avery James",
  "Jordan Hayes",
];

const templates = [
  { category: "Tutoring", title: "Need Help with Calculus", desc: "Struggling with derivatives and integrals. Need someone patient!", pay: [25, 45] },
  { category: "Tech Support", title: "MacBook Setup Help", desc: "Just got a new MacBook, need help setting up dev environment.", pay: [30, 50] },
  { category: "Furniture Assembly & Moving", title: "Moving Out of Dorm", desc: "Need help moving boxes to storage unit this weekend.", pay: [40, 70] },
  { category: "Design & Creative", title: "Logo for Student Club", desc: "Need a modern logo for our environmental club.", pay: [50, 100] },
  { category: "Photography", title: "Graduation Photos", desc: "Looking for someone to take grad photos on campus.", pay: [60, 150] },
  { category: "Writing & Editing", title: "Essay Proofreading", desc: "Need a second pair of eyes on my history paper.", pay: [20, 40] },
  { category: "Errands & Delivery", title: "Grocery Pickup", desc: "Pick up groceries from the store near campus.", pay: [15, 30] },
  { category: "Music & Audio", title: "Piano Lessons", desc: "Want to learn piano basics. Complete beginner.", pay: [30, 60] },
  { category: "Fitness & Sports", title: "Running Partner", desc: "Looking for someone to run with early mornings.", pay: [20, 35] },
  { category: "Cooking & Food", title: "Meal Prep for Finals Week", desc: "Need healthy meals prepped for busy study week.", pay: [50, 90] },
];

const locations = [
  "Student Union",
  "Library",
  "East Hall",
  "Engineering Quad",
  "Music Building",
  "Gym",
  "North Campus",
  "West Campus",
];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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
    // Get all user profiles that can receive gigs (both or finder)
    const { data: users, error: userError } = await supabase
      .from("user_profiles")
      .select("user_id, name, skills_interests, campus_location")
      .in("role", ["both", "finder"])
      .eq("onboarding_complete", true);

    if (userError) throw userError;

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "No users available" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate 1-3 sample gigs
    const gigCount = randomInt(1, 3);
    const createdGigs = [];

    for (let i = 0; i < gigCount; i++) {
      const template = randomChoice(templates);
      const posterName = randomChoice(posterNames);
      const location = randomChoice(locations);
      const payMin = randomInt(template.pay[0], template.pay[1] - 10);
      const payMax = randomInt(payMin + 5, template.pay[1]);

      // Create a pseudo poster user
      const posterUserId = crypto.randomUUID();

      // Insert the gig
      const { data: gig, error: gigError } = await supabase
        .from("gigs")
        .insert([{
          user_id: posterUserId,
          type: "post",
          title: template.title,
          content: template.desc,
          category: template.category,
          pay_min: payMin,
          pay_max: payMax,
          currency: "USD",
          campus_location: location,
          is_remote: false,
          poster_name: posterName,
          status: "open",
          escrow_held: false,
          escrow_amount: 0,
          escrow_released: false,
        }])
        .select()
        .single();

      if (gigError) {
        console.error("Error creating gig:", gigError);
        continue;
      }

      createdGigs.push({
        id: gig.id,
        title: template.title,
        category: template.category,
        pay_min: payMin,
        pay_max: payMax,
        location: location,
        poster_name: posterName,
      });

      // Notify users with matching skills
      const matchingUsers = users.filter((u) => {
        const userSkills = u.skills_interests || [];
        return userSkills.some((skill: string) =>
          skill.toLowerCase().includes(template.category.toLowerCase()) ||
          template.category.toLowerCase().includes(skill.toLowerCase())
        );
      });

      if (matchingUsers.length > 0) {
        const notifications = matchingUsers.slice(0, 5).map((u) => ({
          user_id: u.user_id,
          type: "new_gig",
          title: "New Gig Available!",
          message: template.title + " - $" + payMin + " to $" + payMax + " at " + location,
          data: { gig_id: gig.id, category: template.category },
        }));

        await supabase.from("notifications").insert(notifications);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Generated " + createdGigs.length + " sample gigs",
        gigs: createdGigs,
      }),
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

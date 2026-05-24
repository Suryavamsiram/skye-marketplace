import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// MISTRAL_API_KEY should be set in Supabase Edge Function secrets
// For now, we'll use an env variable that can be configured
const MISTRAL_API_KEY = Deno.env.get("MISTRAL_API_KEY") || "";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface MistralRequest {
  messages: ChatMessage[];
  user_profile?: {
    name: string;
    role: string;
    skills_interests: string[];
    campus_location: string;
    pay_min: number;
    pay_max: number;
  };
  conversation_phase?: string;
  gig_data?: {
    mode: "post" | "search";
    category: string;
    title: string;
    description: string;
    campus_location: string;
    pay_min: number | null;
    pay_max: number | null;
  };
}

const SYSTEM_PROMPT = "You are Milo, a friendly and helpful campus gig assistant. You help students post gigs (tasks they need done) and find gigs (ways to earn money).\n\nYour personality:\n- Casual, friendly, and encouraging\n- Use everyday language, no fancy words\n- Enthusiastic about helping students connect\n- Patient and supportive\n\nYour goals:\n1. Understand if user wants to POST a gig (need help) or SEARCH for gigs (want to earn)\n2. Collect gig details naturally through conversation: category, location, pay range\n3. Confirm details before posting\n4. Be helpful and guide users through the process\n\nImportant rules:\n- Never ask for more than 1-2 pieces of info at a time\n- Keep responses short (2-3 sentences max usually)\n- Use the user's name if you know it\n- Be encouraging and supportive\n- If something is unclear, ask a simple clarifying question\n- Suggest reasonable pay ranges based on the task\n- Common campus locations: Student Union, Library, East Hall, Engineering Quad, Music Building, Gym, North Campus, West Campus\n- Common gig categories: Tutoring, Tech Support, Furniture Assembly & Moving, Design & Creative, Photography, Writing & Editing, Errands & Delivery, Music & Audio, Fitness & Sports, Cooking & Food\n\nResponse format:\nAlways respond in plain text, friendly tone. Keep it natural and conversational.";

async function callMistral(messages: ChatMessage[]): Promise<string> {
  if (!MISTRAL_API_KEY) {
    // Fallback to rule-based responses if Mistral not configured
    return generateFallbackResponse(messages);
  }

  try {
    const authHeader = "Bearer " + MISTRAL_API_KEY;
    const response = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
      },
      body: JSON.stringify({
        model: "mistral-small-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      const errMsg = "Mistral API error: " + response.status;
      throw new Error(errMsg);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Sorry, I couldn't process that. Could you try again?";
  } catch (error) {
    console.error("Mistral API error:", error);
    return generateFallbackResponse(messages);
  }
}

function generateFallbackResponse(messages: ChatMessage[]): string {
  const lastUserMessage = messages.filter((m) => m.role === "user").pop()?.content.toLowerCase() || "";

  if (lastUserMessage.includes("post") || lastUserMessage.includes("need help")) {
    return "Great! What kind of help do you need? For example: tutoring, moving stuff, tech support...";
  }

  if (lastUserMessage.includes("find") || lastUserMessage.includes("earn") || lastUserMessage.includes("search")) {
    return "Awesome! What kind of gigs are you looking for? Any particular skills you want to use?";
  }

  if (lastUserMessage.includes("tutor") || lastUserMessage.includes("math") || lastUserMessage.includes("physics")) {
    return "Tutoring gigs are popular! What's your comfort level with the subject, and where on campus would you prefer to meet?";
  }

  if (lastUserMessage.includes("tech") || lastUserMessage.includes("computer") || lastUserMessage.includes("laptop")) {
    return "Tech help is always in demand! Is this for setup, repair, or something else? And what location works for you?";
  }

  if (lastUserMessage.includes("moving") || lastUserMessage.includes("furniture")) {
    return "Moving help - sounds like a workout! What building are you in, and roughly how much stuff needs moving?";
  }

  if (lastUserMessage.includes("yes") || lastUserMessage.includes("correct") || lastUserMessage.includes("right")) {
    return "Perfect! I'll post this gig for you. Give me a moment to find some matches...";
  }

  if (lastUserMessage.includes("no") || lastUserMessage.includes("wrong")) {
    return "No worries! What would you like to change - the location, pay, or type of gig?";
  }

  if (lastUserMessage.includes("$") || lastUserMessage.includes("pay") || lastUserMessage.includes("dollar")) {
    return "Got it! Let me confirm the details before I post this gig...";
  }

  // Default response
  return "Hey there! I can help you post a gig (if you need something done) or find gigs (if you want to earn). What sounds good?";
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
    const payload: MistralRequest = await req.json();

    // Build context from profile and gig data
    const contextualMessages = [...payload.messages];

    if (payload.user_profile) {
      const interests = payload.user_profile.skills_interests?.join(", ") || "various things";
      const contextContent = "The user's name is " + payload.user_profile.name +
        ". They are a " + payload.user_profile.role +
        ". Their interests include: " + interests +
        ". They're usually around " + payload.user_profile.campus_location + ".";
      const contextMsg: ChatMessage = {
        role: "system",
        content: contextContent,
      };
      contextualMessages.unshift(contextMsg);
    }

    if (payload.gig_data) {
      const gigContent = "Current gig being discussed: " + (payload.gig_data.mode || "posting") +
        " - " + (payload.gig_data.title || payload.gig_data.category || "unknown") +
        ". Location: " + (payload.gig_data.campus_location || "TBD") +
        ". Pay: $" + (payload.gig_data.pay_min || "?") + " - $" + (payload.gig_data.pay_max || "?") +
        ". Description: " + (payload.gig_data.description || "TBD");
      const gigContext: ChatMessage = {
        role: "system",
        content: gigContent,
      };
      contextualMessages.unshift(gigContext);
    }

    const response = await callMistral(contextualMessages);

    return new Response(
      JSON.stringify({ success: true, response }),
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

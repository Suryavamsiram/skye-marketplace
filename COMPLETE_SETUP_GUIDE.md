# Skye Matching Marketplace - Complete Setup Guide

## What Are Real-Time Subscriptions?

**Real-time subscriptions** in Supabase allow your frontend to receive instant updates when data changes in the database, without polling. This is powered by PostgreSQL's LISTEN/NOTIFY system and WebSockets.

**How it works:**
1. Your frontend subscribes to a channel (e.g., "mentorship_requests")
2. When a row is INSERTED, UPDATED, or DELETED in the database
3. Supabase's Realtime server detects the change via PostgreSQL replication
4. The change is immediately pushed to all subscribed clients via WebSocket
5. Your UI updates automatically

**Example:**
```typescript
// Subscribe to new mentorship requests
supabase
  .channel('mentorship_requests')
  .on(
    'postgres_changes',
    { event: 'INSERT', schema: 'public', table: 'mentorship_requests' },
    (payload) => {
      console.log('New request:', payload.new);
      // Update your UI immediately
    }
  )
  .subscribe();
```

This means when a mentee submits a request, the mentor's radar will show it **instantly** - no page refresh or polling needed.

---

## Database Setup

### Step 1: Create Tables

Run this SQL in your Supabase SQL Editor:

```sql
/*
  # Skye Matching Marketplace Schema
*/

-- Mentors Table
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0.00,
  total_sessions INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('available', 'busy', 'offline')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentees Table
CREATE TABLE IF NOT EXISTS mentees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mentorship Requests Table
CREATE TABLE IF NOT EXISTS mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL REFERENCES mentees(id) ON DELETE CASCADE,
  mentor_id UUID REFERENCES mentors(id) ON DELETE SET NULL,
  topic TEXT NOT NULL,
  description TEXT NOT NULL,
  urgency TEXT NOT NULL DEFAULT 'medium' CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'finding_mentors', 'awaiting_acceptance',
    'accepted', 'active', 'expired', 'declined', 'completed'
  )),
  matching_score INTEGER,
  time_remaining INTEGER DEFAULT 45,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_type TEXT NOT NULL CHECK (log_type IN ('system', 'matrix', 'heartbeat', 'webhook', 'error')),
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentors(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_status ON mentorship_requests(status);
CREATE INDEX IF NOT EXISTS idx_mentorship_requests_created ON mentorship_requests(created_at DESC);

-- Enable RLS
ALTER TABLE mentors ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentees ENABLE ROW LEVEL SECURITY;
ALTER TABLE mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read mentors" ON mentors FOR SELECT USING (true);
CREATE POLICY "Public read mentees" ON mentees FOR SELECT USING (true);
CREATE POLICY "Public read requests" ON mentorship_requests FOR SELECT USING (true);
CREATE POLICY "Public insert requests" ON mentorship_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update requests" ON mentorship_requests FOR UPDATE USING (true);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mentors_updated_at
  BEFORE UPDATE ON mentors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentees_updated_at
  BEFORE UPDATE ON mentees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mentorship_requests_updated_at
  BEFORE UPDATE ON mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Step 2: Enable Realtime

In your Supabase dashboard:
1. Go to **Database** → **Replication**
2. Enable replication for these tables:
   - `mentorship_requests`
   - `mentors`
   - `mentees`

---

## Heartbeat Cron: How It Works

The **heartbeat cron** is a background process that automatically checks for expired mentorship requests. It runs every 5-10 seconds and:

1. Finds all requests with status `awaiting_acceptance` that have `time_remaining <= 0`
2. Marks them as `expired`
3. Logs the action to `system_logs`
4. Real-time subscriptions notify all connected clients

### Why run it on the backend?

- **Server-side reliability**: Runs continuously even if mentors disconnect
- **No user intervention**: Automatic, not manual
- **Scalable**: One cron job handles all requests

### Deployment Options

**Option 1: Supabase Edge Function (Recommended)**

Create `supabase/functions/heartbeat-cron/index.ts`:

```typescript
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'npm:@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Find expired requests
    const { data: expiredRequests, error } = await supabase
      .from('mentorship_requests')
      .select('*')
      .eq('status', 'awaiting_acceptance')
      .lte('time_remaining', 0);

    if (error) throw error;

    const results = [];

    for (const request of expiredRequests || []) {
      // Update status to expired
      await supabase
        .from('mentorship_requests')
        .update({ status: 'expired' })
        .eq('id', request.id);

      // Log the action
      await supabase
        .from('system_logs')
        .insert([{
          log_type: 'heartbeat',
          message: `Request ${request.id} expired due to mentor timeout`,
          metadata: { request_id: request.id }
        }]);

      results.push(request.id);
    }

    return new Response(JSON.stringify({
      success: true,
      expired_count: results.length,
      expired_requests: results
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

**Set up cron trigger:**
```sql
-- In Supabase SQL Editor, create a cron job:
SELECT cron.schedule(
  'heartbeat-check',
  '*/10 seconds',  -- Runs every 10 seconds
  $$
  SELECT
    net.http_post(
      url := 'https://your-project-id.supabase.co/functions/v1/heartbeat-cron',
      headers := '{"Content-Type": "application/json"}'::jsonb,
      body := '{}'::jsonb
    );
  $$
);
```

**Option 2: External Cron Service**

Use a service like cron-job.org or AWS EventBridge to call your edge function every 10 seconds.

**Option 3: Database Trigger (Simpler)**

If you don't want an external cron, use a PostgreSQL trigger:

```sql
-- Auto-expire requests when time_remaining hits 0
CREATE OR REPLACE FUNCTION auto_expire_requests()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.time_remaining <= 0 AND NEW.status = 'awaiting_acceptance' THEN
    NEW.status := 'expired';

    INSERT INTO system_logs (log_type, message, metadata)
    VALUES ('heartbeat', 'Request expired due to timeout', '{"auto": true}'::jsonb);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_expire
  BEFORE UPDATE ON mentorship_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_expire_requests();
```

---

## Environment Variables

Create `.env` file:

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: Supabase Dashboard → Settings → API

---

## Running Locally

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will run at `http://localhost:5173`

**Important:** Without Supabase credentials, the UI will show "Database Not Connected" messages.

---

## Production Deployment

### Build for Production:
```bash
npm run build
```

### Deploy to Vercel/Netlify:
1. Connect your repository
2. Set environment variables
3. Deploy

### Update Frontend Time Remaining

In a real production app, the countdown timer should decrement on the **server-side** via the heartbeat cron. For now, the frontend handles the countdown visually, but the actual expiration happens on the backend.

To have the server manage countdown:

```sql
-- Add a function to decrement time_remaining
CREATE OR REPLACE FUNCTION decrement_time_remaining()
RETURNS void AS $$
BEGIN
  UPDATE mentorship_requests
  SET time_remaining = GREATEST(time_remaining - 1, 0)
  WHERE status = 'awaiting_acceptance'
    AND time_remaining > 0;
END;
$$ LANGUAGE plpgsql;

-- Call this every second via cron or pg_cron
SELECT cron.schedule(
  'decrement-countdown',
  '*/1 seconds',
  $$SELECT decrement_time_remaining();$$
);
```

This ensures timers are accurate even if users close their browsers.

---

## Architecture Flow

```
[Mentee submits request]
        ↓
[INSERT to mentorship_requests]
        ↓
[Realtime notifies subscribed mentors]  ← WebSocket push
        ↓
[Mentor sees alert on radar]
        ↓
[Mentor clicks Accept/Decline]
        ↓
[UPDATE request status]
        ↓
[Realtime notifies mentee]  ← Instant confirmation
        ↓
[Session becomes active]

If mentor doesn't respond in 45 seconds:
[Heartbeat cron detects timeout]
        ↓
[UPDATE status to 'expired']
        ↓
[Realtime notifies mentor]  ← Alert disappears
        ↓
[Request can be re-routed to next best mentor]
```

---

## Key Differences from Mock Version

| Feature | Mock Version | Production Version |
|---------|-------------|-------------------|
| Data storage | In-memory state | PostgreSQL database |
| Real-time updates | Simulated with setTimeout | WebSocket subscriptions |
| Countdown timer | Frontend only | Server-side via cron |
| Request expiration | Manual trigger | Automatic heartbeat cron |
| Mentor profiles | Hardcoded array | Database table |
| Persistence | Lost on refresh | Survives server restarts |
| Scalability | Single browser | Multiple concurrent users |

---

## Next Steps

1. **Set up Supabase** using the SQL schema above
2. **Configure `.env`** with your credentials
3. **Enable Realtime** for the tables
4. **Deploy the heartbeat cron** (choose one option)
5. **Test the flow**: Submit a request as mentee, accept as mentor

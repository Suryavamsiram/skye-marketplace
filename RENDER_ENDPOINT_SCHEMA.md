# Render Endpoint Schema Documentation

## Overview
This document describes the request and response schema for the matching/render endpoint used by Milo.

## Endpoint
**URL**: Configured in `/src/lib/webhook.ts` as `BACKEND_WEBHOOK_URL`  
**Method**: `POST`  
**Content-Type**: `application/json`

---

## Request Schema

### WebhookPayload

```typescript
{
  "event_type": "CLIENT_REQUEST_DELEGATION",
  "timestamp": "2025-01-15T10:30:00.000Z",  // ISO 8601 format
  "user_profile": {
    "user_id": "string",                    // User's unique ID
    "role": "poster" | "finder" | "both",   // User role
    "location": "string",                   // Campus location (e.g., "East Hall")
    "max_walk_time_mins": 10 | 20 | 40,     // Maximum walking distance in minutes
    "payment_range": {
      "min": number,                        // Minimum pay rate (USD)
      "max": number                         // Maximum pay rate (USD)
    },
    "skills_interests": ["string"]          // Array of skills/interests
  },
  "request_details": {
    "raw_message": "string",                // Original user message
    "extracted_topic": "string",            // Extracted topic/category
    "gig_type": "post" | "search",          // Type of gig
    "category": "string",                   // Category (e.g., "Tutoring", "Tech Support")
    "title": "string",                      // Gig title
    "content": "string",                    // Gig description
    "pay_min": number,                      // Minimum pay for this gig
    "pay_max": number,                      // Maximum pay for this gig
    "campus_location": "string",            // Gig location
    "is_remote": boolean,                   // Whether gig is remote
    "gig_id": "string"                      // Unique gig identifier
  }
}
Example Request
{
  "event_type": "CLIENT_REQUEST_DELEGATION",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "user_profile": {
    "user_id": "abc-123-def",
    "role": "poster",
    "location": "Student Union",
    "max_walk_time_mins": 20,
    "payment_range": {
      "min": 20,
      "max": 50
    },
    "skills_interests": ["Tutoring", "Math", "SAT Prep"]
  },
  "request_details": {
    "raw_message": "I need help with calculus homework this weekend",
    "extracted_topic": "Academic Help",
    "gig_type": "post",
    "category": "Tutoring",
    "title": "Calculus Help Needed",
    "content": "Need assistance with derivatives and integrals for my calculus course",
    "pay_min": 25,
    "pay_max": 40,
    "campus_location": "Library",
    "is_remote": false,
    "gig_id": "gig-xyz-789"
  }
}
Response Schema
WebhookResponse
{
  "success": boolean,                       // Whether matching was successful
  "matches": [                              // Array of matched users/gigs
    {
      "id": "string",                       // Unique match ID
      "matched_user_name": "string",        // Name of matched user
      "matched_user_id": "string",          // User ID of matched user
      "match_score": number,                // Match percentage (0-100)
      "title": "string",                    // Gig/match title
      "category": "string",                 // Category
      "pay_min": number,                    // Minimum pay
      "pay_max": number,                    // Maximum pay
      "campus_location": "string",          // Location
      "walk_time_mins": number,             // Walking distance in minutes
      "description": "string"               // Match description
    }
  ],
  "message": "string"                       // Optional message (for errors)
}
Example Success Response
{
  "success": true,
  "matches": [
    {
      "id": "match-abc-123",
      "matched_user_name": "Alex Chen",
      "matched_user_id": "user-456",
      "match_score": 95,
      "title": "Calculus Help Needed",
      "category": "Tutoring",
      "pay_min": 25,
      "pay_max": 40,
      "campus_location": "Library",
      "walk_time_mins": 5,
      "description": "Experienced with calculus tutoring. Available immediately."
    },
    {
      "id": "match-def-456",
      "matched_user_name": "Jordan Smith",
      "matched_user_id": "user-789",
      "match_score": 88,
      "title": "Calculus Help Needed",
      "category": "Tutoring",
      "pay_min": 25,
      "pay_max": 40,
      "campus_location": "Student Union",
      "walk_time_mins": 12,
      "description": "Math major with tutoring experience in calculus."
    }
  ]
}
Example Error Response
{
  "success": false,
  "matches": [],
  "message": "No matching contractors found for this gig"
}
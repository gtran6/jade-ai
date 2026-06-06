// lib/supabase.ts — Jade AI Supabase client
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://slldfyvaoixazeqkcgsp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsbGRmeXZhb2l4YXplcWtjZ3NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODk0MjksImV4cCI6MjA5NjI2NTQyOX0.YxF5H-vpbq-g5jRuLGYn9_jyC5k53ypcTVqUZQ48Dfk';
export const SALON_ID = 'aa567339-4580-43ff-abb1-87b02359834e';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export interface Booking {
  id: string;
  salon_id: string;
  client_name: string | null;
  client_phone: string | null;
  service: string | null;
  start_time: string;
  end_time: string;
  technician_name: string | null;
  calendar_event_id: string | null;
  status: 'confirmed' | 'pending' | 'cancelled';
  created_at: string;
}

export interface MissedCall {
  id: string;
  salon_id: string;
  caller_phone: string | null;
  reason: string | null;
  transcript: string | null;
  status: 'new' | 'dismissed';
  created_at: string;
}

export type FeedItem =
  | ({ type: 'booking' } & Booking)
  | ({ type: 'missed'  } & MissedCall);
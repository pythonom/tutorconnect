import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'tutor' | 'learner';
  created_at: string;
  updated_at: string;
}

export interface TutorProfile {
  id: string;
  user_id: string;
  bio: string;
  skills: string[];
  hourly_rate: number;
  rating: number;
  total_reviews: number;
  availability: any;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  tutor_id: string;
  learner_id: string;
  subject: string;
  session_type: '1-on-1' | 'group';
  scheduled_at: string;
  duration_minutes: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meeting_link: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  session_id: string;
  tutor_id: string;
  learner_id: string;
  rating: number;
  comment: string;
  created_at: string;
}

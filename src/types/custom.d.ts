// src/types/custom.d.ts
export {};

export interface Session {
  id: number | string; // ✅ works for backend numeric IDs
  tutor_id?: string;
  learner_id?: string;
  subject?: string;
  scheduled_at?: string;
  duration_minutes?: number;
  session_type?: string;
  status?: string;
  notes?: string;
}

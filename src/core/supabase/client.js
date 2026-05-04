import { SUPABASE_URL, SUPABASE_KEY } from '../config/app.config.js';

export const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true }
});
window.supabase = supabase; // متاح للنطاق العالمي مؤقتاً

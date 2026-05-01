// =============================================
// نظام المطاعم - Restaurant SaaS
// عميل Supabase (بالمفاتيح النهائية)
// =============================================

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// 🔑 مفاتيح Supabase الخاصة بك
const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

// إنشاء العميل وتخزينه في window
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'Accept-Language': 'ar' },
  },
});

// جعله متاحاً لجميع الوحدات
window.supabase = supabase;

// تصديره للاستخدام المباشر
export { supabase };

// دالة التهيئة أصبحت فارغة للتوافق
export function initSupabase() {
  if (!supabase) console.error('فشل تحميل Supabase');
}

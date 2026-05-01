// =============================================
// نظام المطاعم - Restaurant SaaS
// عميل Supabase - تم تحديثه بمفاتيح المشروع
// =============================================

// استيراد مكتبة Supabase من CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ========== بيانات الاتصال الفعلية ==========
const SUPABASE_URL = 'https://xisosjmybqmuzveffhdb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhpc29zam15YnFtdXp2ZWZmaGRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwMzg2OTgsImV4cCI6MjA4MzYxNDY5OH0.w6ozzvUv0VG7PVizc0TFpwfYq8x50AqqOkwrlQ1eSLM';

// ========== إنشاء العميل ==========
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'Accept-Language': 'ar' }
  }
});

// جعله متاحًا عالميًا لسهولة الاستخدام في الملفات الأخرى
window.supabase = supabase;

console.log('✅ تم الاتصال بـ Supabase بنجاح');

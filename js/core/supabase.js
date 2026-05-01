// =============================================
// نظام المطاعم - Restaurant SaaS
// عميل Supabase
// =============================================

// استيراد مكتبة Supabase من CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// ========== إعدادات الاتصال ==========
// ⚠️ سيتم استبدال هذه القيم بالمفاتيح الحقيقية التي سترسلها
const SUPABASE_URL = 'YOUR_SUPABASE_URL';        // مثال: https://xxxxx.supabase.co
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // مفتاح عام (anon key)

// ========== إنشاء العميل ==========
export let supabase;

export function initSupabase() {
  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
      global: {
        // إضافة اللغة العربية للطلبات
        headers: { 'Accept-Language': 'ar' }
      }
    });
    console.log('✅ تم الاتصال بـ Supabase بنجاح');
  } catch (error) {
    console.error('❌ فشل الاتصال بـ Supabase:', error.message);
    throw error;
  }
}
